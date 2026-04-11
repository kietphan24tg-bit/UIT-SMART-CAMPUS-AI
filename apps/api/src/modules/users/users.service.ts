import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { UserRole } from '@smart-campus/shared';

import { PrismaService } from '../../database/prisma.service';
import { AvatarStorageService, type AvatarUploadFile } from '../storage/avatar-storage.service';
import { ALLOWED_AVATAR_MIME_TYPES, MAX_AVATAR_UPLOAD_SIZE_BYTES } from '../storage/avatar-upload.constants';

interface CreateUserData {
  email: string;
  passwordHash: string;
  studentId?: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly avatarStorageService: AvatarStorageService,
  ) {}

  private readonly userSelect = {
    id: true,
    email: true,
    studentId: true,
    firstName: true,
    lastName: true,
    avatarUrl: true,
    role: true,
    faculty: true,
    major: true,
    yearOfAdmission: true,
    phone: true,
    dateOfBirth: true,
    address: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async create(data: CreateUserData) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    return this.prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        studentId: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: this.userSelect,
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      address: string;
    }>,
  ) {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });
  }

  async updateAvatar(id: string, file: AvatarUploadFile) {
    await this.findById(id);
    this.assertValidAvatarFile(file);

    const uploadedAsset = await this.avatarStorageService.uploadAvatar(id, file);

    return this.prisma.user.update({
      where: { id },
      data: { avatarUrl: uploadedAsset.avatarUrl },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });
  }

  async updateRole(id: string, role: UserRole) {
    await this.findById(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: this.userSelect,
    });

    await this.prisma.refreshToken.deleteMany({ where: { userId: id } });
    return user;
  }

  async updateActive(id: string, isActive: boolean) {
    await this.findById(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: this.userSelect,
    });

    await this.prisma.refreshToken.deleteMany({ where: { userId: id } });
    return user;
  }

  private assertValidAvatarFile(file: AvatarUploadFile) {
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
}
