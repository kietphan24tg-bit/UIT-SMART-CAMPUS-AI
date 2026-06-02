import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Image } from 'expo-image';
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
    expect(getAllByText('T\u00ecm s\u00e1ch').length).toBeGreaterThan(0);
    expect(getByText('Ch\u1ecdn s\u00e1ch n\u00e0y')).toBeTruthy();
  });

  it('renders book cover image when coverUrl exists', async () => {
    const coverUrl = 'https://img.test/refactoring.jpg';

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
          coverUrl,
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

    await waitFor(() => expect(getByLabelText('B\u00eca s\u00e1ch Refactoring')).toBeTruthy());
    await waitFor(() => {
      expect(mockedExpoImage.prefetch).toHaveBeenCalledWith([coverUrl], 'disk');
    });
  });

  it('renders full approved and active loan badges for long-title cards on narrow layouts', async () => {
    mockLibraryApi.getMyLoanRequests.mockResolvedValue([
      {
        id: 'request-approved',
        status: 'approved',
        note: null,
        createdAt: '2026-05-10T09:28:39.000Z',
        approvedAt: '2026-05-10T10:00:00.000Z',
        requester: {
          id: 'student-1',
          studentId: '22520001',
          fullName: 'Student One',
          email: 'student@example.com',
        },
        approvedBy: {
          id: 'admin-1',
          studentId: null,
          fullName: 'Admin System',
          email: 'admin@example.com',
        },
        book: {
          id: 'book-approved',
          title: 'Artificial Intelligence: A Modern Approach',
          authors: 'Stuart Russell, Peter Norvig',
        },
        copy: {
          id: 'copy-approved',
          copyCode: 'LIB-005-1',
        },
      },
      {
        id: 'request-cancelled',
        status: 'cancelled',
        note: null,
        createdAt: '2026-05-10T09:33:10.000Z',
        approvedAt: null,
        requester: {
          id: 'student-1',
          studentId: '22520001',
          fullName: 'Student One',
          email: 'student@example.com',
        },
        approvedBy: null,
        book: {
          id: 'book-cancelled',
          title: 'Clean Code',
          authors: 'Robert C. Martin',
        },
        copy: {
          id: 'copy-cancelled',
          copyCode: 'LIB-003-1',
        },
      },
    ]);
    mockLibraryApi.getMyLoans.mockResolvedValue([
      {
        id: 'loan-active',
        status: 'borrowed',
        borrowedAt: '2026-05-10T08:00:00.000Z',
        dueAt: '2026-05-24T00:00:00.000Z',
        returnedAt: null,
        renewedCount: 0,
        book: {
          id: 'book-loan',
          title: 'Artificial Intelligence: A Modern Approach',
          authors: 'Stuart Russell, Peter Norvig',
        },
        copy: {
          id: 'copy-loan',
          copyCode: 'LIB-005-1',
        },
      },
    ]);

    const screen = renderWithClient(<LibraryScreen />);

    fireEvent.press(screen.getByText('Y\u00eau c\u1ea7u c\u1ee7a t\u00f4i'));

    await waitFor(() =>
      expect(screen.getAllByText('Artificial Intelligence: A Modern Approach')).toHaveLength(2),
    );

    expect(screen.getByText('\u0110\u00e3 duy\u1ec7t')).toBeTruthy();
    expect(screen.getByText('\u0110\u00e3 h\u1ee7y')).toBeTruthy();
    expect(screen.getAllByText('\u0110ang m\u01b0\u1ee3n').length).toBeGreaterThan(0);
    expect(screen.getByText('Ng\u01b0\u1eddi x\u1eed l\u00fd: Admin System')).toBeTruthy();
    expect(screen.getAllByTestId('library-request-card-header')).toHaveLength(2);
    expect(screen.getAllByTestId('library-loan-card-header')).toHaveLength(1);
  });
});
