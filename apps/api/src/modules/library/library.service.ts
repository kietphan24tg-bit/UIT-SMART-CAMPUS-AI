import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LibraryBookCopyStatus,
  LibraryLoanRequestStatus,
  LibraryLoanStatus,
  Role,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { AvatarStorageService, type AvatarUploadFile } from '../storage/avatar-storage.service';

import type {
  CheckoutLibraryLoanDto,
  CreateLibraryBookDto,
  CreateLibraryCopyDto,
  CreateLibraryLoanRequestDto,
  CreateReservationDto,
  ListLibraryBooksQueryDto,
  UpdateLibraryCopyDto,
  UpdateLibraryBookDto,
} from './dto/create-library-book.dto';

const STUDENT_MAX_BORROWED = 3;
const STUDENT_BORROW_DAYS = 14;
const STUDENT_MAX_RENEW = 1;
const LECTURER_MAX_BORROWED = 5;
const LECTURER_BORROW_DAYS = 30;
const LECTURER_MAX_RENEW = 2;
const RESERVATION_EXPIRES_HOURS = 48;
const ACTIVE_LOAN_STATUSES: LibraryLoanStatus[] = [
  LibraryLoanStatus.borrowed,
  LibraryLoanStatus.overdue,
];

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly avatarStorageService: AvatarStorageService,
  ) {}

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
        availableCopies: item.copies.filter(
          (copy) => copy.status === LibraryBookCopyStatus.available,
        ).length,
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
      throw new NotFoundException('Khong tim thay sach');
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
        ...(dto.openLibraryId !== undefined
          ? { openLibraryId: dto.openLibraryId?.trim() || null }
          : {}),
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
        acquiredAt: dto.acquiredAt
          ? this.parseOptionalDate(dto.acquiredAt, 'Ngay nhap ban sao khong hop le')
          : null,
      },
    });
  }

  async listAdminBooks() {
    const books = await this.prisma.libraryBook.findMany({
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
      orderBy: [{ updatedAt: 'desc' }, { title: 'asc' }],
    });

    return books.map((book) => ({
      id: book.id,
      openLibraryId: book.openLibraryId,
      isbn13: book.isbn13,
      title: book.title,
      subtitle: book.subtitle,
      authors: book.authors,
      subjects: book.subjects,
      publisher: book.publisher,
      publishedAt: book.publishedAt,
      language: book.language,
      coverUrl: book.coverUrl,
      description: book.description,
      shelfCode: book.shelfCode,
      isActive: book.isActive,
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString(),
      availableCopies: book.copies.filter((copy) => copy.status === LibraryBookCopyStatus.available)
        .length,
      copies: book.copies.map((copy) => ({
        id: copy.id,
        copyCode: copy.copyCode,
        status: copy.status,
        conditionNote: copy.conditionNote,
        acquiredAt: toISO(copy.acquiredAt),
        updatedAt: copy.updatedAt.toISOString(),
      })),
    }));
  }

  async uploadBookCover(actorId: string, file: AvatarUploadFile) {
    return this.avatarStorageService.uploadLibraryBookCover(actorId, file);
  }

  async deleteBook(bookId: string) {
    const book = await this.prisma.libraryBook.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        copies: { select: { id: true }, take: 1 },
        loanRequests: { select: { id: true }, take: 1 },
        reservations: { select: { id: true }, take: 1 },
      },
    });
    if (!book) {
      throw new NotFoundException('Khong tim thay sach');
    }
    if (book.copies.length > 0 || book.loanRequests.length > 0 || book.reservations.length > 0) {
      throw new BadRequestException('Sach da phat sinh du lieu lien quan nen khong the xoa');
    }

    await this.prisma.libraryBook.delete({
      where: { id: bookId },
    });

    return { id: bookId, deleted: true };
  }

  async updateCopy(copyId: string, dto: UpdateLibraryCopyDto) {
    await this.assertCopyExists(copyId);
    return this.prisma.libraryBookCopy.update({
      where: { id: copyId },
      data: {
        ...(dto.copyCode !== undefined ? { copyCode: dto.copyCode.trim() } : {}),
        ...(dto.conditionNote !== undefined
          ? { conditionNote: dto.conditionNote?.trim() || null }
          : {}),
        ...(dto.acquiredAt !== undefined
          ? {
              acquiredAt: dto.acquiredAt
                ? this.parseOptionalDate(dto.acquiredAt, 'Ngay nhap ban sao khong hop le')
                : null,
            }
          : {}),
      },
    });
  }

  async deleteCopy(copyId: string) {
    const copy = await this.prisma.libraryBookCopy.findUnique({
      where: { id: copyId },
      select: {
        id: true,
        loans: { select: { id: true }, take: 1 },
        loanRequests: { select: { id: true }, take: 1 },
      },
    });
    if (!copy) {
      throw new NotFoundException('Khong tim thay ban sao sach');
    }
    if (copy.loans.length > 0 || copy.loanRequests.length > 0) {
      throw new BadRequestException('Ban sao da phat sinh du lieu lien quan nen khong the xoa');
    }

    await this.prisma.libraryBookCopy.delete({
      where: { id: copyId },
    });

    return { id: copyId, deleted: true };
  }

  async createLoanRequest(userId: string, dto: CreateLibraryLoanRequestDto) {
    const borrower = await this.getEligibleBorrower(userId);
    await this.assertBorrowCapacity(borrower.id, borrower.role);

    const copy = await this.prisma.libraryBookCopy.findUnique({
      where: { id: dto.copyId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            isActive: true,
          },
        },
      },
    });

    if (!copy || copy.bookId !== dto.bookId) {
      throw new BadRequestException('Ban sao sach khong thuoc dau sach da chon');
    }
    if (!copy.book.isActive) {
      throw new NotFoundException('Khong tim thay sach');
    }
    if (copy.status !== LibraryBookCopyStatus.available) {
      throw new BadRequestException('Ban sao sach hien khong o trang thai san sang');
    }

    const existing = await this.prisma.libraryLoanRequest.findFirst({
      where: {
        requesterId: borrower.id,
        copyId: copy.id,
        status: LibraryLoanRequestStatus.pending,
      },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('Ban da co don muon dang cho duyet cho ban sao nay');
    }

    const createdRequest = await this.prisma.libraryLoanRequest.create({
      data: {
        bookId: copy.bookId,
        copyId: copy.id,
        requesterId: borrower.id,
        note: dto.note?.trim() || null,
      },
      include: this.loanRequestInclude,
    });

    return this.mapLoanRequest(createdRequest);
  }

  async listMyLoanRequests(userId: string, status?: LibraryLoanRequestStatus) {
    const items = await this.prisma.libraryLoanRequest.findMany({
      where: {
        requesterId: userId,
        ...(status ? { status } : {}),
      },
      include: this.loanRequestInclude,
      orderBy: [{ createdAt: 'desc' }],
    });

    return items.map((item) => this.mapLoanRequest(item));
  }

  async getLoanRequest(requestId: string, userId: string, isAdmin: boolean) {
    const request = await this.prisma.libraryLoanRequest.findUnique({
      where: { id: requestId },
      include: this.loanRequestInclude,
    });
    if (!request) {
      throw new NotFoundException('Khong tim thay don muon');
    }
    if (!isAdmin && request.requesterId !== userId) {
      throw new ForbiddenException('Ban khong co quyen xem don muon nay');
    }

    return this.mapLoanRequest(request);
  }

  async cancelLoanRequest(requestId: string, userId: string) {
    const request = await this.prisma.libraryLoanRequest.findUnique({
      where: { id: requestId },
      include: this.loanRequestInclude,
    });
    if (!request) {
      throw new NotFoundException('Khong tim thay don muon');
    }
    if (request.requesterId !== userId) {
      throw new ForbiddenException('Ban khong co quyen huy don muon nay');
    }
    if (request.status !== LibraryLoanRequestStatus.pending) {
      throw new BadRequestException('Chi co the huy don muon dang cho duyet');
    }

    const updatedRequest = await this.prisma.libraryLoanRequest.update({
      where: { id: request.id },
      data: {
        status: LibraryLoanRequestStatus.cancelled,
      },
      include: this.loanRequestInclude,
    });

    return this.mapLoanRequest(updatedRequest);
  }

  async deleteLoanRequest(requestId: string, userId: string) {
    const request = await this.prisma.libraryLoanRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        requesterId: true,
        status: true,
      },
    });
    if (!request) {
      throw new NotFoundException('Khong tim thay don muon');
    }
    if (request.requesterId !== userId) {
      throw new ForbiddenException('Ban khong co quyen xoa don muon nay');
    }
    if (
      request.status !== LibraryLoanRequestStatus.cancelled &&
      request.status !== LibraryLoanRequestStatus.rejected &&
      request.status !== LibraryLoanRequestStatus.approved
    ) {
      throw new BadRequestException('Chi co the xoa don muon da duoc xu ly hoac da huy');
    }

    await this.prisma.libraryLoanRequest.delete({
      where: { id: request.id },
    });

    return { id: request.id, deleted: true };
  }

  async listAdminLoanRequests(status?: LibraryLoanRequestStatus) {
    const items = await this.prisma.libraryLoanRequest.findMany({
      where: status ? { status } : {},
      include: this.loanRequestInclude,
      orderBy: [{ createdAt: 'desc' }],
    });

    return items.map((item) => this.mapLoanRequest(item));
  }

  async approveLoanRequest(requestId: string, approverId: string) {
    const now = new Date();
    const updatedRequest = await this.prisma.$transaction(async (tx) => {
      const request = await tx.libraryLoanRequest.findUnique({
        where: { id: requestId },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              authors: true,
              isActive: true,
            },
          },
          copy: {
            select: {
              id: true,
              bookId: true,
              copyCode: true,
              status: true,
            },
          },
          requester: {
            select: {
              id: true,
              studentId: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              studentId: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!request) {
        throw new NotFoundException('Khong tim thay don muon');
      }
      if (request.status !== LibraryLoanRequestStatus.pending) {
        throw new BadRequestException('Chi co the duyet don dang cho');
      }
      if (!request.requester.isActive) {
        throw new NotFoundException('Khong tim thay nguoi muon');
      }
      if (!request.book.isActive || request.copy.bookId !== request.bookId) {
        throw new BadRequestException('Du lieu don muon khong hop le');
      }
      if (request.copy.status !== LibraryBookCopyStatus.available) {
        throw new BadRequestException('Ban sao sach hien khong o trang thai san sang');
      }

      await this.assertBorrowCapacity(request.requester.id, request.requester.role, tx);

      const dueAt = new Date(now);
      dueAt.setDate(dueAt.getDate() + getBorrowPolicy(request.requester.role).borrowDays);

      await tx.libraryLoan.create({
        data: {
          copyId: request.copyId,
          borrowerId: request.requesterId,
          dueAt,
          borrowNote: request.note,
        },
      });

      await tx.libraryBookCopy.update({
        where: { id: request.copyId },
        data: { status: LibraryBookCopyStatus.borrowed },
      });

      return tx.libraryLoanRequest.update({
        where: { id: request.id },
        data: {
          status: LibraryLoanRequestStatus.approved,
          approvedById: approverId,
          approvedAt: now,
        },
        include: this.loanRequestInclude,
      });
    });

    return this.mapLoanRequest(updatedRequest);
  }

  async rejectLoanRequest(requestId: string, approverId: string) {
    const request = await this.prisma.libraryLoanRequest.findUnique({
      where: { id: requestId },
      select: { id: true, status: true },
    });
    if (!request) {
      throw new NotFoundException('Khong tim thay don muon');
    }
    if (request.status !== LibraryLoanRequestStatus.pending) {
      throw new BadRequestException('Chi co the tu choi don dang cho');
    }

    const updatedRequest = await this.prisma.libraryLoanRequest.update({
      where: { id: request.id },
      data: {
        status: LibraryLoanRequestStatus.rejected,
        approvedById: approverId,
        approvedAt: new Date(),
      },
      include: this.loanRequestInclude,
    });

    return this.mapLoanRequest(updatedRequest);
  }

  async markCopyStatus(copyId: string, status: LibraryBookCopyStatus, conditionNote?: string) {
    const copy = await this.prisma.libraryBookCopy.findUnique({
      where: { id: copyId },
      select: { id: true },
    });
    if (!copy) {
      throw new NotFoundException('Khong tim thay ban sao sach');
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
    const borrower = await this.getEligibleBorrower(dto.borrowerId);
    await this.assertBorrowCapacity(borrower.id, borrower.role);

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
      throw new NotFoundException('Khong tim thay ban sao sach co the muon');
    }
    if (selectedCopy.status !== LibraryBookCopyStatus.available) {
      throw new BadRequestException('Ban sao sach hien khong o trang thai san sang');
    }

    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + getBorrowPolicy(borrower.role).borrowDays);

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
      throw new NotFoundException('Khong tim thay phieu muon');
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

  async listAdminLoans() {
    const loans = await this.prisma.libraryLoan.findMany({
      where: {
        status: {
          in: ACTIVE_LOAN_STATUSES,
        },
      },
      include: {
        borrower: {
          select: {
            id: true,
            studentId: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        copy: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                authors: true,
              },
            },
          },
        },
      },
      orderBy: [{ dueAt: 'asc' }, { borrowedAt: 'desc' }],
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
      borrowNote: loan.borrowNote,
      returnNote: loan.returnNote,
      borrower: {
        id: loan.borrower.id,
        studentId: loan.borrower.studentId,
        fullName: `${loan.borrower.firstName} ${loan.borrower.lastName}`.trim(),
        email: loan.borrower.email,
        role: loan.borrower.role,
      },
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

  async deleteReturnedLoan(loanId: string, userId?: string | null, isAdmin = false) {
    const loan = await this.prisma.libraryLoan.findUnique({
      where: { id: loanId },
      select: { id: true, status: true, borrowerId: true },
    });
    if (!loan) {
      throw new NotFoundException('Khong tim thay phieu muon');
    }
    if (!isAdmin && loan.borrowerId !== userId) {
      throw new ForbiddenException('Ban khong co quyen xoa phieu muon nay');
    }
    if (loan.status !== LibraryLoanStatus.returned) {
      throw new BadRequestException('Chi co the xoa phieu muon da tra');
    }

    await this.prisma.libraryLoan.delete({
      where: { id: loan.id },
    });

    return { id: loan.id, deleted: true };
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
      throw new NotFoundException('Khong tim thay phieu muon');
    }
    if (loan.borrowerId !== userId) {
      throw new ForbiddenException('Ban khong co quyen gia han phieu muon nay');
    }
    if (loan.status === LibraryLoanStatus.returned) {
      throw new BadRequestException('Phieu muon da tra khong the gia han');
    }
    if (loan.dueAt < new Date()) {
      throw new BadRequestException('Phieu muon da qua han nen khong the gia han');
    }
    const policy = getBorrowPolicy(role);
    if (loan.renewedCount >= policy.maxRenew) {
      throw new BadRequestException('Da het so lan gia han cho phep');
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
      throw new NotFoundException('Khong tim thay sach');
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
      throw new BadRequestException('Ban da co yeu cau giu cho con hieu luc cho sach nay');
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
      throw new NotFoundException('Khong tim thay yeu cau giu cho');
    }
    if (!isAdmin && reservation.requesterId !== userId) {
      throw new ForbiddenException('Ban khong co quyen huy yeu cau nay');
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
      throw new NotFoundException('Khong tim thay sach');
    }
  }

  private async assertCopyExists(copyId: string) {
    const copy = await this.prisma.libraryBookCopy.findUnique({
      where: { id: copyId },
      select: { id: true },
    });
    if (!copy) {
      throw new NotFoundException('Khong tim thay ban sao sach');
    }
  }

  private parseOptionalDate(value: string, message: string) {
    const trimmed = value.trim();
    const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

    if (dateOnlyMatch) {
      const year = Number(dateOnlyMatch[1]);
      const month = Number(dateOnlyMatch[2]);
      const day = Number(dateOnlyMatch[3]);
      const parsedDateOnly = new Date(Date.UTC(year, month - 1, day));

      if (
        parsedDateOnly.getUTCFullYear() !== year ||
        parsedDateOnly.getUTCMonth() !== month - 1 ||
        parsedDateOnly.getUTCDate() !== day
      ) {
        throw new BadRequestException(message);
      }

      return parsedDateOnly;
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(message);
    }
    return parsed;
  }

  private async getEligibleBorrower(userId: string) {
    const borrower = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!borrower || !borrower.isActive) {
      throw new NotFoundException('Khong tim thay nguoi muon');
    }
    if (borrower.role !== Role.student && borrower.role !== Role.lecturer) {
      throw new BadRequestException('Chi sinh vien hoac giang vien duoc muon sach');
    }

    return borrower;
  }

  private async assertBorrowCapacity(
    borrowerId: string,
    role: Role,
    prismaClient: Pick<PrismaService, 'libraryLoan'> = this.prisma,
  ) {
    const policy = getBorrowPolicy(role);
    const activeLoanCount = await prismaClient.libraryLoan.count({
      where: {
        borrowerId,
        status: {
          in: ACTIVE_LOAN_STATUSES,
        },
      },
    });
    if (activeLoanCount >= policy.maxBorrowed) {
      throw new BadRequestException('Da vuot qua so luong sach co the muon');
    }
  }

  private readonly loanRequestInclude = {
    book: {
      select: {
        id: true,
        title: true,
        authors: true,
      },
    },
    copy: {
      select: {
        id: true,
        copyCode: true,
      },
    },
    requester: {
      select: {
        id: true,
        studentId: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    },
    approvedBy: {
      select: {
        id: true,
        studentId: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    },
  } as const;

  private mapLoanRequest(request: {
    id: string;
    status: LibraryLoanRequestStatus;
    note: string | null;
    createdAt: Date;
    approvedAt: Date | null;
    book: { id: string; title: string; authors: string };
    copy: { id: string; copyCode: string };
    requester: {
      id: string;
      studentId: string | null;
      email: string;
      firstName: string;
      lastName: string;
    };
    approvedBy?: {
      id: string;
      studentId: string | null;
      email: string;
      firstName: string;
      lastName: string;
    } | null;
  }) {
    return {
      id: request.id,
      status: request.status,
      note: request.note,
      createdAt: request.createdAt.toISOString(),
      approvedAt: toISO(request.approvedAt),
      requester: {
        id: request.requester.id,
        studentId: request.requester.studentId,
        fullName: this.buildFullName(request.requester.firstName, request.requester.lastName),
        email: request.requester.email,
      },
      approvedBy: request.approvedBy
        ? {
            id: request.approvedBy.id,
            studentId: request.approvedBy.studentId,
            fullName: this.buildFullName(request.approvedBy.firstName, request.approvedBy.lastName),
            email: request.approvedBy.email,
          }
        : null,
      book: request.book,
      copy: request.copy,
    };
  }

  private buildFullName(firstName?: string | null, lastName?: string | null) {
    return `${firstName ?? ''} ${lastName ?? ''}`.trim();
  }
}
