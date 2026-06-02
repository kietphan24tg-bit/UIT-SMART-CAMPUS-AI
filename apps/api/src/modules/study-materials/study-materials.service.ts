import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, StudyMaterialCategory } from '@prisma/client';
import { formatFullName } from '@smart-campus/shared';

import { PrismaService } from '../../database/prisma.service';
import { AvatarStorageService, type AvatarUploadFile } from '../storage/avatar-storage.service';

import type {
  CreateStudyMaterialDto,
  ListStudyMaterialsQueryDto,
  UpdateStudyMaterialDto,
} from './dto/study-materials.dto';

function normalizePaging(page?: number, limit?: number) {
  const safePage = Number.isInteger(page) && page && page > 0 ? page : 1;
  const safeLimit = Number.isInteger(limit) && limit && limit > 0 ? Math.min(limit, 50) : 20;
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

function isAdminRole(role: Role) {
  return role === Role.admin || role === Role.super_admin;
}

function toOptionalTrimmedString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

@Injectable()
export class StudyMaterialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: AvatarStorageService,
  ) {}

  async list(actorId: string, actorRole: Role, query: ListStudyMaterialsQueryDto) {
    const { page, limit, skip } = normalizePaging(query.page, query.limit);
    const tokens = query.q
      ?.trim()
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);

    const where: any = {
      ...(query.category ? { category: query.category } : {}),
      ...(tokens?.length
        ? {
            AND: tokens.map((token) => ({
              OR: [
                { title: { contains: token, mode: 'insensitive' } },
                { description: { contains: token, mode: 'insensitive' } },
                { fileName: { contains: token, mode: 'insensitive' } },
                { uploader: { is: { firstName: { contains: token, mode: 'insensitive' } } } },
                { uploader: { is: { lastName: { contains: token, mode: 'insensitive' } } } },
                { uploader: { is: { email: { contains: token, mode: 'insensitive' } } } },
              ],
            })),
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.studyMaterial.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentId: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.studyMaterial.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toRecord(item, actorId, actorRole)),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async create(
    actorId: string,
    actorRole: Role,
    dto: CreateStudyMaterialDto,
    file: AvatarUploadFile,
  ) {
    const title = dto.title.trim();
    if (!title) {
      throw new BadRequestException('Tieu de tai lieu khong duoc de trong');
    }

    const uploaded = await this.storageService.uploadStudyMaterialFile(actorId, file);
    const created = await this.prisma.studyMaterial.create({
      data: {
        category: dto.category,
        title,
        description: toOptionalTrimmedString(dto.description),
        fileUrl: uploaded.fileUrl,
        storageKey: uploaded.key,
        fileName: file.originalname?.trim() || `study-material-${Date.now()}`,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
        uploaderId: actorId,
      },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            role: true,
          },
        },
      },
    });

    return this.toRecord(created, actorId, actorRole);
  }

  async update(
    materialId: string,
    actorId: string,
    actorRole: Role,
    dto: UpdateStudyMaterialDto,
    file?: AvatarUploadFile,
  ) {
    const existing = await this.assertCanManageMaterial(materialId, actorId, actorRole);
    const nextTitle = dto.title !== undefined ? dto.title.trim() : existing.title;

    if (!nextTitle) {
      throw new BadRequestException('Tieu de tai lieu khong duoc de trong');
    }

    const uploaded = file
      ? await this.storageService.uploadStudyMaterialFile(existing.uploaderId, file)
      : null;

    const updated = await this.prisma.studyMaterial.update({
      where: { id: materialId },
      data: {
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.title !== undefined ? { title: nextTitle } : {}),
        ...(dto.description !== undefined
          ? { description: toOptionalTrimmedString(dto.description) }
          : {}),
        ...(uploaded
          ? {
              fileUrl: uploaded.fileUrl,
              storageKey: uploaded.key,
              fileName: file?.originalname?.trim() || existing.fileName,
              mimeType: file?.mimetype ?? existing.mimeType,
              fileSizeBytes: file?.size ?? existing.fileSizeBytes,
            }
          : {}),
      },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            role: true,
          },
        },
      },
    });

    return this.toRecord(updated, actorId, actorRole);
  }

  async remove(materialId: string, actorId: string, actorRole: Role) {
    await this.assertCanManageMaterial(materialId, actorId, actorRole);
    await this.prisma.studyMaterial.delete({
      where: { id: materialId },
    });

    return { id: materialId, deleted: true };
  }

  private async assertCanManageMaterial(materialId: string, actorId: string, actorRole: Role) {
    const material = await this.prisma.studyMaterial.findUnique({
      where: { id: materialId },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        fileName: true,
        mimeType: true,
        fileSizeBytes: true,
        uploaderId: true,
      },
    });

    if (!material) {
      throw new NotFoundException('Khong tim thay tai lieu');
    }

    if (material.uploaderId !== actorId && !isAdminRole(actorRole)) {
      throw new ForbiddenException('Ban khong co quyen chinh sua tai lieu nay');
    }

    return material;
  }

  private toRecord(
    material: {
      id: string;
      title: string;
      description: string | null;
      category: StudyMaterialCategory;
      fileUrl: string;
      storageKey: string;
      fileName: string;
      mimeType: string;
      fileSizeBytes: number;
      uploaderId: string;
      createdAt: Date;
      updatedAt: Date;
      uploader: {
        id: string;
        firstName: string;
        lastName: string;
        studentId: string | null;
        role: Role;
      };
    },
    actorId: string,
    actorRole: Role,
  ) {
    const canManage = material.uploaderId === actorId || isAdminRole(actorRole);

    return {
      id: material.id,
      title: material.title,
      description: material.description,
      category: material.category,
      fileUrl: material.fileUrl,
      storageKey: material.storageKey,
      fileName: material.fileName,
      mimeType: material.mimeType,
      fileSizeBytes: material.fileSizeBytes,
      uploaderId: material.uploaderId,
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
      uploader: {
        id: material.uploader.id,
        studentId: material.uploader.studentId,
        fullName: formatFullName(material.uploader.firstName, material.uploader.lastName),
        role: material.uploader.role,
      },
      canEdit: canManage,
      canDelete: canManage,
    };
  }
}
