import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { downloadRemoteFileToDevice } from './file-download';

describe('downloadRemoteFileToDevice', () => {
  const originalPlatform = Platform.OS;

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatform,
    });
  });

  it('downloads a file, reports progress, and saves it to android storage', async () => {
    const onProgress = jest.fn();

    const result = await downloadRemoteFileToDevice({
      url: 'https://cdn.example.com/materials/de-thi.pdf',
      fileName: 'de-thi.pdf',
      mimeType: 'application/pdf',
      onProgress,
    });

    expect(FileSystem.createDownloadResumable).toHaveBeenCalled();
    expect(FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync).toHaveBeenCalled();
    expect(FileSystem.StorageAccessFramework.createFileAsync).toHaveBeenCalled();
    expect(FileSystem.StorageAccessFramework.writeAsStringAsync).toHaveBeenCalledWith(
      'content://com.android.externalstorage.documents/tree/primary%3ADownload/document/primary%3ADownload%2Ffile.pdf',
      'base64-contents',
      { encoding: 'base64' },
    );
    expect(onProgress.mock.calls.map(([progress]) => progress.stage)).toEqual([
      'preparing',
      'downloading',
      'saving',
    ]);
    expect(result.savedFileName).toBe('de-thi.pdf');
    expect(result.locationLabel).toBe('Bộ nhớ trong/Download/file.pdf');
  });

  it('decodes encoded file names before saving to device storage', async () => {
    const result = await downloadRemoteFileToDevice({
      url: 'https://cdn.example.com/materials/giao-trinh.pdf',
      fileName: 'Copy%20of%20Gi%C3%A1o%20tr%C3%ACnh.pdf',
      mimeType: 'application/pdf',
    });

    expect(FileSystem.StorageAccessFramework.createFileAsync).toHaveBeenCalledWith(
      expect.any(String),
      'Copy of Giáo trình',
      'application/pdf',
    );
    expect(result.savedFileName).toBe('Copy of Giáo trình.pdf');
  });
});
