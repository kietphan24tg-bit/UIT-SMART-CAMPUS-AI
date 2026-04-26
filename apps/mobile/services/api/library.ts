import { apiClient } from './client';

export interface LibraryBookListItem {
  id: string;
  openLibraryId: string | null;
  isbn13: string | null;
  title: string;
  subtitle: string | null;
  authors: string;
  subjects: string[];
  publisher: string | null;
  publishedAt: string | null;
  language: string | null;
  coverUrl: string | null;
  shelfCode: string | null;
  availableCopies: number;
  totalCopies: number;
}

export interface LibraryBookListResponse {
  items: LibraryBookListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LibraryBookCopyRecord {
  id: string;
  copyCode: string;
  status: 'available' | 'borrowed' | 'reserved' | 'lost' | 'maintenance';
  conditionNote: string | null;
  acquiredAt: string;
  updatedAt: string;
}

export interface LibraryBookDetail {
  id: string;
  openLibraryId: string | null;
  isbn13: string | null;
  title: string;
  subtitle: string | null;
  authors: string;
  subjects: string[];
  publisher: string | null;
  publishedAt: string | null;
  language: string | null;
  coverUrl: string | null;
  description: string | null;
  shelfCode: string | null;
  isActive: boolean;
  availableCopies: number;
  copies: LibraryBookCopyRecord[];
}

export interface LibraryLoanRecord {
  id: string;
  status: 'borrowed' | 'overdue' | 'returned';
  borrowedAt: string;
  dueAt: string;
  returnedAt: string | null;
  renewedCount: number;
  book: {
    id: string;
    title: string;
    authors: string;
  };
  copy: {
    id: string;
    copyCode: string;
  };
}

export interface LibraryReservationRecord {
  id: string;
  status: 'active' | 'cancelled' | 'fulfilled' | 'expired';
  note: string | null;
  createdAt: string;
  expiresAt: string;
  fulfilledAt: string | null;
  cancelledAt: string | null;
  book: {
    id: string;
    title: string;
    authors: string;
    coverUrl: string | null;
  };
}

export const libraryApi = {
  listBooks: async ({
    q,
    subject,
    page = 1,
    limit = 20,
  }: {
    q?: string;
    subject?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<LibraryBookListResponse> => {
    return (await apiClient.get('/library/books', {
      params: {
        ...(q ? { q } : {}),
        ...(subject ? { subject } : {}),
        page,
        limit,
      },
    })) as LibraryBookListResponse;
  },

  getBook: async (bookId: string): Promise<LibraryBookDetail> => {
    return (await apiClient.get(`/library/books/${encodeURIComponent(bookId)}`)) as LibraryBookDetail;
  },

  getMyLoans: async (): Promise<LibraryLoanRecord[]> => {
    return (await apiClient.get('/library/me/loans')) as LibraryLoanRecord[];
  },

  getMyReservations: async (): Promise<LibraryReservationRecord[]> => {
    return (await apiClient.get('/library/me/reservations')) as LibraryReservationRecord[];
  },

  createReservation: async (bookId: string, note?: string) => {
    return (await apiClient.post('/library/reservations', {
      bookId,
      ...(note ? { note } : {}),
    })) as {
      id: string;
      status: string;
      expiresAt: string;
    };
  },

  cancelReservation: async (reservationId: string) => {
    return (await apiClient.delete(
      `/library/reservations/${encodeURIComponent(reservationId)}`,
    )) as {
      id: string;
      status: string;
      cancelledAt?: string;
    };
  },

  renewLoan: async (loanId: string) => {
    return (await apiClient.patch(
      `/library/loans/${encodeURIComponent(loanId)}/renew`,
    )) as {
      id: string;
      dueAt: string;
      renewedCount: number;
    };
  },
};
