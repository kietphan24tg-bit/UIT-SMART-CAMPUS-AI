import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role, StudyMaterialCategory } from '@prisma/client';

import { StudyMaterialsService } from './study-materials.service';

describe('StudyMaterialsService', () => {
  const prisma: any = {
    studyMaterial: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  const storageService = {
    uploadStudyMaterialFile: jest.fn(),
  };

  let service: StudyMaterialsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StudyMaterialsService(prisma, storageService as never);
  });

  it('lists materials with uploader info and ownership flags', async () => {
    prisma.studyMaterial.findMany.mockResolvedValue([
      {
        id: 'material-1',
        title: 'De thi giai tich',
        description: 'Nam 2025',
        category: StudyMaterialCategory.exam,
        fileUrl: 'https://cdn.example.com/material-1.pdf',
        storageKey: 'study-materials/student-1/material-1.pdf',
        fileName: 'Copy%20of%20Gi%C3%A1o%20tr%C3%ACnh.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 1024,
        uploaderId: 'student-1',
        createdAt: new Date('2026-06-02T00:00:00.000Z'),
        updatedAt: new Date('2026-06-02T00:00:00.000Z'),
        uploader: {
          id: 'student-1',
          firstName: 'An',
          lastName: 'Nguyen',
          studentId: '22520001',
          role: Role.student,
        },
      },
    ]);
    prisma.studyMaterial.count.mockResolvedValue(1);

    const result = await service.list('student-1', Role.student, {
      page: 1,
      limit: 20,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 'material-1',
      fileName: 'Copy of Giáo trình.pdf',
      uploader: {
        fullName: 'Nguyen An',
      },
      canEdit: true,
      canDelete: true,
    });
  });

  it('creates a material through storage and persists decoded file metadata', async () => {
    storageService.uploadStudyMaterialFile.mockResolvedValue({
      key: 'study-materials/lecturer-1/file.docx',
      fileUrl: 'https://cdn.example.com/study-materials/lecturer-1/file.docx',
    });
    prisma.studyMaterial.create.mockResolvedValue({
      id: 'material-2',
      title: 'Giao trinh he dieu hanh',
      description: null,
      category: StudyMaterialCategory.textbook,
      fileUrl: 'https://cdn.example.com/study-materials/lecturer-1/file.docx',
      storageKey: 'study-materials/lecturer-1/file.docx',
      fileName: 'Giáo trình hệ điều hành.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSizeBytes: 2048,
      uploaderId: 'lecturer-1',
      createdAt: new Date('2026-06-02T00:00:00.000Z'),
      updatedAt: new Date('2026-06-02T00:00:00.000Z'),
      uploader: {
        id: 'lecturer-1',
        firstName: 'Lan',
        lastName: 'Tran',
        studentId: null,
        role: Role.lecturer,
      },
    });

    const result = await service.create(
      'lecturer-1',
      Role.lecturer,
      {
        category: StudyMaterialCategory.textbook,
        title: 'Giao trinh he dieu hanh',
      },
      {
        buffer: Buffer.from('doc'),
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 2048,
        originalname: 'Gi%C3%A1o%20tr%C3%ACnh%20h%E1%BB%87%20%C4%91i%E1%BB%81u%20h%C3%A0nh.docx',
      },
    );

    expect(storageService.uploadStudyMaterialFile).toHaveBeenCalledWith(
      'lecturer-1',
      expect.objectContaining({
        originalname: 'Gi%C3%A1o%20tr%C3%ACnh%20h%E1%BB%87%20%C4%91i%E1%BB%81u%20h%C3%A0nh.docx',
      }),
    );
    expect(prisma.studyMaterial.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fileName: 'Giáo trình hệ điều hành.docx',
        }),
      }),
    );
    expect(result.fileName).toBe('Giáo trình hệ điều hành.docx');
    expect(result.uploader.fullName).toBe('Tran Lan');
  });

  it('normalizes decoded file names when updating uploaded files', async () => {
    prisma.studyMaterial.findUnique.mockResolvedValue({
      id: 'material-5',
      title: 'Tai lieu cu',
      description: null,
      category: StudyMaterialCategory.textbook,
      fileName: 'tai-lieu-cu.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1024,
      uploaderId: 'lecturer-1',
    });
    storageService.uploadStudyMaterialFile.mockResolvedValue({
      key: 'study-materials/lecturer-1/file-new.pdf',
      fileUrl: 'https://cdn.example.com/study-materials/lecturer-1/file-new.pdf',
    });
    prisma.studyMaterial.update.mockResolvedValue({
      id: 'material-5',
      title: 'Tai lieu cu',
      description: null,
      category: StudyMaterialCategory.textbook,
      fileUrl: 'https://cdn.example.com/study-materials/lecturer-1/file-new.pdf',
      storageKey: 'study-materials/lecturer-1/file-new.pdf',
      fileName: 'Cấu trúc dữ liệu và giải thuật.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 2048,
      uploaderId: 'lecturer-1',
      createdAt: new Date('2026-06-02T00:00:00.000Z'),
      updatedAt: new Date('2026-06-03T00:00:00.000Z'),
      uploader: {
        id: 'lecturer-1',
        firstName: 'Lan',
        lastName: 'Tran',
        studentId: null,
        role: Role.lecturer,
      },
    });

    const result = await service.update(
      'material-5',
      'lecturer-1',
      Role.lecturer,
      {},
      {
        buffer: Buffer.from('pdf'),
        mimetype: 'application/pdf',
        size: 2048,
        originalname:
          'C%E1%BA%A5u%20tr%C3%BAc%20d%E1%BB%AF%20li%E1%BB%87u%20v%C3%A0%20gi%E1%BA%A3i%20thu%E1%BA%ADt.pdf',
      },
    );

    expect(prisma.studyMaterial.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fileName: 'Cấu trúc dữ liệu và giải thuật.pdf',
        }),
      }),
    );
    expect(result.fileName).toBe('Cấu trúc dữ liệu và giải thuật.pdf');
  });

  it('rejects updates from non-owner non-admin users', async () => {
    prisma.studyMaterial.findUnique.mockResolvedValue({
      id: 'material-3',
      title: 'Tai lieu',
      description: null,
      category: StudyMaterialCategory.other,
      fileName: 'tai-lieu.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 512,
      uploaderId: 'student-1',
    });

    await expect(
      service.update('material-3', 'student-2', Role.student, {
        title: 'Tai lieu moi',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows admin to delete materials of other users', async () => {
    prisma.studyMaterial.findUnique.mockResolvedValue({
      id: 'material-4',
      title: 'De cuong',
      description: null,
      category: StudyMaterialCategory.other,
      fileName: 'de-cuong.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 512,
      uploaderId: 'student-1',
    });
    prisma.studyMaterial.delete.mockResolvedValue({ id: 'material-4' });

    const result = await service.remove('material-4', 'admin-1', Role.admin);

    expect(prisma.studyMaterial.delete).toHaveBeenCalledWith({
      where: { id: 'material-4' },
    });
    expect(result).toEqual({ id: 'material-4', deleted: true });
  });

  it('throws not found when deleting missing material', async () => {
    prisma.studyMaterial.findUnique.mockResolvedValue(null);

    await expect(service.remove('missing', 'admin-1', Role.admin)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
