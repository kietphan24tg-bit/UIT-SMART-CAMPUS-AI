import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';
import { AvatarStorageService } from '../storage/avatar-storage.service';
import { MAX_AVATAR_UPLOAD_SIZE_BYTES } from '../storage/avatar-upload.constants';

import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: jest.Mocked<PrismaService>;
  let avatarStorageService: { uploadAvatar: jest.Mock };

  const mockUser = {
    id: 'user-1',
    email: 'test@uit.edu.vn',
    studentId: '22520001',
    firstName: 'Nguyen',
    lastName: 'Van A',
    avatarUrl: null,
    role: 'student',
    faculty: 'SE',
    major: 'Software Engineering',
    yearOfAdmission: 2022,
    phone: null,
    dateOfBirth: null,
    address: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: AvatarStorageService,
          useValue: {
            uploadAvatar: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    prisma = module.get(PrismaService);
    avatarStorageService = module.get(AvatarStorageService) as unknown as {
      uploadAvatar: jest.Mock;
    };
  });

  describe('create', () => {
    it('should create a new user when email does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'new@uit.edu.vn',
        studentId: '22520002',
        firstName: 'Tran',
        lastName: 'Van B',
        role: 'student',
        createdAt: new Date(),
      });

      const result = await service.create({
        email: 'new@uit.edu.vn',
        passwordHash: 'hashed',
        studentId: '22520002',
        firstName: 'Tran',
        lastName: 'Van B',
      });

      expect(result.email).toBe('new@uit.edu.vn');
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.create({
          email: 'test@uit.edu.vn',
          passwordHash: 'hashed',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.create({
          email: 'test@uit.edu.vn',
          passwordHash: 'hashed',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toThrow('Email đã được đăng ký.');
    });

    it('should translate duplicated student id into a localized conflict message', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockRejectedValue({
        code: 'P2002',
        meta: { target: ['student_id'] },
      });

      await expect(
        service.create({
          email: 'new@uit.edu.vn',
          passwordHash: 'hashed',
          studentId: '22520001',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.create({
          email: 'new@uit.edu.vn',
          passwordHash: 'hashed',
          studentId: '22520001',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toThrow('MSSV đã được đăng ký.');
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(result.id).toBe('user-1');
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' } }),
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update and return user profile', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        firstName: 'Updated',
      });

      const result = await service.updateProfile('user-1', {
        firstName: 'Updated',
      });

      expect(result.firstName).toBe('Updated');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { firstName: 'Updated' },
        }),
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateProfile('nonexistent', { firstName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAvatar', () => {
    it('should upload avatar and persist avatarUrl', async () => {
      const file = {
        buffer: Buffer.from('avatar-bytes'),
        mimetype: 'image/png',
        size: 12,
        originalname: 'avatar.png',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (avatarStorageService.uploadAvatar as jest.Mock).mockResolvedValue({
        key: 'avatars/user-1/avatar.png',
        avatarUrl: 'https://cdn.uit.edu.vn/avatars/user-1/avatar.png',
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        avatarUrl: 'https://cdn.uit.edu.vn/avatars/user-1/avatar.png',
      });

      const result = await service.updateAvatar('user-1', file);

      expect(avatarStorageService.uploadAvatar).toHaveBeenCalledWith('user-1', file);
      expect(result.avatarUrl).toBe('https://cdn.uit.edu.vn/avatars/user-1/avatar.png');
    });

    it('should reject unsupported mime types', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.updateAvatar('user-1', {
          buffer: Buffer.from('avatar-bytes'),
          mimetype: 'application/pdf',
          size: 12,
          originalname: 'avatar.pdf',
        } as never),
      ).rejects.toThrow('Only JPEG, PNG, and WebP images are allowed');

      expect(avatarStorageService.uploadAvatar).not.toHaveBeenCalled();
    });

    it('should reject oversized files', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.updateAvatar('user-1', {
          buffer: Buffer.alloc(MAX_AVATAR_UPLOAD_SIZE_BYTES + 1),
          mimetype: 'image/png',
          size: MAX_AVATAR_UPLOAD_SIZE_BYTES + 1,
          originalname: 'avatar.png',
        } as never),
      ).rejects.toThrow('Avatar image must be 5 MB or smaller');

      expect(avatarStorageService.uploadAvatar).not.toHaveBeenCalled();
    });
  });
});
