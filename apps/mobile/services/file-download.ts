import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const DOWNLOAD_DIRECTORY_STORAGE_KEY = 'study_materials_download_directory_uri';
const DEFAULT_DOWNLOAD_FILE_NAME = 'tai-lieu';

export type DeviceDownloadProgress = {
  stage: 'preparing' | 'downloading' | 'saving';
  transferredBytes: number;
  totalBytes: number | null;
  progress: number | null;
};

export type DownloadRemoteFileOptions = {
  url: string;
  fileName?: string | null;
  mimeType?: string | null;
  onProgress?: (progress: DeviceDownloadProgress) => void;
};

export type DownloadRemoteFileResult = {
  fileUri: string;
  savedFileName: string;
  locationLabel: string;
};

function sanitizeFileName(fileName?: string | null) {
  const candidate = (fileName ?? DEFAULT_DOWNLOAD_FILE_NAME).trim();
  const normalized = candidate
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\.+$/g, '')
    .trim();

  return normalized || DEFAULT_DOWNLOAD_FILE_NAME;
}

function splitFileName(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex <= 0 || lastDotIndex === fileName.length - 1) {
    return {
      baseName: fileName,
      extension: '',
    };
  }

  return {
    baseName: fileName.slice(0, lastDotIndex),
    extension: fileName.slice(lastDotIndex + 1),
  };
}

function buildSafeFileName(fileName?: string | null) {
  return sanitizeFileName(fileName);
}

function formatAndroidLocation(uri: string) {
  try {
    const decoded = decodeURIComponent(uri);
    const documentMatch = decoded.match(/\/document\/primary:([^?#]+)/);
    if (documentMatch?.[1]) {
      return `Bộ nhớ trong/${documentMatch[1]}`;
    }

    const treeMatch = decoded.match(/\/tree\/primary:([^?#]+)/);
    if (treeMatch?.[1]) {
      return `Bộ nhớ trong/${treeMatch[1]}`;
    }

    return decoded;
  } catch {
    return uri;
  }
}

function createProgressPayload(
  stage: DeviceDownloadProgress['stage'],
  transferredBytes: number,
  totalBytes: number | null,
): DeviceDownloadProgress {
  const progress =
    totalBytes && totalBytes > 0 ? Math.min(1, transferredBytes / totalBytes) : null;

  return {
    stage,
    transferredBytes,
    totalBytes,
    progress,
  };
}

async function ensureDirectoryAsync(directoryUri: string) {
  await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
}

async function createTempFileUri(fileName: string) {
  if (!FileSystem.cacheDirectory) {
    throw new Error('Thiết bị chưa sẵn sàng để tải file lúc này.');
  }

  const downloadsDirectory = `${FileSystem.cacheDirectory}study-materials-downloads/`;
  await ensureDirectoryAsync(downloadsDirectory);
  return `${downloadsDirectory}${Date.now()}-${fileName}`;
}

async function requestAndroidDirectoryPermission() {
  const initialUri = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Download');
  const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(
    initialUri,
  );

  if (!permission.granted) {
    throw new Error('Bạn chưa cấp quyền chọn thư mục lưu file.');
  }

  await AsyncStorage.setItem(DOWNLOAD_DIRECTORY_STORAGE_KEY, permission.directoryUri);
  return permission.directoryUri;
}

async function resolveAndroidDirectoryUri() {
  const cachedDirectoryUri = await AsyncStorage.getItem(DOWNLOAD_DIRECTORY_STORAGE_KEY);
  if (cachedDirectoryUri) {
    return cachedDirectoryUri;
  }

  return requestAndroidDirectoryPermission();
}

async function createUniqueSafFileUri(
  directoryUri: string,
  fileName: string,
  mimeType: string,
) {
  const { baseName } = splitFileName(fileName);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidateBaseName =
      attempt === 0 ? baseName : `${baseName}-${new Date().getTime()}-${attempt}`;

    try {
      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        directoryUri,
        candidateBaseName,
        mimeType,
      );
      return {
        fileUri,
        savedFileName: fileName,
      };
    } catch (error) {
      if (attempt === 4) {
        throw error;
      }
    }
  }

  throw new Error('Không thể tạo file lưu trên thiết bị.');
}

async function persistFileToAndroidStorage(
  localFileUri: string,
  fileName: string,
  mimeType: string,
) {
  const writeToDirectory = async (directoryUri: string) => {
    const base64Contents = await FileSystem.readAsStringAsync(localFileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const createdFile = await createUniqueSafFileUri(directoryUri, fileName, mimeType);

    await FileSystem.StorageAccessFramework.writeAsStringAsync(
      createdFile.fileUri,
      base64Contents,
      {
        encoding: FileSystem.EncodingType.Base64,
      },
    );

    return {
      fileUri: createdFile.fileUri,
      savedFileName: createdFile.savedFileName,
      locationLabel: formatAndroidLocation(createdFile.fileUri),
    };
  };

  const cachedDirectoryUri = await AsyncStorage.getItem(DOWNLOAD_DIRECTORY_STORAGE_KEY);
  if (cachedDirectoryUri) {
    try {
      return await writeToDirectory(cachedDirectoryUri);
    } catch {
      await AsyncStorage.removeItem(DOWNLOAD_DIRECTORY_STORAGE_KEY);
    }
  }

  const directoryUri = await resolveAndroidDirectoryUri();
  return writeToDirectory(directoryUri);
}

async function persistFileToAppStorage(localFileUri: string, fileName: string) {
  const baseDirectory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!baseDirectory) {
    throw new Error('Thiết bị chưa sẵn sàng để lưu file lúc này.');
  }

  const downloadsDirectory = `${baseDirectory}study-materials-downloads/`;
  await ensureDirectoryAsync(downloadsDirectory);

  const targetUri = `${downloadsDirectory}${Date.now()}-${fileName}`;
  await FileSystem.moveAsync({
    from: localFileUri,
    to: targetUri,
  });

  return {
    fileUri: targetUri,
    savedFileName: fileName,
    locationLabel: `Bộ nhớ ứng dụng/${fileName}`,
  };
}

export async function downloadRemoteFileToDevice({
  url,
  fileName,
  mimeType,
  onProgress,
}: DownloadRemoteFileOptions): Promise<DownloadRemoteFileResult> {
  const safeFileName = buildSafeFileName(fileName);
  const normalizedMimeType = mimeType?.trim() || 'application/octet-stream';

  onProgress?.(createProgressPayload('preparing', 0, null));

  const tempFileUri = await createTempFileUri(safeFileName);
  const downloadTask = FileSystem.createDownloadResumable(
    url,
    tempFileUri,
    {},
    (progressEvent) => {
      const expectedBytes =
        progressEvent.totalBytesExpectedToWrite > 0
          ? progressEvent.totalBytesExpectedToWrite
          : null;

      onProgress?.(
        createProgressPayload(
          'downloading',
          progressEvent.totalBytesWritten,
          expectedBytes,
        ),
      );
    },
  );

  const downloadResult = await downloadTask.downloadAsync();
  if (!downloadResult) {
    throw new Error('Đã hủy tải file.');
  }

  onProgress?.(
    createProgressPayload(
      'saving',
      downloadResult.status === 200 ? 1 : 0,
      1,
    ),
  );

  if (Platform.OS === 'android') {
    try {
      return await persistFileToAndroidStorage(
        downloadResult.uri,
        safeFileName,
        normalizedMimeType,
      );
    } finally {
      await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true }).catch(() => undefined);
    }
  }

  return persistFileToAppStorage(downloadResult.uri, safeFileName);
}
