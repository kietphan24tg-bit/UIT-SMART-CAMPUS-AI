import { apiClient, postMultipart } from './client';

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

export interface AdminLibraryBookRecord extends LibraryBookDetail {
  createdAt: string;
  updatedAt: string;
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

export interface LibraryLoanRequestRecord {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  note: string | null;
  createdAt: string;
  approvedAt: string | null;
  requester: {
    id: string;
    studentId: string | null;
    fullName: string;
    email: string;
  };
  approvedBy: {
    id: string;
    studentId: string | null;
    fullName: string;
    email: string;
  } | null;
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

export interface AdminLibraryLoanRecord extends LibraryLoanRecord {
  borrowNote: string | null;
  returnNote: string | null;
  borrower: {
    id: string;
    studentId: string | null;
    fullName: string;
    email: string;
    role: string;
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

  getAdminBooks: async (): Promise<AdminLibraryBookRecord[]> => {
    return (await apiClient.get('/library/admin/books')) as AdminLibraryBookRecord[];
  },

  getAdminLoanRequests: async (
    status?: LibraryLoanRequestRecord['status'],
  ): Promise<LibraryLoanRequestRecord[]> => {
    return (await apiClient.get('/library/admin/loan-requests', {
      params: status ? { status } : undefined,
    })) as LibraryLoanRequestRecord[];
  },

  approveLoanRequest: async (requestId: string) => {
    return (await apiClient.patch(
      `/library/admin/loan-requests/${encodeURIComponent(requestId)}/approve`,
    )) as LibraryLoanRequestRecord;
  },

  rejectLoanRequest: async (requestId: string) => {
    return (await apiClient.patch(
      `/library/admin/loan-requests/${encodeURIComponent(requestId)}/reject`,
    )) as LibraryLoanRequestRecord;
  },

  uploadBookCover: async (uri: string, fileName = 'book-cover.jpg', mimeType = 'image/jpeg') => {
    return postMultipart<{ key: string; imageUrl: string }>('/library/admin/books/cover', {
      fieldName: 'cover',
      uri,
      fileName,
      mimeType,
    });
  },

  createAdminBook: async (payload: {
    title: string;
    authors: string;
    subtitle?: string;
    openLibraryId?: string;
    isbn13?: string;
    subjects?: string[];
    publisher?: string;
    publishedAt?: string;
    language?: string;
    coverUrl?: string;
    description?: string;
    shelfCode?: string;
    isActive?: boolean;
  }) => {
    return (await apiClient.post('/library/admin/books', payload)) as AdminLibraryBookRecord;
  },

  updateAdminBook: async (
    bookId: string,
    payload: Partial<{
      title: string;
      authors: string;
      subtitle: string;
      openLibraryId: string;
      isbn13: string;
      subjects: string[];
      publisher: string;
      publishedAt: string;
      language: string;
      coverUrl: string;
      description: string;
      shelfCode: string;
      isActive: boolean;
    }>,
  ) => {
    return (await apiClient.patch(`/library/admin/books/${encodeURIComponent(bookId)}`, payload)) as AdminLibraryBookRecord;
  },

  deleteAdminBook: async (bookId: string) => {
    return (await apiClient.delete(`/library/admin/books/${encodeURIComponent(bookId)}`)) as {
      id: string;
      deleted: boolean;
    };
  },

  createBookCopy: async (
    bookId: string,
    payload: {
      copyCode: string;
      conditionNote?: string;
      acquiredAt?: string;
    },
  ) => {
    return (await apiClient.post(`/library/admin/books/${encodeURIComponent(bookId)}/copies`, payload)) as LibraryBookCopyRecord;
  },

  updateBookCopy: async (
    copyId: string,
    payload: Partial<{
      copyCode: string;
      conditionNote: string;
      acquiredAt: string;
    }>,
  ) => {
    return (await apiClient.patch(`/library/admin/copies/${encodeURIComponent(copyId)}`, payload)) as LibraryBookCopyRecord;
  },

  deleteBookCopy: async (copyId: string) => {
    return (await apiClient.delete(`/library/admin/copies/${encodeURIComponent(copyId)}`)) as {
      id: string;
      deleted: boolean;
    };
  },

  getAdminLoans: async (): Promise<AdminLibraryLoanRecord[]> => {
    return (await apiClient.get('/library/admin/loans')) as AdminLibraryLoanRecord[];
  },

  checkInLoan: async (loanId: string, note?: string) => {
    return (await apiClient.patch(`/library/admin/loans/${encodeURIComponent(loanId)}/check-in`, {
      ...(note ? { note } : {}),
    })) as { id: string; status: 'returned'; returnedAt: string | null; returnNote: string | null };
  },

  markCopyLost: async (copyId: string, conditionNote?: string) => {
    return (await apiClient.patch(`/library/admin/copies/${encodeURIComponent(copyId)}/mark-lost`, {
      ...(conditionNote ? { conditionNote } : {}),
    })) as LibraryBookCopyRecord;
  },

  markCopyMaintenance: async (copyId: string, conditionNote?: string) => {
    return (await apiClient.patch(`/library/admin/copies/${encodeURIComponent(copyId)}/mark-maintenance`, {
      ...(conditionNote ? { conditionNote } : {}),
    })) as LibraryBookCopyRecord;
  },

  getMyLoans: async (): Promise<LibraryLoanRecord[]> => {
    return (await apiClient.get('/library/me/loans')) as LibraryLoanRecord[];
  },

  getMyLoanRequests: async (status?: LibraryLoanRequestRecord['status']): Promise<LibraryLoanRequestRecord[]> => {
    return (await apiClient.get('/library/me/loan-requests', {
      params: status ? { status } : undefined,
    })) as LibraryLoanRequestRecord[];
  },

  createLoanRequest: async ({
    bookId,
    copyId,
    note,
  }: {
    bookId: string;
    copyId: string;
    note?: string;
  }) => {
    return (await apiClient.post('/library/loan-requests', {
      bookId,
      copyId,
      ...(note ? { note } : {}),
    })) as LibraryLoanRequestRecord;
  },

  cancelLoanRequest: async (requestId: string) => {
    return (await apiClient.patch(
      `/library/loan-requests/${encodeURIComponent(requestId)}/cancel`,
    )) as LibraryLoanRequestRecord;
  },

  deleteLoanRequest: async (requestId: string) => {
    return (await apiClient.delete(`/library/loan-requests/${encodeURIComponent(requestId)}`)) as {
      id: string;
      deleted: boolean;
    };
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
