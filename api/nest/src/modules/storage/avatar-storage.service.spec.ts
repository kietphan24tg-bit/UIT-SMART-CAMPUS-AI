import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { AvatarStorageService } from './avatar-storage.service';
import {
  MAX_AVATAR_UPLOAD_SIZE_BYTES,
  MAX_STUDY_MATERIAL_UPLOAD_SIZE_BYTES,
} from './avatar-upload.constants';

describe('AvatarStorageService', () => {
  let service: AvatarStorageService;
  let fetchSpy: jest.SpyInstance;

  const configValues = {
    AVATAR_STORAGE_BUCKET: 'avatars',
    AVATAR_STORAGE_ENDPOINT: 'https://storage.example.com',
    AVATAR_STORAGE_ACCESS_KEY_ID: 'test-access-key',
    AVATAR_STORAGE_SECRET_ACCESS_KEY: 'test-secret-key',
    AVATAR_STORAGE_REGION: 'ap-southeast-1',
    AVATAR_STORAGE_PUBLIC_BASE_URL: 'https://cdn.example.com',
  } as const;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AvatarStorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: keyof typeof configValues, defaultValue?: string) => {
              return configValues[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(AvatarStorageService);
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: jest.fn().mockResolvedValue(''),
    } as never);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('uploads an avatar and returns a public url', async () => {
    const result = await service.uploadAvatar('user-1', {
      buffer: Buffer.from('avatar-bytes'),
      mimetype: 'image/png',
      size: 12,
      originalname: 'avatar.png',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(requestUrl).toContain('/avatars/user-1/');
    expect(requestInit.method).toBe('PUT');
    expect(requestInit.headers).toEqual(
      expect.objectContaining({
        'Content-Type': 'image/png',
        Authorization: expect.stringContaining('AWS4-HMAC-SHA256'),
      }),
    );
    expect(result.avatarUrl).toMatch(/^https:\/\/cdn\.example\.com\/avatars\/user-1\/.+\.png$/);
  });

  it('rejects unsupported mime types before upload', async () => {
    await expect(
      service.uploadAvatar('user-1', {
        buffer: Buffer.from('avatar-bytes'),
        mimetype: 'application/pdf',
        size: 12,
        originalname: 'avatar.pdf',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects oversized files before upload', async () => {
    await expect(
      service.uploadAvatar('user-1', {
        buffer: Buffer.alloc(MAX_AVATAR_UPLOAD_SIZE_BYTES + 1),
        mimetype: 'image/png',
        size: MAX_AVATAR_UPLOAD_SIZE_BYTES + 1,
        originalname: 'avatar.png',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('uploads a study material and returns a public url', async () => {
    const result = await service.uploadStudyMaterialFile('student-1', {
      buffer: Buffer.from('document-bytes'),
      mimetype: 'application/pdf',
      size: 128,
      originalname: 'de-thi-cuoi-ky.pdf',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(requestUrl).toContain('/avatars/study-materials/student-1/');
    expect(requestInit.headers).toEqual(
      expect.objectContaining({
        'Content-Type': 'application/pdf',
      }),
    );
    expect(result.fileUrl).toMatch(
      /^https:\/\/cdn\.example\.com\/study-materials\/student-1\/.+\.pdf$/,
    );
  });

  it('rejects unsupported study material mime types before upload', async () => {
    await expect(
      service.uploadStudyMaterialFile('student-1', {
        buffer: Buffer.from('document-bytes'),
        mimetype: 'application/zip',
        size: 128,
        originalname: 'archive.zip',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects oversized study materials before upload', async () => {
    await expect(
      service.uploadStudyMaterialFile('student-1', {
        buffer: Buffer.alloc(MAX_STUDY_MATERIAL_UPLOAD_SIZE_BYTES + 1),
        mimetype: 'application/pdf',
        size: MAX_STUDY_MATERIAL_UPLOAD_SIZE_BYTES + 1,
        originalname: 'large.pdf',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
