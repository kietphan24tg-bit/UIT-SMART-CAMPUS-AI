import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

import LibraryScreen from '../index';

import { libraryApi } from '@/services/api/library';
import { useAuthStore } from '@/stores/auth-store';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useFocusEffect: (callback: () => void | (() => void)) => callback(),
}));
jest.mock('@/stores/auth-store');
jest.mock('@/services/api/library', () => ({
  libraryApi: {
    listBooks: jest.fn(),
    getBook: jest.fn(),
    getMyLoans: jest.fn(),
    getMyLoanRequests: jest.fn(),
    createLoanRequest: jest.fn(),
    cancelLoanRequest: jest.fn(),
    deleteLoanRequest: jest.fn(),
    renewLoan: jest.fn(),
  },
}));

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockLibraryApi = libraryApi as unknown as {
  listBooks: jest.Mock;
  getBook: jest.Mock;
  getMyLoans: jest.Mock;
  getMyLoanRequests: jest.Mock;
  createLoanRequest: jest.Mock;
  cancelLoanRequest: jest.Mock;
  deleteLoanRequest: jest.Mock;
  renewLoan: jest.Mock;
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

describe('LibraryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: { id: 'student-1', role: 'student' },
        refreshProfile: jest.fn().mockResolvedValue(null),
      }),
    );

    mockLibraryApi.listBooks.mockResolvedValue({
      items: [
        {
          id: 'book-1',
          openLibraryId: 'OL1M',
          isbn13: '9780131103627',
          title: 'The C Programming Language',
          subtitle: null,
          authors: 'Kernighan, Ritchie',
          subjects: ['software engineering'],
          publisher: 'Prentice Hall',
          publishedAt: '1988',
          language: 'en',
          coverUrl: null,
          shelfCode: 'SE-01',
          availableCopies: 2,
          totalCopies: 3,
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    mockLibraryApi.getBook.mockResolvedValue({
      id: 'book-1',
      openLibraryId: 'OL1M',
      isbn13: '9780131103627',
      title: 'The C Programming Language',
      subtitle: null,
      authors: 'Kernighan, Ritchie',
      subjects: ['software engineering'],
      publisher: 'Prentice Hall',
      publishedAt: '1988',
      language: 'en',
      coverUrl: null,
      description: null,
      shelfCode: 'SE-01',
      isActive: true,
      availableCopies: 2,
      copies: [
        {
          id: 'copy-1',
          copyCode: 'CP-01',
          status: 'available',
          conditionNote: null,
          acquiredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });
    mockLibraryApi.getMyLoans.mockResolvedValue([]);
    mockLibraryApi.getMyLoanRequests.mockResolvedValue([]);
    mockLibraryApi.createLoanRequest.mockResolvedValue({
      id: 'request-1',
      status: 'pending',
      note: null,
      createdAt: new Date().toISOString(),
      approvedAt: null,
      requester: {
        id: 'student-1',
        studentId: '22520001',
        fullName: 'Student One',
        email: 'student@example.com',
      },
      approvedBy: null,
      book: {
        id: 'book-1',
        title: 'The C Programming Language',
        authors: 'Kernighan, Ritchie',
      },
      copy: {
        id: 'copy-1',
        copyCode: 'CP-01',
      },
    });
  });

  it('renders library book list for student role', async () => {
    const { getByText, getAllByText } = renderWithClient(<LibraryScreen />);

    await waitFor(() => expect(getByText('The C Programming Language')).toBeTruthy());
    expect(getAllByText('Tìm sách').length).toBeGreaterThan(0);
    expect(getByText('Chọn sách này')).toBeTruthy();
  });

  it('renders book cover image when coverUrl exists', async () => {
    mockLibraryApi.listBooks.mockResolvedValue({
      items: [
        {
          id: 'book-2',
          openLibraryId: 'OL2M',
          isbn13: '9780134757599',
          title: 'Refactoring',
          subtitle: null,
          authors: 'Martin Fowler',
          subjects: ['software engineering'],
          publisher: 'Addison-Wesley',
          publishedAt: '2018',
          language: 'en',
          coverUrl: 'https://img.test/refactoring.jpg',
          shelfCode: 'SE-02',
          availableCopies: 1,
          totalCopies: 1,
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });

    const { getByLabelText } = renderWithClient(<LibraryScreen />);

    await waitFor(() => expect(getByLabelText('Bìa sách Refactoring')).toBeTruthy());
  });
});
