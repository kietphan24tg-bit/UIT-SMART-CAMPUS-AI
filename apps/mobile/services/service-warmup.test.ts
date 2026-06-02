import { USER_ROLES } from '@smart-campus/shared';

import { canteenApi } from '@/services/api/canteen';
import { libraryApi } from '@/services/api/library';
import { studyMaterialsApi } from '@/services/api/study-materials';
import { prefetchImageUrls } from '@/services/image-cache';
import { createAppQueryClient } from '@/services/query-client';

import { warmCampusServices, warmStudyMaterialsService } from './service-warmup';

jest.mock('@/services/api/canteen', () => ({
  canteenApi: {
    getCatalog: jest.fn(),
  },
}));

jest.mock('@/services/api/library', () => ({
  libraryApi: {
    listBooks: jest.fn(),
  },
}));

jest.mock('@/services/api/study-materials', () => ({
  studyMaterialsApi: {
    list: jest.fn(),
  },
}));

jest.mock('@/services/image-cache', () => ({
  prefetchImageUrls: jest.fn().mockResolvedValue(undefined),
}));

const mockCanteenApi = canteenApi as jest.Mocked<typeof canteenApi>;
const mockLibraryApi = libraryApi as jest.Mocked<typeof libraryApi>;
const mockStudyMaterialsApi = studyMaterialsApi as jest.Mocked<typeof studyMaterialsApi>;
const mockPrefetchImageUrls = prefetchImageUrls as jest.MockedFunction<typeof prefetchImageUrls>;

describe('warmCampusServices', () => {
  const clients: Array<ReturnType<typeof createAppQueryClient>> = [];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    clients.forEach((client) => client.clear());
    clients.length = 0;
  });

  it('warms canteen and library for student sessions', async () => {
    const queryClient = createAppQueryClient();
    clients.push(queryClient);

    mockCanteenApi.getCatalog.mockResolvedValue([
      {
        id: 'cat-1',
        name: 'Mon chinh',
        description: null,
        products: [
          {
            id: 'pho',
            name: 'Pho',
            description: null,
            imageUrl: 'https://cdn.test/canteen/pho.jpg',
            price: 30000,
            stock: 5,
          },
        ],
      },
    ]);
    mockLibraryApi.listBooks.mockResolvedValue({
      items: [
        {
          id: 'book-1',
          openLibraryId: null,
          isbn13: null,
          title: 'Distributed Systems',
          subtitle: null,
          authors: 'UIT',
          subjects: ['Systems'],
          publisher: null,
          publishedAt: null,
          language: null,
          coverUrl: 'https://cdn.test/library/book-1.jpg',
          shelfCode: null,
          availableCopies: 2,
          totalCopies: 4,
        },
      ],
      page: 1,
      limit: 30,
      total: 1,
      totalPages: 1,
    });
    mockStudyMaterialsApi.list.mockResolvedValue({
      items: [
        {
          id: 'material-image',
          title: 'De thi mau',
          description: null,
          category: 'exam',
          fileUrl: 'https://cdn.test/materials/exam-1.png',
          storageKey: 'study-materials/student/exam-1.png',
          fileName: 'exam-1.png',
          mimeType: 'image/png',
          fileSizeBytes: 1024,
          uploaderId: 'student-1',
          createdAt: '2026-06-02T10:00:00.000Z',
          updatedAt: '2026-06-02T10:00:00.000Z',
          uploader: {
            id: 'student-1',
            studentId: '22520001',
            fullName: 'Nguyen Van A',
            role: USER_ROLES.STUDENT,
          },
          canEdit: true,
          canDelete: true,
        },
        {
          id: 'material-pdf',
          title: 'Giao trinh',
          description: null,
          category: 'textbook',
          fileUrl: 'https://cdn.test/materials/textbook-1.pdf',
          storageKey: 'study-materials/student/textbook-1.pdf',
          fileName: 'textbook-1.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 4096,
          uploaderId: 'student-1',
          createdAt: '2026-06-02T10:05:00.000Z',
          updatedAt: '2026-06-02T10:05:00.000Z',
          uploader: {
            id: 'student-1',
            studentId: '22520001',
            fullName: 'Nguyen Van A',
            role: USER_ROLES.STUDENT,
          },
          canEdit: true,
          canDelete: true,
        },
      ],
      page: 1,
      limit: 50,
      total: 2,
      totalPages: 1,
    });

    await warmCampusServices(queryClient, USER_ROLES.STUDENT);

    expect(mockCanteenApi.getCatalog).toHaveBeenCalledTimes(1);
    expect(mockLibraryApi.listBooks).toHaveBeenCalledWith({ limit: 30 });
    expect(mockStudyMaterialsApi.list).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(['canteen', 'catalog'])).toHaveLength(1);
    expect(
      queryClient.getQueryData(['library', 'books', '', undefined] as const),
    ).toMatchObject({
      total: 1,
    });
    expect(mockPrefetchImageUrls).toHaveBeenCalledWith([
      'https://cdn.test/canteen/pho.jpg',
      'https://cdn.test/library/book-1.jpg',
    ]);
  });

  it('skips campus discovery warmup for admin-only sessions', async () => {
    const queryClient = createAppQueryClient();
    clients.push(queryClient);

    await warmCampusServices(queryClient, USER_ROLES.ADMIN);

    expect(mockCanteenApi.getCatalog).not.toHaveBeenCalled();
    expect(mockLibraryApi.listBooks).not.toHaveBeenCalled();
    expect(mockStudyMaterialsApi.list).not.toHaveBeenCalled();
    expect(mockPrefetchImageUrls).not.toHaveBeenCalled();
  });
});

describe('warmStudyMaterialsService', () => {
  const clients: Array<ReturnType<typeof createAppQueryClient>> = [];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    clients.forEach((client) => client.clear());
    clients.length = 0;
  });

  it('warms study materials immediately for admin sessions', async () => {
    const queryClient = createAppQueryClient();
    clients.push(queryClient);

    mockStudyMaterialsApi.list.mockResolvedValue({
      items: [
        {
          id: 'material-image',
          title: 'De thi mau',
          description: null,
          category: 'exam',
          fileUrl: 'https://cdn.test/materials/exam-1.png',
          storageKey: 'study-materials/student/exam-1.png',
          fileName: 'exam-1.png',
          mimeType: 'image/png',
          fileSizeBytes: 1024,
          uploaderId: 'student-1',
          createdAt: '2026-06-02T10:00:00.000Z',
          updatedAt: '2026-06-02T10:00:00.000Z',
          uploader: {
            id: 'student-1',
            studentId: '22520001',
            fullName: 'Nguyen Van A',
            role: USER_ROLES.STUDENT,
          },
          canEdit: true,
          canDelete: true,
        },
        {
          id: 'material-pdf',
          title: 'Giao trinh',
          description: null,
          category: 'textbook',
          fileUrl: 'https://cdn.test/materials/textbook-1.pdf',
          storageKey: 'study-materials/student/textbook-1.pdf',
          fileName: 'textbook-1.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 4096,
          uploaderId: 'student-1',
          createdAt: '2026-06-02T10:05:00.000Z',
          updatedAt: '2026-06-02T10:05:00.000Z',
          uploader: {
            id: 'student-1',
            studentId: '22520001',
            fullName: 'Nguyen Van A',
            role: USER_ROLES.STUDENT,
          },
          canEdit: true,
          canDelete: true,
        },
      ],
      page: 1,
      limit: 50,
      total: 2,
      totalPages: 1,
    });

    await warmStudyMaterialsService(queryClient, USER_ROLES.ADMIN);

    expect(mockStudyMaterialsApi.list).toHaveBeenCalledWith({ limit: 50 });
    expect(
      queryClient.getQueryData(['study-materials', 'list', '', 'all'] as const),
    ).toMatchObject({
      total: 2,
    });
    expect(mockPrefetchImageUrls).toHaveBeenCalledWith([
      'https://cdn.test/materials/exam-1.png',
      null,
    ]);
  });

  it('skips study materials warmup for unsupported roles', async () => {
    const queryClient = createAppQueryClient();
    clients.push(queryClient);

    await warmStudyMaterialsService(queryClient, USER_ROLES.CANTEEN_ADMIN);

    expect(mockStudyMaterialsApi.list).not.toHaveBeenCalled();
    expect(mockPrefetchImageUrls).not.toHaveBeenCalled();
  });

  it('swallows a missing study materials route during warmup', async () => {
    const queryClient = createAppQueryClient();
    clients.push(queryClient);

    mockStudyMaterialsApi.list.mockRejectedValue({
      response: {
        status: 404,
        data: {
          message: 'Cannot GET /api/v1/study-materials?page=1&limit=50',
        },
      },
      message: 'Request failed with status code 404',
    });

    await expect(warmStudyMaterialsService(queryClient, USER_ROLES.ADMIN)).resolves.toBeUndefined();

    expect(mockStudyMaterialsApi.list).toHaveBeenCalledWith({ limit: 50 });
    expect(mockPrefetchImageUrls).not.toHaveBeenCalled();
    expect(
      queryClient.getQueryData(['study-materials', 'list', '', 'all'] as const),
    ).toBeUndefined();
  });
});
