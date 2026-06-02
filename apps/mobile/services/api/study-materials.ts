import { apiClient, requestMultipart } from './client';

export type StudyMaterialCategory = 'exam' | 'textbook' | 'other';

export interface StudyMaterialRecord {
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
  createdAt: string;
  updatedAt: string;
  uploader: {
    id: string;
    studentId: string | null;
    fullName: string;
    role: string;
  };
  canEdit: boolean;
  canDelete: boolean;
}

export interface StudyMaterialListResponse {
  items: StudyMaterialRecord[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type CreateStudyMaterialInput = {
  category: StudyMaterialCategory;
  title: string;
  description?: string;
  file: {
    uri: string;
    fileName: string;
    mimeType: string;
  };
};

type UpdateStudyMaterialInput = {
  category?: StudyMaterialCategory;
  title?: string;
  description?: string;
  file?: {
    uri: string;
    fileName: string;
    mimeType: string;
  };
};

export const studyMaterialsApi = {
  list: async ({
    q,
    category,
    page = 1,
    limit = 20,
  }: {
    q?: string;
    category?: StudyMaterialCategory;
    page?: number;
    limit?: number;
  } = {}): Promise<StudyMaterialListResponse> => {
    return (await apiClient.get('/study-materials', {
      params: {
        ...(q ? { q } : {}),
        ...(category ? { category } : {}),
        page,
        limit,
      },
    })) as StudyMaterialListResponse;
  },

  create: async (input: CreateStudyMaterialInput): Promise<StudyMaterialRecord> => {
    return requestMultipart<StudyMaterialRecord>('/study-materials', {
      method: 'POST',
      fields: {
        category: input.category,
        title: input.title,
        description: input.description ?? undefined,
      },
      file: {
        fieldName: 'file',
        uri: input.file.uri,
        fileName: input.file.fileName,
        mimeType: input.file.mimeType,
      },
    });
  },

  update: async (
    materialId: string,
    input: UpdateStudyMaterialInput,
  ): Promise<StudyMaterialRecord> => {
    return requestMultipart<StudyMaterialRecord>(
      `/study-materials/${encodeURIComponent(materialId)}`,
      {
        method: 'PATCH',
        fields: {
          ...(input.category ? { category: input.category } : {}),
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
        },
        file: input.file
          ? {
              fieldName: 'file',
              uri: input.file.uri,
              fileName: input.file.fileName,
              mimeType: input.file.mimeType,
            }
          : undefined,
      },
    );
  },

  remove: async (materialId: string) => {
    return (await apiClient.delete(`/study-materials/${encodeURIComponent(materialId)}`)) as {
      id: string;
      deleted: boolean;
    };
  },
};
