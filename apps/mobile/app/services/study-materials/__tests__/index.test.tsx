import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Image } from 'expo-image';
import React from 'react';

import AdminStudyMaterialsRoute from '../admin';
import StudyMaterialsRoute from '../index';

import { downloadRemoteFileToDevice } from '@/services/file-download';
import { studyMaterialsApi } from '@/services/api/study-materials';
import { useAuthStore } from '@/stores/auth-store';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));
jest.mock('@/stores/auth-store');
jest.mock('@/services/file-download', () => ({
  downloadRemoteFileToDevice: jest.fn().mockResolvedValue({
    fileUri: 'content://downloads/material-owner.jpg',
    savedFileName: 'material-owner.jpg',
    locationLabel: 'Bộ nhớ trong/Download/material-owner.jpg',
  }),
}));
jest.mock('@/services/api/study-materials', () => ({
  studyMaterialsApi: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockStudyMaterialsApi = studyMaterialsApi as unknown as {
  list: jest.Mock;
};
const mockDownloadRemoteFileToDevice = downloadRemoteFileToDevice as jest.Mock;
const mockedExpoImage = Image as unknown as { prefetch: jest.Mock };

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const materialsResponse = {
  items: [
    {
      id: 'material-owner',
      title: 'Đề thi giải tích',
      description: 'Bản scan cuối kỳ',
      category: 'exam',
      fileUrl: 'https://cdn.example.com/material-owner.jpg',
      storageKey: 'study-materials/student-1/material-owner.jpg',
      fileName: 'de-thi%20giai%20tich.jpg',
      mimeType: 'image/jpeg',
      fileSizeBytes: 2048,
      uploaderId: 'student-1',
      createdAt: '2026-06-02T00:00:00.000Z',
      updatedAt: '2026-06-02T00:00:00.000Z',
      uploader: {
        id: 'student-1',
        studentId: '22520001',
        fullName: 'Nguyen Van A',
        role: 'student',
      },
      canEdit: true,
      canDelete: true,
    },
    {
      id: 'material-other',
      title: 'Giáo trình hệ điều hành',
      description: null,
      category: 'textbook',
      fileUrl: 'https://cdn.example.com/material-other.pdf',
      storageKey: 'study-materials/lecturer-1/material-other.pdf',
      fileName: 'giao-trinh.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 8192,
      uploaderId: 'lecturer-1',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
      uploader: {
        id: 'lecturer-1',
        studentId: null,
        fullName: 'Tran Thi B',
        role: 'lecturer',
      },
      canEdit: false,
      canDelete: false,
    },
  ],
  page: 1,
  limit: 50,
  total: 2,
  totalPages: 1,
};

describe('StudyMaterialsRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: { id: 'student-1', role: 'student' },
      }),
    );
    mockStudyMaterialsApi.list.mockResolvedValue(materialsResponse);
  });

  it('renders uploader info, owner actions, downloads files, and prefetches only image materials', async () => {
    const { getByText, queryAllByText, queryByText } = renderWithClient(<StudyMaterialsRoute />);

    await waitFor(() => expect(getByText('Đề thi giải tích')).toBeTruthy());

    const examFilterLabel = queryAllByText('Đề thi').find(
      (node) => node.props.adjustsFontSizeToFit === true,
    );
    const textbookFilterLabel = queryAllByText('Giáo trình').find(
      (node) => node.props.adjustsFontSizeToFit === true,
    );
    const otherFilterLabel = queryAllByText('Khác').find(
      (node) => node.props.adjustsFontSizeToFit === true,
    );

    expect(getByText('Tất cả')).toBeTruthy();
    expect(examFilterLabel).toBeTruthy();
    expect(textbookFilterLabel).toBeTruthy();
    expect(otherFilterLabel).toBeTruthy();
    expect(textbookFilterLabel?.props.adjustsFontSizeToFit).toBe(true);
    expect(otherFilterLabel?.props.adjustsFontSizeToFit).toBe(true);
    expect(queryByText('de-thi%20giai%20tich.jpg')).toBeNull();
    expect(queryByText('de-thi giai tich.jpg')).toBeNull();
    expect(getByText(/Đăng bởi Nguyen Van A/)).toBeTruthy();
    expect(getByText(/Đăng bởi Tran Thi B/)).toBeTruthy();
    expect(queryAllByText('Tải file')).toHaveLength(2);
    expect(queryAllByText('Sửa')).toHaveLength(1);
    expect(queryAllByText('Xóa')).toHaveLength(1);

    fireEvent.press(queryAllByText('Tải file')[0]);

    await waitFor(() =>
        expect(mockDownloadRemoteFileToDevice).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'https://cdn.example.com/material-owner.jpg',
            fileName: 'de-thi giai tich.jpg',
            mimeType: 'image/jpeg',
          }),
        ),
    );

    await waitFor(() => {
      expect(mockedExpoImage.prefetch).toHaveBeenCalledWith(
        ['https://cdn.example.com/material-owner.jpg'],
        'disk',
      );
    });
  });
});

describe('AdminStudyMaterialsRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: { id: 'admin-1', role: 'admin' },
      }),
    );
    mockStudyMaterialsApi.list.mockResolvedValue({
      ...materialsResponse,
      items: materialsResponse.items.map((item) => ({
        ...item,
        canEdit: true,
        canDelete: true,
      })),
    });
  });

  it('shows management actions for all materials', async () => {
    const { getByText, queryAllByText } = renderWithClient(<AdminStudyMaterialsRoute />);

    await waitFor(() => expect(getByText('Đề thi giải tích')).toBeTruthy());

    expect(queryAllByText('Sửa')).toHaveLength(2);
    expect(queryAllByText('Xóa')).toHaveLength(2);
    expect(mockRouter.replace).not.toHaveBeenCalledWith('/services/study-materials');
  });
});
