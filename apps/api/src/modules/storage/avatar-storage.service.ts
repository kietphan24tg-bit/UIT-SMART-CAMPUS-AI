import { createHash, createHmac, randomUUID } from 'node:crypto';

import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ALLOWED_AVATAR_MIME_TYPES,
  ALLOWED_STUDY_MATERIAL_MIME_TYPES,
  MAX_AVATAR_UPLOAD_SIZE_BYTES,
  MAX_STUDY_MATERIAL_UPLOAD_SIZE_BYTES,
} from './avatar-upload.constants';

export interface AvatarUploadFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname?: string;
}

export interface UploadedAvatarAsset {
  key: string;
  avatarUrl: string;
}

export interface UploadedCanteenProductImageAsset {
  key: string;
  imageUrl: string;
}

export interface UploadedLibraryBookCoverAsset {
  key: string;
  imageUrl: string;
}

export interface UploadedStudyMaterialAsset {
  key: string;
  fileUrl: string;
}

@Injectable()
export class AvatarStorageService {
  private readonly bucket: string;
  private readonly endpoint: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly region: string;
  private readonly publicBaseUrl: string | null;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('AVATAR_STORAGE_BUCKET', '').trim();
    this.endpoint = this.normalizeEndpoint(
      this.configService.get<string>('AVATAR_STORAGE_ENDPOINT', '').trim(),
    );
    this.accessKeyId = this.configService.get<string>('AVATAR_STORAGE_ACCESS_KEY_ID', '').trim();
    this.secretAccessKey = this.configService
      .get<string>('AVATAR_STORAGE_SECRET_ACCESS_KEY', '')
      .trim();
    this.region = this.configService.get<string>('AVATAR_STORAGE_REGION', 'us-east-1');
    this.publicBaseUrl = this.normalizeOptionalBaseUrl(
      this.configService.get<string>('AVATAR_STORAGE_PUBLIC_BASE_URL', ''),
    );
  }

  async uploadAvatar(userId: string, file: AvatarUploadFile): Promise<UploadedAvatarAsset> {
    const key = this.buildScopedImageKey(['avatars', userId], file.mimetype);
    const publicUrl = await this.uploadImageObject(key, file);

    return {
      key,
      avatarUrl: publicUrl,
    };
  }

  async uploadCanteenProductImage(
    actorId: string,
    file: AvatarUploadFile,
  ): Promise<UploadedCanteenProductImageAsset> {
    const key = this.buildScopedImageKey(['canteen-products', actorId], file.mimetype);
    const publicUrl = await this.uploadImageObject(key, file);

    return {
      key,
      imageUrl: publicUrl,
    };
  }

  async uploadLibraryBookCover(
    actorId: string,
    file: AvatarUploadFile,
  ): Promise<UploadedLibraryBookCoverAsset> {
    const key = this.buildScopedImageKey(['library-books', actorId], file.mimetype);
    const publicUrl = await this.uploadImageObject(key, file);

    return {
      key,
      imageUrl: publicUrl,
    };
  }

  async uploadStudyMaterialFile(
    actorId: string,
    file: AvatarUploadFile,
  ): Promise<UploadedStudyMaterialAsset> {
    const key = this.buildScopedFileKey(['study-materials', actorId], file.mimetype);
    const publicUrl = await this.uploadFileObject(key, file);

    return {
      key,
      fileUrl: publicUrl,
    };
  }

  private async uploadImageObject(key: string, file: AvatarUploadFile) {
    this.assertValidImageFile(file);
    return this.uploadObject(key, file);
  }

  private async uploadFileObject(key: string, file: AvatarUploadFile) {
    this.assertValidStudyMaterialFile(file);
    return this.uploadObject(key, file);
  }

  private async uploadObject(key: string, file: AvatarUploadFile) {
    this.assertStorageConfigured();

    const requestUrl = this.buildObjectUrl(key);
    const payloadHash = this.sha256Hex(file.buffer);
    const amzDate = this.getAmzDate(new Date());
    const dateStamp = amzDate.slice(0, 8);
    const canonicalRequest = this.buildCanonicalRequest(
      requestUrl,
      file.mimetype,
      payloadHash,
      amzDate,
    );
    const stringToSign = this.buildStringToSign(amzDate, dateStamp, canonicalRequest);
    const signature = createHmac(
      'sha256',
      this.getSignatureKey(this.secretAccessKey, dateStamp, this.region, 's3'),
    )
      .update(stringToSign)
      .digest('hex');

    const authorization = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${dateStamp}/${this.region}/s3/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=${signature}`;

    const response = await fetch(requestUrl.toString(), {
      method: 'PUT',
      headers: {
        'Content-Type': file.mimetype,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        Authorization: authorization,
      },
      body: file.buffer,
    });

    if (!response.ok) {
      const responseBody = await response.text().catch(() => '');
      throw new BadGatewayException(
        responseBody
          ? `Avatar storage rejected the upload: ${response.status} ${response.statusText}`
          : `Avatar storage rejected the upload: ${response.status}`,
      );
    }

    return this.buildPublicUrl(key);
  }

  private buildScopedImageKey(pathSegments: string[], mimetype: string) {
    return this.buildScopedFileKey(pathSegments, mimetype);
  }

  private buildScopedFileKey(pathSegments: string[], mimetype: string) {
    const extension = this.resolveExtension(mimetype);
    return `${pathSegments.join('/')}/${randomUUID()}.${extension}`;
  }

  private assertValidImageFile(file: AvatarUploadFile) {
    if (!file?.buffer || !file.size) {
      throw new BadRequestException('Avatar file is required');
    }

    if (file.size > MAX_AVATAR_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException('Avatar image must be 5 MB or smaller');
    }

    if (!ALLOWED_AVATAR_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
    }
  }

  private assertValidStudyMaterialFile(file: AvatarUploadFile) {
    if (!file?.buffer || !file.size) {
      throw new BadRequestException('Study material file is required');
    }

    if (file.size > MAX_STUDY_MATERIAL_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException('Study material file must be 100 MB or smaller');
    }

    if (!ALLOWED_STUDY_MATERIAL_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG, WebP, PDF, DOC, and DOCX files are allowed');
    }
  }

  private resolveExtension(mimetype: string) {
    const extension =
      ALLOWED_AVATAR_MIME_TYPES.get(mimetype) ?? ALLOWED_STUDY_MATERIAL_MIME_TYPES.get(mimetype);
    if (!extension) {
      throw new BadRequestException('Unsupported upload file type');
    }
    return extension;
  }

  private buildCanonicalRequest(
    requestUrl: URL,
    contentType: string,
    payloadHash: string,
    amzDate: string,
  ) {
    const canonicalHeaders = [
      `content-type:${contentType}`,
      `host:${requestUrl.host}`,
      `x-amz-content-sha256:${payloadHash}`,
      `x-amz-date:${amzDate}`,
      '',
    ].join('\n');

    return [
      'PUT',
      requestUrl.pathname,
      '',
      canonicalHeaders,
      'content-type;host;x-amz-content-sha256;x-amz-date',
      payloadHash,
    ].join('\n');
  }

  private buildStringToSign(amzDate: string, dateStamp: string, canonicalRequest: string) {
    return [
      'AWS4-HMAC-SHA256',
      amzDate,
      `${dateStamp}/${this.region}/s3/aws4_request`,
      this.sha256Hex(Buffer.from(canonicalRequest, 'utf8')),
    ].join('\n');
  }

  private buildObjectUrl(key: string) {
    const url = new URL(this.endpoint);
    url.pathname = this.joinPath(
      url.pathname,
      this.bucket,
      ...key.split('/').map((part) => encodeURIComponent(part)),
    );
    url.search = '';
    return url;
  }

  private buildPublicUrl(key: string) {
    if (this.publicBaseUrl) {
      return new URL(key, this.ensureTrailingSlash(this.publicBaseUrl)).toString();
    }

    return this.buildObjectUrl(key).toString();
  }

  private getSignatureKey(
    secretKey: string,
    dateStamp: string,
    regionName: string,
    serviceName: string,
  ) {
    const kDate = createHmac('sha256', `AWS4${secretKey}`).update(dateStamp).digest();
    const kRegion = createHmac('sha256', kDate).update(regionName).digest();
    const kService = createHmac('sha256', kRegion).update(serviceName).digest();
    return createHmac('sha256', kService).update('aws4_request').digest();
  }

  private sha256Hex(value: Buffer | string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private getAmzDate(date: Date) {
    const pad = (value: number) => String(value).padStart(2, '0');
    return [
      date.getUTCFullYear(),
      pad(date.getUTCMonth() + 1),
      pad(date.getUTCDate()),
      'T',
      pad(date.getUTCHours()),
      pad(date.getUTCMinutes()),
      pad(date.getUTCSeconds()),
      'Z',
    ].join('');
  }

  private joinPath(...parts: string[]) {
    const normalized = parts
      .filter((part) => part !== '')
      .map((part, index) => {
        if (index === 0) {
          return part.replace(/\/+$/g, '');
        }
        return part.replace(/^\/+|\/+$/g, '');
      })
      .filter((part) => part.length > 0);

    const path = normalized.join('/');
    return path.startsWith('/') ? path : `/${path}`;
  }

  private ensureTrailingSlash(value: string) {
    return value.endsWith('/') ? value : `${value}/`;
  }

  private normalizeEndpoint(value: string) {
    if (!value) {
      return '';
    }

    const url = new URL(value);
    return url.toString().replace(/\/+$/g, '');
  }

  private normalizeOptionalBaseUrl(value: string) {
    if (!value) {
      return null;
    }

    return this.normalizeEndpoint(value);
  }

  private assertStorageConfigured() {
    if (!this.bucket || !this.endpoint || !this.accessKeyId || !this.secretAccessKey) {
      throw new ServiceUnavailableException('Avatar storage is not configured');
    }
  }
}
