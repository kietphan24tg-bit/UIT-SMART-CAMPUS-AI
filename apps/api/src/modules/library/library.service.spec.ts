import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { LibraryLoanStatus, Role } from '@prisma/client';

import { LibraryService } from './library.service';

describe('LibraryService', () => {
  const prisma: any = {
    libraryBook: {
      findUnique: jest.fn(),
    },
    libraryReservation: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    libraryLoan: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: LibraryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LibraryService(prisma);
  });

  it('rejects reservation when active reservation already exists', async () => {
    (prisma.libraryBook.findUnique as jest.Mock).mockResolvedValue({
      id: 'book-1',
      isActive: true,
    });
    (prisma.libraryReservation.findFirst as jest.Mock).mockResolvedValue({
      id: 'reservation-1',
    });

    await expect(
      service.createReservation('student-1', {
        bookId: 'book-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects renewal when loan is overdue', async () => {
    (prisma.libraryLoan.findUnique as jest.Mock).mockResolvedValue({
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
    (prisma.libraryReservation.findUnique as jest.Mock).mockResolvedValue({
      id: 'reservation-1',
      requesterId: 'student-2',
      status: 'active',
    });

    await expect(service.cancelReservation('student-1', 'reservation-1', false)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
