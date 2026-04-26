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
}));
jest.mock('@/stores/auth-store');
jest.mock('@/services/api/library', () => ({
  libraryApi: {
    listBooks: jest.fn(),
    getMyLoans: jest.fn(),
    getMyReservations: jest.fn(),
    createReservation: jest.fn(),
    renewLoan: jest.fn(),
    cancelReservation: jest.fn(),
  },
}));

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockLibraryApi = libraryApi as unknown as {
  listBooks: jest.Mock;
  getMyLoans: jest.Mock;
  getMyReservations: jest.Mock;
  createReservation: jest.Mock;
  renewLoan: jest.Mock;
  cancelReservation: jest.Mock;
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
    mockLibraryApi.getMyLoans.mockResolvedValue([]);
    mockLibraryApi.getMyReservations.mockResolvedValue([]);
    mockLibraryApi.createReservation.mockResolvedValue({
      id: 'reservation-1',
      status: 'active',
      expiresAt: new Date().toISOString(),
    });
  });

  it('renders library book list for student role', async () => {
    const { getByText, getAllByText } = renderWithClient(<LibraryScreen />);

    await waitFor(() => expect(getByText('The C Programming Language')).toBeTruthy());
    expect(getAllByText('Giữ chỗ').length).toBeGreaterThan(0);
  });
});
