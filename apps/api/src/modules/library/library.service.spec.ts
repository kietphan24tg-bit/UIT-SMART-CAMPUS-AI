import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  LibraryBookCopyStatus,
  LibraryLoanRequestStatus,
  LibraryLoanStatus,
  Role,
} from '@prisma/client';

import { LibraryService } from './library.service';

describe('LibraryService', () => {
  const prisma: any = {
    user: {
      findUnique: jest.fn(),
    },
    libraryBook: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    libraryBookCopy: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    libraryLoanRequest: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    libraryReservation: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    libraryLoan: {
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const storageService = {
    uploadLibraryBookCover: jest.fn(),
  };

  let service: LibraryService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (callback: (tx: any) => unknown) =>
      callback(prisma),
    );
    service = new LibraryService(prisma, storageService as never);
  });

  it('creates a loan request successfully', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'student-1',
      role: Role.student,
      isActive: true,
    });
    prisma.libraryLoan.count.mockResolvedValue(0);
    prisma.libraryBookCopy.findUnique.mockResolvedValue({
      id: 'copy-1',
      bookId: 'book-1',
      status: LibraryBookCopyStatus.available,
      book: {
        id: 'book-1',
        title: 'Clean Code',
        authors: 'Robert C. Martin',
        isActive: true,
      },
    });
    prisma.libraryLoanRequest.findFirst.mockResolvedValue(null);
    prisma.libraryLoanRequest.create.mockResolvedValue({
      id: 'request-1',
      status: LibraryLoanRequestStatus.pending,
      note: 'Muon de hoc',
      createdAt: new Date('2026-05-07T00:00:00.000Z'),
      approvedAt: null,
      book: {
        id: 'book-1',
        title: 'Clean Code',
        authors: 'Robert C. Martin',
      },
      copy: {
        id: 'copy-1',
        copyCode: 'CC-01',
      },
      requester: {
        id: 'student-1',
        studentId: '22520001',
        email: 'student@example.com',
        firstName: 'An',
        lastName: 'Nguyen',
      },
      approvedBy: null,
    });

    const result = await service.createLoanRequest('student-1', {
      bookId: 'book-1',
      copyId: 'copy-1',
      note: 'Muon de hoc',
    });

    expect(prisma.libraryLoanRequest.create).toHaveBeenCalled();
    expect(result).toMatchObject({
      id: 'request-1',
      status: LibraryLoanRequestStatus.pending,
      note: 'Muon de hoc',
      requester: {
        id: 'student-1',
        studentId: '22520001',
        fullName: 'An Nguyen',
      },
      book: {
        id: 'book-1',
      },
      copy: {
        id: 'copy-1',
      },
    });
  });

  it('rejects loan request when copy does not belong to selected book', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'student-1',
      role: Role.student,
      isActive: true,
    });
    prisma.libraryLoan.count.mockResolvedValue(0);
    prisma.libraryBookCopy.findUnique.mockResolvedValue({
      id: 'copy-1',
      bookId: 'book-2',
      status: LibraryBookCopyStatus.available,
      book: {
        id: 'book-2',
        title: 'Refactoring',
        authors: 'Martin Fowler',
        isActive: true,
      },
    });

    await expect(
      service.createLoanRequest('student-1', {
        bookId: 'book-1',
        copyId: 'copy-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects loan request when borrower exceeds active loan limit', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'student-1',
      role: Role.student,
      isActive: true,
    });
    prisma.libraryLoan.count.mockResolvedValue(3);

    await expect(
      service.createLoanRequest('student-1', {
        bookId: 'book-1',
        copyId: 'copy-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects duplicate pending loan request for same copy', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'student-1',
      role: Role.student,
      isActive: true,
    });
    prisma.libraryLoan.count.mockResolvedValue(0);
    prisma.libraryBookCopy.findUnique.mockResolvedValue({
      id: 'copy-1',
      bookId: 'book-1',
      status: LibraryBookCopyStatus.available,
      book: {
        id: 'book-1',
        title: 'Clean Code',
        authors: 'Robert C. Martin',
        isActive: true,
      },
    });
    prisma.libraryLoanRequest.findFirst.mockResolvedValue({
      id: 'request-1',
    });

    await expect(
      service.createLoanRequest('student-1', {
        bookId: 'book-1',
        copyId: 'copy-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cancels a pending loan request for owner', async () => {
    prisma.libraryLoanRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      requesterId: 'student-1',
      status: LibraryLoanRequestStatus.pending,
      note: null,
      createdAt: new Date('2026-05-07T00:00:00.000Z'),
      approvedAt: null,
      book: {
        id: 'book-1',
        title: 'Clean Code',
        authors: 'Robert C. Martin',
      },
      copy: {
        id: 'copy-1',
        copyCode: 'CC-01',
      },
      requester: {
        id: 'student-1',
        studentId: '22520001',
        email: 'student@example.com',
        firstName: 'An',
        lastName: 'Nguyen',
      },
      approvedBy: null,
    });
    prisma.libraryLoanRequest.update.mockResolvedValue({
      id: 'request-1',
      status: LibraryLoanRequestStatus.cancelled,
      note: null,
      createdAt: new Date('2026-05-07T00:00:00.000Z'),
      approvedAt: null,
      book: {
        id: 'book-1',
        title: 'Clean Code',
        authors: 'Robert C. Martin',
      },
      copy: {
        id: 'copy-1',
        copyCode: 'CC-01',
      },
      requester: {
        id: 'student-1',
        studentId: '22520001',
        email: 'student@example.com',
        firstName: 'An',
        lastName: 'Nguyen',
      },
      approvedBy: null,
    });

    const result = await service.cancelLoanRequest('request-1', 'student-1');

    expect(prisma.libraryLoanRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'request-1' },
        data: { status: LibraryLoanRequestStatus.cancelled },
      }),
    );
    expect(result.status).toBe(LibraryLoanRequestStatus.cancelled);
  });

  it('does not allow another user to cancel loan request', async () => {
    prisma.libraryLoanRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      requesterId: 'student-2',
      status: LibraryLoanRequestStatus.pending,
      book: { id: 'book-1', title: 'Clean Code', authors: 'Robert C. Martin' },
      copy: { id: 'copy-1', copyCode: 'CC-01' },
      requester: {
        id: 'student-2',
        studentId: '22520002',
        email: 'other@example.com',
        firstName: 'Binh',
        lastName: 'Tran',
      },
      approvedBy: null,
      note: null,
      createdAt: new Date('2026-05-07T00:00:00.000Z'),
      approvedAt: null,
    });

    await expect(service.cancelLoanRequest('request-1', 'student-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('deletes a cancelled loan request for owner', async () => {
    prisma.libraryLoanRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      requesterId: 'student-1',
      status: LibraryLoanRequestStatus.cancelled,
    });
    prisma.libraryLoanRequest.delete.mockResolvedValue({ id: 'request-1' });

    const result = await service.deleteLoanRequest('request-1', 'student-1');

    expect(prisma.libraryLoanRequest.delete).toHaveBeenCalledWith({ where: { id: 'request-1' } });
    expect(result).toEqual({ id: 'request-1', deleted: true });
  });

  it('deletes an approved loan request for owner without touching the loan record', async () => {
    prisma.libraryLoanRequest.findUnique.mockResolvedValue({
      id: 'request-2',
      requesterId: 'student-1',
      status: LibraryLoanRequestStatus.approved,
    });
    prisma.libraryLoanRequest.delete.mockResolvedValue({ id: 'request-2' });

    const result = await service.deleteLoanRequest('request-2', 'student-1');

    expect(prisma.libraryLoanRequest.delete).toHaveBeenCalledWith({ where: { id: 'request-2' } });
    expect(prisma.libraryLoan.delete).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'request-2', deleted: true });
  });

  it('forbids deleting another user cancelled loan request', async () => {
    prisma.libraryLoanRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      requesterId: 'student-2',
      status: LibraryLoanRequestStatus.cancelled,
    });

    await expect(service.deleteLoanRequest('request-1', 'student-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects deleting non-cancelled loan request', async () => {
    prisma.libraryLoanRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      requesterId: 'student-1',
      status: LibraryLoanRequestStatus.pending,
    });

    await expect(service.deleteLoanRequest('request-1', 'student-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('approves a pending loan request and creates a loan', async () => {
    prisma.libraryLoanRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      requesterId: 'student-1',
      copyId: 'copy-1',
      bookId: 'book-1',
      status: LibraryLoanRequestStatus.pending,
      note: 'Muon de hoc',
      book: {
        id: 'book-1',
        title: 'Clean Code',
        authors: 'Robert C. Martin',
        isActive: true,
      },
      copy: {
        id: 'copy-1',
        bookId: 'book-1',
        copyCode: 'CC-01',
        status: LibraryBookCopyStatus.available,
      },
      requester: {
        id: 'student-1',
        studentId: '22520001',
        email: 'student@example.com',
        firstName: 'An',
        lastName: 'Nguyen',
        role: Role.student,
        isActive: true,
      },
      approvedBy: null,
    });
    prisma.libraryLoan.count.mockResolvedValue(0);
    prisma.libraryLoan.create.mockResolvedValue({ id: 'loan-1' });
    prisma.libraryBookCopy.update.mockResolvedValue({
      id: 'copy-1',
      status: LibraryBookCopyStatus.borrowed,
    });
    prisma.libraryLoanRequest.update.mockResolvedValue({
      id: 'request-1',
      status: LibraryLoanRequestStatus.approved,
      note: 'Muon de hoc',
      createdAt: new Date('2026-05-07T00:00:00.000Z'),
      approvedAt: new Date('2026-05-07T01:00:00.000Z'),
      book: {
        id: 'book-1',
        title: 'Clean Code',
        authors: 'Robert C. Martin',
      },
      copy: {
        id: 'copy-1',
        copyCode: 'CC-01',
      },
      requester: {
        id: 'student-1',
        studentId: '22520001',
        email: 'student@example.com',
        firstName: 'An',
        lastName: 'Nguyen',
      },
      approvedBy: {
        id: 'admin-1',
        studentId: null,
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'One',
      },
    });

    const result = await service.approveLoanRequest('request-1', 'admin-1');

    expect(prisma.libraryLoan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          copyId: 'copy-1',
          borrowerId: 'student-1',
          borrowNote: 'Muon de hoc',
        }),
      }),
    );
    expect(prisma.libraryBookCopy.update).toHaveBeenCalledWith({
      where: { id: 'copy-1' },
      data: { status: LibraryBookCopyStatus.borrowed },
    });
    expect(result.status).toBe(LibraryLoanRequestStatus.approved);
  });

  it('fails approval when copy is no longer available', async () => {
    prisma.libraryLoanRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      requesterId: 'student-1',
      copyId: 'copy-1',
      bookId: 'book-1',
      status: LibraryLoanRequestStatus.pending,
      note: null,
      book: {
        id: 'book-1',
        title: 'Clean Code',
        authors: 'Robert C. Martin',
        isActive: true,
      },
      copy: {
        id: 'copy-1',
        bookId: 'book-1',
        copyCode: 'CC-01',
        status: LibraryBookCopyStatus.borrowed,
      },
      requester: {
        id: 'student-1',
        studentId: '22520001',
        email: 'student@example.com',
        firstName: 'An',
        lastName: 'Nguyen',
        role: Role.student,
        isActive: true,
      },
      approvedBy: null,
    });

    await expect(service.approveLoanRequest('request-1', 'admin-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects renewal when loan is overdue', async () => {
    prisma.libraryLoan.findUnique.mockResolvedValue({
      id: 'loan-1',
      borrowerId: 'student-1',
      status: LibraryLoanStatus.borrowed,
      dueAt: new Date('2025-01-01T00:00:00.000Z'),
      renewedCount: 0,
      copy: { id: 'copy-1', status: 'borrowed' },
    });

    await expect(service.renewLoan('student-1', Role.student, 'loan-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('forbids cancellation of reservation owned by another user', async () => {
    prisma.libraryReservation.findUnique.mockResolvedValue({
      id: 'reservation-1',
      requesterId: 'student-2',
      status: 'active',
    });

    await expect(
      service.cancelReservation('student-1', 'reservation-1', false),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('deletes only returned loans', async () => {
    prisma.libraryLoan.findUnique.mockResolvedValue({
      id: 'loan-1',
      status: LibraryLoanStatus.returned,
      borrowerId: 'student-1',
    });
    prisma.libraryLoan.delete.mockResolvedValue({ id: 'loan-1' });

    const result = await service.deleteReturnedLoan('loan-1', 'student-1', false);

    expect(prisma.libraryLoan.delete).toHaveBeenCalledWith({ where: { id: 'loan-1' } });
    expect(result).toEqual({ id: 'loan-1', deleted: true });
  });

  it('forbids deleting a returned loan owned by another user', async () => {
    prisma.libraryLoan.findUnique.mockResolvedValue({
      id: 'loan-1',
      status: LibraryLoanStatus.returned,
      borrowerId: 'student-2',
    });

    await expect(service.deleteReturnedLoan('loan-1', 'student-1', false)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects deleting non-returned loan', async () => {
    prisma.libraryLoan.findUnique.mockResolvedValue({
      id: 'loan-1',
      status: LibraryLoanStatus.borrowed,
      borrowerId: 'student-1',
    });

    await expect(service.deleteReturnedLoan('loan-1', 'student-1', false)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('creates library book with cover url', async () => {
    prisma.libraryBook.create.mockResolvedValue({
      id: 'book-1',
      coverUrl: 'https://img.test/book.jpg',
    });

    await service.createBook({
      title: 'Clean Architecture',
      authors: 'Robert C. Martin',
      coverUrl: 'https://img.test/book.jpg',
    });

    expect(prisma.libraryBook.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Clean Architecture',
          authors: 'Robert C. Martin',
          coverUrl: 'https://img.test/book.jpg',
        }),
      }),
    );
  });

  it('uploads library cover through storage service', async () => {
    storageService.uploadLibraryBookCover.mockResolvedValue({
      key: 'library-books/admin-1/book.jpg',
      imageUrl: 'https://img.test/book.jpg',
    });

    const file = {
      buffer: Buffer.from('demo'),
      mimetype: 'image/jpeg',
      size: 4,
      originalname: 'book.jpg',
    };

    const result = await service.uploadBookCover('admin-1', file);

    expect(storageService.uploadLibraryBookCover).toHaveBeenCalledWith('admin-1', file);
    expect(result.imageUrl).toBe('https://img.test/book.jpg');
  });

  it('deletes book when no related data exists', async () => {
    prisma.libraryBook.findUnique.mockResolvedValue({
      id: 'book-1',
      copies: [],
      loanRequests: [],
      reservations: [],
    });
    prisma.libraryBook.delete.mockResolvedValue({ id: 'book-1' });

    const result = await service.deleteBook('book-1');

    expect(prisma.libraryBook.delete).toHaveBeenCalledWith({ where: { id: 'book-1' } });
    expect(result).toEqual({ id: 'book-1', deleted: true });
  });

  it('rejects deleting book with related data', async () => {
    prisma.libraryBook.findUnique.mockResolvedValue({
      id: 'book-1',
      copies: [{ id: 'copy-1' }],
      loanRequests: [],
      reservations: [],
    });

    await expect(service.deleteBook('book-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates and updates library copy metadata', async () => {
    prisma.libraryBook.findUnique.mockResolvedValue({ id: 'book-1' });
    prisma.libraryBookCopy.create.mockResolvedValue({
      id: 'copy-1',
      copyCode: 'LIB-001',
      acquiredAt: new Date('2026-05-07'),
    });
    prisma.libraryBookCopy.findUnique.mockResolvedValue({ id: 'copy-1' });
    prisma.libraryBookCopy.update.mockResolvedValue({ id: 'copy-1', copyCode: 'LIB-001-A' });

    await service.addCopy('book-1', {
      copyCode: 'LIB-001',
      acquiredAt: '2026-5-7',
    });
    await service.updateCopy('copy-1', {
      copyCode: 'LIB-001-A',
      acquiredAt: '2026-5-8',
    });

    expect(prisma.libraryBookCopy.create).toHaveBeenCalled();
    expect(prisma.libraryBookCopy.update).toHaveBeenCalled();
  });

  it('deletes copy when it has no loan history or requests', async () => {
    prisma.libraryBookCopy.findUnique.mockResolvedValue({
      id: 'copy-1',
      loans: [],
      loanRequests: [],
    });
    prisma.libraryBookCopy.delete.mockResolvedValue({ id: 'copy-1' });

    const result = await service.deleteCopy('copy-1');

    expect(prisma.libraryBookCopy.delete).toHaveBeenCalledWith({ where: { id: 'copy-1' } });
    expect(result).toEqual({ id: 'copy-1', deleted: true });
  });

  it('rejects deleting copy with related data', async () => {
    prisma.libraryBookCopy.findUnique.mockResolvedValue({
      id: 'copy-1',
      loans: [{ id: 'loan-1' }],
      loanRequests: [],
    });

    await expect(service.deleteCopy('copy-1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
