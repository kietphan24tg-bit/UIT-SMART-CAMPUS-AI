"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var library_service_1 = require("./library.service");
describe('LibraryService', function () {
    var prisma = {
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
    var storageService = {
        uploadLibraryBookCover: jest.fn(),
    };
    var service;
    beforeEach(function () {
        jest.clearAllMocks();
        prisma.$transaction.mockImplementation(function (callback) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, callback(prisma)];
        }); }); });
        service = new library_service_1.LibraryService(prisma, storageService);
    });
    it('creates a loan request successfully', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.user.findUnique.mockResolvedValue({
                        id: 'student-1',
                        role: client_1.Role.student,
                        isActive: true,
                    });
                    prisma.libraryLoan.count.mockResolvedValue(0);
                    prisma.libraryBookCopy.findUnique.mockResolvedValue({
                        id: 'copy-1',
                        bookId: 'book-1',
                        status: client_1.LibraryBookCopyStatus.available,
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
                        status: client_1.LibraryLoanRequestStatus.pending,
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
                    return [4 /*yield*/, service.createLoanRequest('student-1', {
                            bookId: 'book-1',
                            copyId: 'copy-1',
                            note: 'Muon de hoc',
                        })];
                case 1:
                    result = _a.sent();
                    expect(prisma.libraryLoanRequest.create).toHaveBeenCalled();
                    expect(result).toMatchObject({
                        id: 'request-1',
                        status: client_1.LibraryLoanRequestStatus.pending,
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
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects loan request when copy does not belong to selected book', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.user.findUnique.mockResolvedValue({
                        id: 'student-1',
                        role: client_1.Role.student,
                        isActive: true,
                    });
                    prisma.libraryLoan.count.mockResolvedValue(0);
                    prisma.libraryBookCopy.findUnique.mockResolvedValue({
                        id: 'copy-1',
                        bookId: 'book-2',
                        status: client_1.LibraryBookCopyStatus.available,
                        book: {
                            id: 'book-2',
                            title: 'Refactoring',
                            authors: 'Martin Fowler',
                            isActive: true,
                        },
                    });
                    return [4 /*yield*/, expect(service.createLoanRequest('student-1', {
                            bookId: 'book-1',
                            copyId: 'copy-1',
                        })).rejects.toBeInstanceOf(common_1.BadRequestException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects loan request when borrower exceeds active loan limit', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.user.findUnique.mockResolvedValue({
                        id: 'student-1',
                        role: client_1.Role.student,
                        isActive: true,
                    });
                    prisma.libraryLoan.count.mockResolvedValue(3);
                    return [4 /*yield*/, expect(service.createLoanRequest('student-1', {
                            bookId: 'book-1',
                            copyId: 'copy-1',
                        })).rejects.toBeInstanceOf(common_1.BadRequestException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects duplicate pending loan request for same copy', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.user.findUnique.mockResolvedValue({
                        id: 'student-1',
                        role: client_1.Role.student,
                        isActive: true,
                    });
                    prisma.libraryLoan.count.mockResolvedValue(0);
                    prisma.libraryBookCopy.findUnique.mockResolvedValue({
                        id: 'copy-1',
                        bookId: 'book-1',
                        status: client_1.LibraryBookCopyStatus.available,
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
                    return [4 /*yield*/, expect(service.createLoanRequest('student-1', {
                            bookId: 'book-1',
                            copyId: 'copy-1',
                        })).rejects.toBeInstanceOf(common_1.BadRequestException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('cancels a pending loan request for owner', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.libraryLoanRequest.findUnique.mockResolvedValue({
                        id: 'request-1',
                        requesterId: 'student-1',
                        status: client_1.LibraryLoanRequestStatus.pending,
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
                        status: client_1.LibraryLoanRequestStatus.cancelled,
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
                    return [4 /*yield*/, service.cancelLoanRequest('request-1', 'student-1')];
                case 1:
                    result = _a.sent();
                    expect(prisma.libraryLoanRequest.update).toHaveBeenCalledWith(expect.objectContaining({
                        where: { id: 'request-1' },
                        data: { status: client_1.LibraryLoanRequestStatus.cancelled },
                    }));
                    expect(result.status).toBe(client_1.LibraryLoanRequestStatus.cancelled);
                    return [2 /*return*/];
            }
        });
    }); });
    it('does not allow another user to cancel loan request', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.libraryLoanRequest.findUnique.mockResolvedValue({
                        id: 'request-1',
                        requesterId: 'student-2',
                        status: client_1.LibraryLoanRequestStatus.pending,
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
                    return [4 /*yield*/, expect(service.cancelLoanRequest('request-1', 'student-1')).rejects.toBeInstanceOf(common_1.ForbiddenException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('deletes a cancelled loan request for owner', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.libraryLoanRequest.findUnique.mockResolvedValue({
                        id: 'request-1',
                        requesterId: 'student-1',
                        status: client_1.LibraryLoanRequestStatus.cancelled,
                    });
                    prisma.libraryLoanRequest.delete.mockResolvedValue({ id: 'request-1' });
                    return [4 /*yield*/, service.deleteLoanRequest('request-1', 'student-1')];
                case 1:
                    result = _a.sent();
                    expect(prisma.libraryLoanRequest.delete).toHaveBeenCalledWith({ where: { id: 'request-1' } });
                    expect(result).toEqual({ id: 'request-1', deleted: true });
                    return [2 /*return*/];
            }
        });
    }); });
    it('deletes an approved loan request for owner without touching the loan record', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.libraryLoanRequest.findUnique.mockResolvedValue({
                        id: 'request-2',
                        requesterId: 'student-1',
                        status: client_1.LibraryLoanRequestStatus.approved,
                    });
                    prisma.libraryLoanRequest.delete.mockResolvedValue({ id: 'request-2' });
                    return [4 /*yield*/, service.deleteLoanRequest('request-2', 'student-1')];
                case 1:
                    result = _a.sent();
                    expect(prisma.libraryLoanRequest.delete).toHaveBeenCalledWith({ where: { id: 'request-2' } });
                    expect(prisma.libraryLoan.delete).not.toHaveBeenCalled();
                    expect(result).toEqual({ id: 'request-2', deleted: true });
                    return [2 /*return*/];
            }
        });
    }); });
    it('forbids deleting another user cancelled loan request', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.libraryLoanRequest.findUnique.mockResolvedValue({
                        id: 'request-1',
                        requesterId: 'student-2',
                        status: client_1.LibraryLoanRequestStatus.cancelled,
                    });
                    return [4 /*yield*/, expect(service.deleteLoanRequest('request-1', 'student-1')).rejects.toBeInstanceOf(common_1.ForbiddenException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects deleting non-cancelled loan request', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.libraryLoanRequest.findUnique.mockResolvedValue({
                        id: 'request-1',
                        requesterId: 'student-1',
                        status: client_1.LibraryLoanRequestStatus.pending,
                    });
                    return [4 /*yield*/, expect(service.deleteLoanRequest('request-1', 'student-1')).rejects.toBeInstanceOf(common_1.BadRequestException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('approves a pending loan request and creates a loan', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.libraryLoanRequest.findUnique.mockResolvedValue({
                        id: 'request-1',
                        requesterId: 'student-1',
                        copyId: 'copy-1',
                        bookId: 'book-1',
                        status: client_1.LibraryLoanRequestStatus.pending,
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
                            status: client_1.LibraryBookCopyStatus.available,
                        },
                        requester: {
                            id: 'student-1',
                            studentId: '22520001',
                            email: 'student@example.com',
                            firstName: 'An',
                            lastName: 'Nguyen',
                            role: client_1.Role.student,
                            isActive: true,
                        },
                        approvedBy: null,
                    });
                    prisma.libraryLoan.count.mockResolvedValue(0);
                    prisma.libraryLoan.create.mockResolvedValue({ id: 'loan-1' });
                    prisma.libraryBookCopy.update.mockResolvedValue({
                        id: 'copy-1',
                        status: client_1.LibraryBookCopyStatus.borrowed,
                    });
                    prisma.libraryLoanRequest.update.mockResolvedValue({
                        id: 'request-1',
                        status: client_1.LibraryLoanRequestStatus.approved,
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
                    return [4 /*yield*/, service.approveLoanRequest('request-1', 'admin-1')];
                case 1:
                    result = _a.sent();
                    expect(prisma.libraryLoan.create).toHaveBeenCalledWith(expect.objectContaining({
                        data: expect.objectContaining({
                            copyId: 'copy-1',
                            borrowerId: 'student-1',
                            borrowNote: 'Muon de hoc',
                        }),
                    }));
                    expect(prisma.libraryBookCopy.update).toHaveBeenCalledWith({
                        where: { id: 'copy-1' },
                        data: { status: client_1.LibraryBookCopyStatus.borrowed },
                    });
                    expect(result.status).toBe(client_1.LibraryLoanRequestStatus.approved);
                    return [2 /*return*/];
            }
        });
    }); });
    it('fails approval when copy is no longer available', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.libraryLoanRequest.findUnique.mockResolvedValue({
                        id: 'request-1',
                        requesterId: 'student-1',
                        copyId: 'copy-1',
                        bookId: 'book-1',
                        status: client_1.LibraryLoanRequestStatus.pending,
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
                            status: client_1.LibraryBookCopyStatus.borrowed,
                        },
                        requester: {
                            id: 'student-1',
                            studentId: '22520001',
                            email: 'student@example.com',
                            firstName: 'An',
                            lastName: 'Nguyen',
                            role: client_1.Role.student,
                            isActive: true,
                        },
                        approvedBy: null,
                    });
                    return [4 /*yield*/, expect(service.approveLoanRequest('request-1', 'admin-1')).rejects.toBeInstanceOf(common_1.BadRequestException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects renewal when loan is overdue', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.libraryLoan.findUnique.mockResolvedValue({
                        id: 'loan-1',
                        borrowerId: 'student-1',
                        status: client_1.LibraryLoanStatus.borrowed,
                        dueAt: new Date('2025-01-01T00:00:00.000Z'),
                        renewedCount: 0,
                        copy: { id: 'copy-1', status: 'borrowed' },
                    });
                    return [4 /*yield*/, expect(service.renewLoan('student-1', client_1.Role.student, 'loan-1')).rejects.toBeInstanceOf(common_1.BadRequestException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('forbids cancellation of reservation owned by another user', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.libraryReservation.findUnique.mockResolvedValue({
                        id: 'reservation-1',
                        requesterId: 'student-2',
                        status: 'active',
                    });
                    return [4 /*yield*/, expect(service.cancelReservation('student-1', 'reservation-1', false)).rejects.toBeInstanceOf(common_1.ForbiddenException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('deletes only returned loans', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.libraryLoan.findUnique.mockResolvedValue({
                        id: 'loan-1',
                        status: client_1.LibraryLoanStatus.returned,
                        borrowerId: 'student-1',
                    });
                    prisma.libraryLoan.delete.mockResolvedValue({ id: 'loan-1' });
                    return [4 /*yield*/, service.deleteReturnedLoan('loan-1', 'student-1', false)];
                case 1:
                    result = _a.sent();
                    expect(prisma.libraryLoan.delete).toHaveBeenCalledWith({ where: { id: 'loan-1' } });
                    expect(result).toEqual({ id: 'loan-1', deleted: true });
                    return [2 /*return*/];
            }
        });
    }); });
    it('forbids deleting a returned loan owned by another user', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.libraryLoan.findUnique.mockResolvedValue({
                        id: 'loan-1',
                        status: client_1.LibraryLoanStatus.returned,
                        borrowerId: 'student-2',
                    });
                    return [4 /*yield*/, expect(service.deleteReturnedLoan('loan-1', 'student-1', false)).rejects.toBeInstanceOf(common_1.ForbiddenException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects deleting non-returned loan', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.libraryLoan.findUnique.mockResolvedValue({
                        id: 'loan-1',
                        status: client_1.LibraryLoanStatus.borrowed,
                        borrowerId: 'student-1',
                    });
                    return [4 /*yield*/, expect(service.deleteReturnedLoan('loan-1', 'student-1', false)).rejects.toBeInstanceOf(common_1.BadRequestException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('creates library book with cover url', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.libraryBook.create.mockResolvedValue({
                        id: 'book-1',
                        coverUrl: 'https://img.test/book.jpg',
                    });
                    return [4 /*yield*/, service.createBook({
                            title: 'Clean Architecture',
                            authors: 'Robert C. Martin',
                            coverUrl: 'https://img.test/book.jpg',
                        })];
                case 1:
                    _a.sent();
                    expect(prisma.libraryBook.create).toHaveBeenCalledWith(expect.objectContaining({
                        data: expect.objectContaining({
                            title: 'Clean Architecture',
                            authors: 'Robert C. Martin',
                            coverUrl: 'https://img.test/book.jpg',
                        }),
                    }));
                    return [2 /*return*/];
            }
        });
    }); });
    it('uploads library cover through storage service', function () { return __awaiter(void 0, void 0, void 0, function () {
        var file, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    storageService.uploadLibraryBookCover.mockResolvedValue({
                        key: 'library-books/admin-1/book.jpg',
                        imageUrl: 'https://img.test/book.jpg',
                    });
                    file = {
                        buffer: Buffer.from('demo'),
                        mimetype: 'image/jpeg',
                        size: 4,
                        originalname: 'book.jpg',
                    };
                    return [4 /*yield*/, service.uploadBookCover('admin-1', file)];
                case 1:
                    result = _a.sent();
                    expect(storageService.uploadLibraryBookCover).toHaveBeenCalledWith('admin-1', file);
                    expect(result.imageUrl).toBe('https://img.test/book.jpg');
                    return [2 /*return*/];
            }
        });
    }); });
    it('deletes book when no related data exists', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.libraryBook.findUnique.mockResolvedValue({
                        id: 'book-1',
                        copies: [],
                        loanRequests: [],
                        reservations: [],
                    });
                    prisma.libraryBook.delete.mockResolvedValue({ id: 'book-1' });
                    return [4 /*yield*/, service.deleteBook('book-1')];
                case 1:
                    result = _a.sent();
                    expect(prisma.libraryBook.delete).toHaveBeenCalledWith({ where: { id: 'book-1' } });
                    expect(result).toEqual({ id: 'book-1', deleted: true });
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects deleting book with related data', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.libraryBook.findUnique.mockResolvedValue({
                        id: 'book-1',
                        copies: [{ id: 'copy-1' }],
                        loanRequests: [],
                        reservations: [],
                    });
                    return [4 /*yield*/, expect(service.deleteBook('book-1')).rejects.toBeInstanceOf(common_1.BadRequestException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('creates and updates library copy metadata', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.libraryBook.findUnique.mockResolvedValue({ id: 'book-1' });
                    prisma.libraryBookCopy.create.mockResolvedValue({
                        id: 'copy-1',
                        copyCode: 'LIB-001',
                        acquiredAt: new Date('2026-05-07'),
                    });
                    prisma.libraryBookCopy.findUnique.mockResolvedValue({ id: 'copy-1' });
                    prisma.libraryBookCopy.update.mockResolvedValue({ id: 'copy-1', copyCode: 'LIB-001-A' });
                    return [4 /*yield*/, service.addCopy('book-1', {
                            copyCode: 'LIB-001',
                            acquiredAt: '2026-5-7',
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, service.updateCopy('copy-1', {
                            copyCode: 'LIB-001-A',
                            acquiredAt: '2026-5-8',
                        })];
                case 2:
                    _a.sent();
                    expect(prisma.libraryBookCopy.create).toHaveBeenCalled();
                    expect(prisma.libraryBookCopy.update).toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('deletes copy when it has no loan history or requests', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.libraryBookCopy.findUnique.mockResolvedValue({
                        id: 'copy-1',
                        loans: [],
                        loanRequests: [],
                    });
                    prisma.libraryBookCopy.delete.mockResolvedValue({ id: 'copy-1' });
                    return [4 /*yield*/, service.deleteCopy('copy-1')];
                case 1:
                    result = _a.sent();
                    expect(prisma.libraryBookCopy.delete).toHaveBeenCalledWith({ where: { id: 'copy-1' } });
                    expect(result).toEqual({ id: 'copy-1', deleted: true });
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects deleting copy with related data', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.libraryBookCopy.findUnique.mockResolvedValue({
                        id: 'copy-1',
                        loans: [{ id: 'loan-1' }],
                        loanRequests: [],
                    });
                    return [4 /*yield*/, expect(service.deleteCopy('copy-1')).rejects.toBeInstanceOf(common_1.BadRequestException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
