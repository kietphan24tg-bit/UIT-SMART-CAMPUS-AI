import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LibraryBookCopyStatus, LibraryLoanStatus, Role } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import type {
  CheckoutLibraryLoanDto,
  CreateLibraryBookDto,
  CreateLibraryCopyDto,
  CreateReservationDto,
  ListLibraryBooksQueryDto,
  UpdateLibraryBookDto,
} from './dto/create-library-book.dto';

const STUDENT_MAX_BORROWED = 3;
const STUDENT_BORROW_DAYS = 14;
const STUDENT_MAX_RENEW = 1;
const LECTURER_MAX_BORROWED = 5;
const LECTURER_BORROW_DAYS = 30;
const LECTURER_MAX_RENEW = 2;
const RESERVATION_EXPIRES_HOURS = 48;

function normalizePaging(page?: number, limit?: number) {
  const safePage = Number.isInteger(page) && page && page > 0 ? page : 1;
  const safeLimit = Number.isInteger(limit) && limit && limit > 0 ? Math.min(limit, 50) : 20;
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

function toISO(date: Date | null | undefined) {
  return date ? date.toISOString() : null;
}

function getBorrowPolicy(role: Role) {
  if (role === Role.lecturer) {
    return {
      maxBorrowed: LECTURER_MAX_BORROWED,
      borrowDays: LECTURER_BORROW_DAYS,
      maxRenew: LECTURER_MAX_RENEW,
    };
  }

  return {
    maxBorrowed: STUDENT_MAX_BORROWED,
    borrowDays: STUDENT_BORROW_DAYS,
    maxRenew: STUDENT_MAX_RENEW,
  };
}

@Injectable()
export class LibraryService {
  constructor(private readonly prisma: PrismaService) {}

  async listBooks(query: ListLibraryBooksQueryDto) {
    const { page, limit, skip } = normalizePaging(query.page, query.limit);
    const q = query.q?.trim();
    const subject = query.subject?.trim();

    const where = {
      isActive: true,
      ...(subject ? { subjects: { has: subject } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' as const } },
              { authors: { contains: q, mode: 'insensitive' as const } },
              { subjects: { hasSome: [q] } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.libraryBook.findMany({
        where,
        include: {
          copies: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: [{ title: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.libraryBook.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        openLibraryId: item.openLibraryId,
        isbn13: item.isbn13,
        title: item.title,
        subtitle: item.subtitle,
        authors: item.authors,
        subjects: item.subjects,
        publisher: item.publisher,
        publishedAt: item.publishedAt,
        language: item.language,
        coverUrl: item.coverUrl,
        shelfCode: item.shelfCode,
        availableCopies: item.copies.filter((copy) => copy.status === LibraryBookCopyStatus.available)
          .length,
        totalCopies: item.copies.length,
      })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getBook(bookId: string) {
    const book = await this.prisma.libraryBook.findUnique({
      where: { id: bookId },
      include: {
        copies: {
          select: {
            id: true,
            copyCode: true,
            status: true,
            conditionNote: true,
            acquiredAt: true,
            updatedAt: true,
          },
          orderBy: [{ copyCode: 'asc' }],
        },
      },
    });

    if (!book || !book.isActive) {
      throw new NotFoundException('Không tìm thấy sách');
    }

    return {
      ...book,
      availableCopies: book.copies.filter((copy) => copy.status === LibraryBookCopyStatus.available)
        .length,
    };
  }

  async createBook(dto: CreateLibraryBookDto) {
    return this.prisma.libraryBook.create({
      data: {
        title: dto.title.trim(),
        subtitle: dto.subtitle?.trim() || null,
        authors: dto.authors.trim(),
        openLibraryId: dto.openLibraryId?.trim() || null,
        isbn13: dto.isbn13?.trim() || null,
        subjects: (dto.subjects ?? []).map((item) => item.trim()).filter(Boolean),
        publisher: dto.publisher?.trim() || null,
        publishedAt: dto.publishedAt?.trim() || null,
        language: dto.language?.trim() || null,
        coverUrl: dto.coverUrl?.trim() || null,
        description: dto.description?.trim() || null,
        shelfCode: dto.shelfCode?.trim() || null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateBook(bookId: string, dto: UpdateLibraryBookDto) {
    await this.assertBookExists(bookId);
    return this.prisma.libraryBook.update({
      where: { id: bookId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.subtitle !== undefined ? { subtitle: dto.subtitle?.trim() || null } : {}),
        ...(dto.authors !== undefined ? { authors: dto.authors.trim() } : {}),
        ...(dto.openLibraryId !== undefined ? { openLibraryId: dto.openLibraryId?.trim() || null } : {}),
        ...(dto.isbn13 !== undefined ? { isbn13: dto.isbn13?.trim() || null } : {}),
        ...(dto.subjects !== undefined
          ? { subjects: dto.subjects.map((item) => item.trim()).filter(Boolean) }
          : {}),
        ...(dto.publisher !== undefined ? { publisher: dto.publisher?.trim() || null } : {}),
        ...(dto.publishedAt !== undefined ? { publishedAt: dto.publishedAt?.trim() || null } : {}),
        ...(dto.language !== undefined ? { language: dto.language?.trim() || null } : {}),
        ...(dto.coverUrl !== undefined ? { coverUrl: dto.coverUrl?.trim() || null } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.shelfCode !== undefined ? { shelfCode: dto.shelfCode?.trim() || null } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async addCopy(bookId: string, dto: CreateLibraryCopyDto) {
    await this.assertBookExists(bookId);
    return this.prisma.libraryBookCopy.create({
      data: {
        bookId,
        copyCode: dto.copyCode.trim(),
        conditionNote: dto.conditionNote?.trim() || null,
      },
    });
  }

  async markCopyStatus(copyId: string, status: LibraryBookCopyStatus, conditionNote?: string) {
    const copy = await this.prisma.libraryBookCopy.findUnique({
      where: { id: copyId },
      select: { id: true },
    });
    if (!copy) {
      throw new NotFoundException('Không tìm thấy bản sao sách');
    }
    return this.prisma.libraryBookCopy.update({
      where: { id: copyId },
      data: {
        status,
        conditionNote: conditionNote?.trim() || null,
      },
    });
  }

  async checkout(dto: CheckoutLibraryLoanDto) {
    const borrower = await this.prisma.user.findUnique({
      where: { id: dto.borrowerId },
      select: { id: true, role: true, isActive: true },
    });

    if (!borrower || !borrower.isActive) {
      throw new NotFoundException('Không tìm thấy người mượn');
    }
    if (borrower.role !== Role.student && borrower.role !== Role.lecturer) {
      throw new BadRequestException('Chỉ sinh viên hoặc giảng viên được mượn sách');
    }

    const policy = getBorrowPolicy(borrower.role);
    const activeLoanCount = await this.prisma.libraryLoan.count({
      where: {
        borrowerId: borrower.id,
        status: {
          in: [LibraryLoanStatus.borrowed, LibraryLoanStatus.overdue],
        },
      },
    });
    if (activeLoanCount >= policy.maxBorrowed) {
      throw new BadRequestException('Đã vượt quá số lượng sách có thể mượn');
    }

    const copy = dto.copyId
      ? await this.prisma.libraryBookCopy.findUnique({
          where: { id: dto.copyId },
          include: { book: true },
        })
      : null;
    const selectedCopy =
      copy ??
      (await this.prisma.libraryBookCopy.findFirst({
        where: {
          status: LibraryBookCopyStatus.available,
          book: { isActive: true },
        },
        include: { book: true },
        orderBy: [{ copyCode: 'asc' }],
      }));

    if (!selectedCopy || !selectedCopy.book.isActive) {
      throw new NotFoundException('Không tìm thấy bản sao sách có thể mượn');
    }
    if (selectedCopy.status !== LibraryBookCopyStatus.available) {
      throw new BadRequestException('Bản sao sách hiện không ở trạng thái sẵn sàng');
    }

    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + policy.borrowDays);

    return this.prisma.$transaction(async (tx) => {
      const loan = await tx.libraryLoan.create({
        data: {
          copyId: selectedCopy.id,
          borrowerId: borrower.id,
          dueAt,
          borrowNote: dto.note?.trim() || null,
        },
      });

      await tx.libraryBookCopy.update({
        where: { id: selectedCopy.id },
        data: { status: LibraryBookCopyStatus.borrowed },
      });

      await tx.libraryReservation.updateMany({
        where: {
          bookId: selectedCopy.bookId,
          requesterId: borrower.id,
          status: 'active',
        },
        data: {
          status: 'fulfilled',
          fulfilledAt: new Date(),
        },
      });

      return loan;
    });
  }

  async checkin(loanId: string, note?: string) {
    const loan = await this.prisma.libraryLoan.findUnique({
      where: { id: loanId },
      include: {
        copy: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });
    if (!loan) {
      throw new NotFoundException('Không tìm thấy phiếu mượn');
    }
    if (loan.status === LibraryLoanStatus.returned) {
      return loan;
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedLoan = await tx.libraryLoan.update({
        where: { id: loan.id },
        data: {
          status: LibraryLoanStatus.returned,
          returnedAt: new Date(),
          returnNote: note?.trim() || null,
        },
      });
      await tx.libraryBookCopy.update({
        where: { id: loan.copyId },
        data: { status: LibraryBookCopyStatus.available },
      });
      return updatedLoan;
    });
  }

  async listMyLoans(userId: string) {
    const loans = await this.prisma.libraryLoan.findMany({
      where: { borrowerId: userId },
      include: {
        copy: {
          include: {
            book: true,
          },
        },
      },
      orderBy: [{ borrowedAt: 'desc' }],
    });

    const now = new Date();
    return loans.map((loan) => ({
      id: loan.id,
      status:
        loan.status !== LibraryLoanStatus.returned && loan.dueAt < now
          ? LibraryLoanStatus.overdue
          : loan.status,
      borrowedAt: loan.borrowedAt.toISOString(),
      dueAt: loan.dueAt.toISOString(),
      returnedAt: toISO(loan.returnedAt),
      renewedCount: loan.renewedCount,
      book: {
        id: loan.copy.book.id,
        title: loan.copy.book.title,
        authors: loan.copy.book.authors,
      },
      copy: {
        id: loan.copy.id,
        copyCode: loan.copy.copyCode,
      },
    }));
  }

  async renewLoan(userId: string, role: Role, loanId: string) {
    const loan = await this.prisma.libraryLoan.findUnique({
      where: { id: loanId },
      include: {
        copy: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });
    if (!loan) {
      throw new NotFoundException('Không tìm thấy phiếu mượn');
    }
    if (loan.borrowerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền gia hạn phiếu mượn này');
    }
    if (loan.status === LibraryLoanStatus.returned) {
      throw new BadRequestException('Phiếu mượn đã trả không thể gia hạn');
    }
    if (loan.dueAt < new Date()) {
      throw new BadRequestException('Phiếu mượn đã quá hạn nên không thể gia hạn');
    }
    const policy = getBorrowPolicy(role);
    if (loan.renewedCount >= policy.maxRenew) {
      throw new BadRequestException('Đã hết số lần gia hạn cho phép');
    }

    const nextDueAt = new Date(loan.dueAt);
    nextDueAt.setDate(nextDueAt.getDate() + policy.borrowDays);

    return this.prisma.libraryLoan.update({
      where: { id: loan.id },
      data: {
        dueAt: nextDueAt,
        renewedCount: {
          increment: 1,
        },
      },
    });
  }

  async listMyReservations(userId: string) {
    const reservations = await this.prisma.libraryReservation.findMany({
      where: { requesterId: userId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            coverUrl: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return reservations.map((item) => ({
      id: item.id,
      status: item.status,
      note: item.note,
      createdAt: item.createdAt.toISOString(),
      expiresAt: item.expiresAt.toISOString(),
      fulfilledAt: toISO(item.fulfilledAt),
      cancelledAt: toISO(item.cancelledAt),
      book: item.book,
    }));
  }

  async createReservation(userId: string, dto: CreateReservationDto) {
    const book = await this.prisma.libraryBook.findUnique({
      where: { id: dto.bookId },
      select: { id: true, isActive: true },
    });
    if (!book || !book.isActive) {
      throw new NotFoundException('Không tìm thấy sách');
    }

    const existing = await this.prisma.libraryReservation.findFirst({
      where: {
        requesterId: userId,
        bookId: book.id,
        status: 'active',
      },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('Bạn đã có yêu cầu giữ chỗ còn hiệu lực cho sách này');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RESERVATION_EXPIRES_HOURS);

    return this.prisma.libraryReservation.create({
      data: {
        requesterId: userId,
        bookId: book.id,
        note: dto.note?.trim() || null,
        expiresAt,
      },
    });
  }

  async cancelReservation(userId: string, reservationId: string, isAdmin: boolean) {
    const reservation = await this.prisma.libraryReservation.findUnique({
      where: { id: reservationId },
      select: {
        id: true,
        requesterId: true,
        status: true,
      },
    });
    if (!reservation) {
      throw new NotFoundException('Không tìm thấy yêu cầu giữ chỗ');
    }
    if (!isAdmin && reservation.requesterId !== userId) {
      throw new ForbiddenException('Bạn không có quyền hủy yêu cầu này');
    }
    if (reservation.status !== 'active') {
      return reservation;
    }

    return this.prisma.libraryReservation.update({
      where: { id: reservation.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });
  }

  private async assertBookExists(bookId: string) {
    const book = await this.prisma.libraryBook.findUnique({
      where: { id: bookId },
      select: { id: true },
    });
    if (!book) {
      throw new NotFoundException('Không tìm thấy sách');
    }
  }
}
