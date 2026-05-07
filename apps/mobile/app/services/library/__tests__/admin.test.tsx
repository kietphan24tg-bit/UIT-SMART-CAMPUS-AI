import { USER_ROLES } from '@smart-campus/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import LibraryAdminScreen from '../admin';

import { libraryApi } from '@/services/api/library';
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
jest.mock('@/services/api/library', () => ({
  libraryApi: {
    getAdminBooks: jest.fn(),
    getAdminLoanRequests: jest.fn(),
    getAdminLoans: jest.fn(),
    createAdminBook: jest.fn(),
    updateAdminBook: jest.fn(),
    deleteAdminBook: jest.fn(),
    createBookCopy: jest.fn(),
    updateBookCopy: jest.fn(),
    deleteBookCopy: jest.fn(),
    markCopyLost: jest.fn(),
    markCopyMaintenance: jest.fn(),
    approveLoanRequest: jest.fn(),
    rejectLoanRequest: jest.fn(),
    checkInLoan: jest.fn(),
    uploadBookCover: jest.fn(),
  },
}));

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockLibraryApi = libraryApi as unknown as {
  getAdminBooks: jest.Mock;
  getAdminLoanRequests: jest.Mock;
  getAdminLoans: jest.Mock;
};

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

describe('LibraryAdminScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: { id: 'admin-1', role: USER_ROLES.ADMIN },
      }),
    );
    mockLibraryApi.getAdminBooks.mockResolvedValue([
      {
        id: 'book-1',
        openLibraryId: null,
        isbn13: '9780132350884',
        title: 'Clean Code',
        subtitle: null,
        authors: 'Robert C. Martin',
        subjects: ['software engineering'],
        publisher: 'Prentice Hall',
        publishedAt: '2008',
        language: 'en',
        coverUrl: null,
        description: 'A handbook of agile software craftsmanship.',
        shelfCode: 'SE-01',
        isActive: true,
        availableCopies: 1,
        createdAt: '2026-05-07T00:00:00.000Z',
        updatedAt: '2026-05-07T00:00:00.000Z',
        copies: [
          {
            id: 'copy-1',
            copyCode: 'CC-01',
            status: 'available',
            conditionNote: null,
            acquiredAt: '2026-05-07T00:00:00.000Z',
            updatedAt: '2026-05-07T00:00:00.000Z',
          },
        ],
      },
    ]);
    mockLibraryApi.getAdminLoanRequests.mockResolvedValue([
      {
        id: 'request-1',
        status: 'pending',
        note: 'Mượn để học môn SE',
        createdAt: '2026-05-07T10:00:00.000Z',
        approvedAt: null,
        requester: {
          id: 'student-1',
          studentId: '22520001',
          fullName: 'Nguyen Van A',
          email: 'student@uit.edu.vn',
        },
        approvedBy: null,
        book: {
          id: 'book-1',
          title: 'Clean Code',
          authors: 'Robert C. Martin',
        },
        copy: {
          id: 'copy-1',
          copyCode: 'CC-01',
        },
      },
    ]);
    mockLibraryApi.getAdminLoans.mockResolvedValue([
      {
        id: 'loan-1',
        status: 'borrowed',
        borrowedAt: '2026-05-06T10:00:00.000Z',
        dueAt: '2026-05-20T10:00:00.000Z',
        returnedAt: null,
        renewedCount: 0,
        borrowNote: 'Giữ gìn cẩn thận',
        returnNote: null,
        borrower: {
          id: 'student-1',
          studentId: '22520001',
          fullName: 'Nguyen Van A',
          email: 'student@uit.edu.vn',
          role: USER_ROLES.STUDENT,
        },
        book: {
          id: 'book-1',
          title: 'Clean Code',
          authors: 'Robert C. Martin',
        },
        copy: {
          id: 'copy-1',
          copyCode: 'CC-01',
        },
      },
    ]);
  });

  it('renders the requested admin tabs with live library data', async () => {
    const { getAllByText, getByText } = renderWithClient(<LibraryAdminScreen />);

    await waitFor(() => {
      expect(getByText('Clean Code')).toBeTruthy();
    });

    expect(getAllByText('Đầu sách').length).toBeGreaterThan(0);
    expect(getAllByText('Chờ xử lý').length).toBeGreaterThan(0);
    expect(getAllByText('Đang mượn').length).toBeGreaterThan(0);
    expect(getByText('Clean Code')).toBeTruthy();

    fireEvent.press(getAllByText('Chờ xử lý')[1]!);
    await waitFor(() => {
      expect(getByText('Nguyen Van A · 22520001')).toBeTruthy();
    });

    fireEvent.press(getAllByText('Đang mượn')[1]!);
    await waitFor(() => {
      expect(getByText('Xác nhận trả sách')).toBeTruthy();
    });
  });

  it('only shows book action buttons after selecting a book card', async () => {
    const { getByLabelText, getByText, queryByText } = renderWithClient(<LibraryAdminScreen />);

    await waitFor(() => {
      expect(getByText('Clean Code')).toBeTruthy();
    });

    expect(queryByText('Sửa sách')).toBeNull();
    expect(queryByText('Xóa đầu sách')).toBeNull();

    fireEvent.press(getByText('Clean Code'));

    await waitFor(() => {
      expect(getByText('Sửa sách')).toBeTruthy();
    });

    expect(getByText('Xóa đầu sách')).toBeTruthy();
    expect(getByLabelText('Thêm copy')).toBeTruthy();
    expect(getByText('Số lượng: 1/1 · Kệ SE-01')).toBeTruthy();
    expect(getByText('Bản copy (1)')).toBeTruthy();
    expect(queryByText('Thông tin đầu sách')).toBeNull();
  });

  it('shows a fallback message when the live backend does not support admin loans yet', async () => {
    mockLibraryApi.getAdminLoans.mockRejectedValue({
      statusCode: 404,
      message: 'Cannot GET /api/v1/library/admin/loans',
    });

    const { getAllByText, getByText } = renderWithClient(<LibraryAdminScreen />);

    await waitFor(() => {
      expect(getByText('Clean Code')).toBeTruthy();
    });

    fireEvent.press(getAllByText('Đang mượn')[1]!);

    await waitFor(() => {
      expect(getByText('Server chưa hỗ trợ danh sách mượn')).toBeTruthy();
    });
  });
});
