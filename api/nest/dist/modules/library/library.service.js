"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibraryService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var STUDENT_MAX_BORROWED = 3;
var STUDENT_BORROW_DAYS = 14;
var STUDENT_MAX_RENEW = 1;
var LECTURER_MAX_BORROWED = 5;
var LECTURER_BORROW_DAYS = 30;
var LECTURER_MAX_RENEW = 2;
var RESERVATION_EXPIRES_HOURS = 48;
var ACTIVE_LOAN_STATUSES = [
    client_1.LibraryLoanStatus.borrowed,
    client_1.LibraryLoanStatus.overdue,
];
function normalizePaging(page, limit) {
    var safePage = Number.isInteger(page) && page && page > 0 ? page : 1;
    var safeLimit = Number.isInteger(limit) && limit && limit > 0 ? Math.min(limit, 50) : 20;
    return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}
function toISO(date) {
    return date ? date.toISOString() : null;
}
function getBorrowPolicy(role) {
    if (role === client_1.Role.lecturer) {
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
var LibraryService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var LibraryService = _classThis = /** @class */ (function () {
        function LibraryService_1(prisma, avatarStorageService) {
            this.prisma = prisma;
            this.avatarStorageService = avatarStorageService;
            this.loanRequestInclude = {
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
            };
        }
        LibraryService_1.prototype.listBooks = function (query) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, page, limit, skip, q, subject, where, _b, items, total;
                var _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            _a = normalizePaging(query.page, query.limit), page = _a.page, limit = _a.limit, skip = _a.skip;
                            q = (_c = query.q) === null || _c === void 0 ? void 0 : _c.trim();
                            subject = (_d = query.subject) === null || _d === void 0 ? void 0 : _d.trim();
                            where = __assign(__assign({ isActive: true }, (subject ? { subjects: { has: subject } } : {})), (q
                                ? {
                                    OR: [
                                        { title: { contains: q, mode: 'insensitive' } },
                                        { authors: { contains: q, mode: 'insensitive' } },
                                        { subjects: { hasSome: [q] } },
                                    ],
                                }
                                : {}));
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.libraryBook.findMany({
                                        where: where,
                                        include: {
                                            copies: {
                                                select: {
                                                    id: true,
                                                    status: true,
                                                },
                                            },
                                        },
                                        orderBy: [{ title: 'asc' }],
                                        skip: skip,
                                        take: limit,
                                    }),
                                    this.prisma.libraryBook.count({ where: where }),
                                ])];
                        case 1:
                            _b = _e.sent(), items = _b[0], total = _b[1];
                            return [2 /*return*/, {
                                    items: items.map(function (item) { return ({
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
                                        availableCopies: item.copies.filter(function (copy) { return copy.status === client_1.LibraryBookCopyStatus.available; }).length,
                                        totalCopies: item.copies.length,
                                    }); }),
                                    page: page,
                                    limit: limit,
                                    total: total,
                                    totalPages: Math.max(1, Math.ceil(total / limit)),
                                }];
                    }
                });
            });
        };
        LibraryService_1.prototype.getBook = function (bookId) {
            return __awaiter(this, void 0, void 0, function () {
                var book;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryBook.findUnique({
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
                            })];
                        case 1:
                            book = _a.sent();
                            if (!book || !book.isActive) {
                                throw new common_1.NotFoundException('Khong tim thay sach');
                            }
                            return [2 /*return*/, __assign(__assign({}, book), { availableCopies: book.copies.filter(function (copy) { return copy.status === client_1.LibraryBookCopyStatus.available; })
                                        .length })];
                    }
                });
            });
        };
        LibraryService_1.prototype.createBook = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
                return __generator(this, function (_m) {
                    return [2 /*return*/, this.prisma.libraryBook.create({
                            data: {
                                title: dto.title.trim(),
                                subtitle: ((_a = dto.subtitle) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                                authors: dto.authors.trim(),
                                openLibraryId: ((_b = dto.openLibraryId) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                                isbn13: ((_c = dto.isbn13) === null || _c === void 0 ? void 0 : _c.trim()) || null,
                                subjects: ((_d = dto.subjects) !== null && _d !== void 0 ? _d : []).map(function (item) { return item.trim(); }).filter(Boolean),
                                publisher: ((_e = dto.publisher) === null || _e === void 0 ? void 0 : _e.trim()) || null,
                                publishedAt: ((_f = dto.publishedAt) === null || _f === void 0 ? void 0 : _f.trim()) || null,
                                language: ((_g = dto.language) === null || _g === void 0 ? void 0 : _g.trim()) || null,
                                coverUrl: ((_h = dto.coverUrl) === null || _h === void 0 ? void 0 : _h.trim()) || null,
                                description: ((_j = dto.description) === null || _j === void 0 ? void 0 : _j.trim()) || null,
                                shelfCode: ((_k = dto.shelfCode) === null || _k === void 0 ? void 0 : _k.trim()) || null,
                                isActive: (_l = dto.isActive) !== null && _l !== void 0 ? _l : true,
                            },
                        })];
                });
            });
        };
        LibraryService_1.prototype.updateBook = function (bookId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                return __generator(this, function (_k) {
                    switch (_k.label) {
                        case 0: return [4 /*yield*/, this.assertBookExists(bookId)];
                        case 1:
                            _k.sent();
                            return [2 /*return*/, this.prisma.libraryBook.update({
                                    where: { id: bookId },
                                    data: __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({}, (dto.title !== undefined ? { title: dto.title.trim() } : {})), (dto.subtitle !== undefined ? { subtitle: ((_a = dto.subtitle) === null || _a === void 0 ? void 0 : _a.trim()) || null } : {})), (dto.authors !== undefined ? { authors: dto.authors.trim() } : {})), (dto.openLibraryId !== undefined
                                        ? { openLibraryId: ((_b = dto.openLibraryId) === null || _b === void 0 ? void 0 : _b.trim()) || null }
                                        : {})), (dto.isbn13 !== undefined ? { isbn13: ((_c = dto.isbn13) === null || _c === void 0 ? void 0 : _c.trim()) || null } : {})), (dto.subjects !== undefined
                                        ? { subjects: dto.subjects.map(function (item) { return item.trim(); }).filter(Boolean) }
                                        : {})), (dto.publisher !== undefined ? { publisher: ((_d = dto.publisher) === null || _d === void 0 ? void 0 : _d.trim()) || null } : {})), (dto.publishedAt !== undefined ? { publishedAt: ((_e = dto.publishedAt) === null || _e === void 0 ? void 0 : _e.trim()) || null } : {})), (dto.language !== undefined ? { language: ((_f = dto.language) === null || _f === void 0 ? void 0 : _f.trim()) || null } : {})), (dto.coverUrl !== undefined ? { coverUrl: ((_g = dto.coverUrl) === null || _g === void 0 ? void 0 : _g.trim()) || null } : {})), (dto.description !== undefined ? { description: ((_h = dto.description) === null || _h === void 0 ? void 0 : _h.trim()) || null } : {})), (dto.shelfCode !== undefined ? { shelfCode: ((_j = dto.shelfCode) === null || _j === void 0 ? void 0 : _j.trim()) || null } : {})), (dto.isActive !== undefined ? { isActive: dto.isActive } : {})),
                                })];
                    }
                });
            });
        };
        LibraryService_1.prototype.addCopy = function (bookId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.assertBookExists(bookId)];
                        case 1:
                            _b.sent();
                            return [2 /*return*/, this.prisma.libraryBookCopy.create({
                                    data: {
                                        bookId: bookId,
                                        copyCode: dto.copyCode.trim(),
                                        conditionNote: ((_a = dto.conditionNote) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                                        acquiredAt: dto.acquiredAt
                                            ? this.parseOptionalDate(dto.acquiredAt, 'Ngay nhap ban sao khong hop le')
                                            : null,
                                    },
                                })];
                    }
                });
            });
        };
        LibraryService_1.prototype.listAdminBooks = function () {
            return __awaiter(this, void 0, void 0, function () {
                var books;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryBook.findMany({
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
                            })];
                        case 1:
                            books = _a.sent();
                            return [2 /*return*/, books.map(function (book) { return ({
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
                                    availableCopies: book.copies.filter(function (copy) { return copy.status === client_1.LibraryBookCopyStatus.available; })
                                        .length,
                                    copies: book.copies.map(function (copy) { return ({
                                        id: copy.id,
                                        copyCode: copy.copyCode,
                                        status: copy.status,
                                        conditionNote: copy.conditionNote,
                                        acquiredAt: toISO(copy.acquiredAt),
                                        updatedAt: copy.updatedAt.toISOString(),
                                    }); }),
                                }); })];
                    }
                });
            });
        };
        LibraryService_1.prototype.uploadBookCover = function (actorId, file) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.avatarStorageService.uploadLibraryBookCover(actorId, file)];
                });
            });
        };
        LibraryService_1.prototype.deleteBook = function (bookId) {
            return __awaiter(this, void 0, void 0, function () {
                var book;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryBook.findUnique({
                                where: { id: bookId },
                                select: {
                                    id: true,
                                    copies: { select: { id: true }, take: 1 },
                                    loanRequests: { select: { id: true }, take: 1 },
                                    reservations: { select: { id: true }, take: 1 },
                                },
                            })];
                        case 1:
                            book = _a.sent();
                            if (!book) {
                                throw new common_1.NotFoundException('Khong tim thay sach');
                            }
                            if (book.copies.length > 0 || book.loanRequests.length > 0 || book.reservations.length > 0) {
                                throw new common_1.BadRequestException('Sach da phat sinh du lieu lien quan nen khong the xoa');
                            }
                            return [4 /*yield*/, this.prisma.libraryBook.delete({
                                    where: { id: bookId },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { id: bookId, deleted: true }];
                    }
                });
            });
        };
        LibraryService_1.prototype.updateCopy = function (copyId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.assertCopyExists(copyId)];
                        case 1:
                            _b.sent();
                            return [2 /*return*/, this.prisma.libraryBookCopy.update({
                                    where: { id: copyId },
                                    data: __assign(__assign(__assign({}, (dto.copyCode !== undefined ? { copyCode: dto.copyCode.trim() } : {})), (dto.conditionNote !== undefined
                                        ? { conditionNote: ((_a = dto.conditionNote) === null || _a === void 0 ? void 0 : _a.trim()) || null }
                                        : {})), (dto.acquiredAt !== undefined
                                        ? {
                                            acquiredAt: dto.acquiredAt
                                                ? this.parseOptionalDate(dto.acquiredAt, 'Ngay nhap ban sao khong hop le')
                                                : null,
                                        }
                                        : {})),
                                })];
                    }
                });
            });
        };
        LibraryService_1.prototype.deleteCopy = function (copyId) {
            return __awaiter(this, void 0, void 0, function () {
                var copy;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryBookCopy.findUnique({
                                where: { id: copyId },
                                select: {
                                    id: true,
                                    loans: { select: { id: true }, take: 1 },
                                    loanRequests: { select: { id: true }, take: 1 },
                                },
                            })];
                        case 1:
                            copy = _a.sent();
                            if (!copy) {
                                throw new common_1.NotFoundException('Khong tim thay ban sao sach');
                            }
                            if (copy.loans.length > 0 || copy.loanRequests.length > 0) {
                                throw new common_1.BadRequestException('Ban sao da phat sinh du lieu lien quan nen khong the xoa');
                            }
                            return [4 /*yield*/, this.prisma.libraryBookCopy.delete({
                                    where: { id: copyId },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { id: copyId, deleted: true }];
                    }
                });
            });
        };
        LibraryService_1.prototype.createLoanRequest = function (userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var borrower, copy, existing, createdRequest;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getEligibleBorrower(userId)];
                        case 1:
                            borrower = _b.sent();
                            return [4 /*yield*/, this.assertBorrowCapacity(borrower.id, borrower.role)];
                        case 2:
                            _b.sent();
                            return [4 /*yield*/, this.prisma.libraryBookCopy.findUnique({
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
                                })];
                        case 3:
                            copy = _b.sent();
                            if (!copy || copy.bookId !== dto.bookId) {
                                throw new common_1.BadRequestException('Ban sao sach khong thuoc dau sach da chon');
                            }
                            if (!copy.book.isActive) {
                                throw new common_1.NotFoundException('Khong tim thay sach');
                            }
                            if (copy.status !== client_1.LibraryBookCopyStatus.available) {
                                throw new common_1.BadRequestException('Ban sao sach hien khong o trang thai san sang');
                            }
                            return [4 /*yield*/, this.prisma.libraryLoanRequest.findFirst({
                                    where: {
                                        requesterId: borrower.id,
                                        copyId: copy.id,
                                        status: client_1.LibraryLoanRequestStatus.pending,
                                    },
                                    select: { id: true },
                                })];
                        case 4:
                            existing = _b.sent();
                            if (existing) {
                                throw new common_1.BadRequestException('Ban da co don muon dang cho duyet cho ban sao nay');
                            }
                            return [4 /*yield*/, this.prisma.libraryLoanRequest.create({
                                    data: {
                                        bookId: copy.bookId,
                                        copyId: copy.id,
                                        requesterId: borrower.id,
                                        note: ((_a = dto.note) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                                    },
                                    include: this.loanRequestInclude,
                                })];
                        case 5:
                            createdRequest = _b.sent();
                            return [2 /*return*/, this.mapLoanRequest(createdRequest)];
                    }
                });
            });
        };
        LibraryService_1.prototype.listMyLoanRequests = function (userId, status) {
            return __awaiter(this, void 0, void 0, function () {
                var items;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryLoanRequest.findMany({
                                where: __assign({ requesterId: userId }, (status ? { status: status } : {})),
                                include: this.loanRequestInclude,
                                orderBy: [{ createdAt: 'desc' }],
                            })];
                        case 1:
                            items = _a.sent();
                            return [2 /*return*/, items.map(function (item) { return _this.mapLoanRequest(item); })];
                    }
                });
            });
        };
        LibraryService_1.prototype.getLoanRequest = function (requestId, userId, isAdmin) {
            return __awaiter(this, void 0, void 0, function () {
                var request;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryLoanRequest.findUnique({
                                where: { id: requestId },
                                include: this.loanRequestInclude,
                            })];
                        case 1:
                            request = _a.sent();
                            if (!request) {
                                throw new common_1.NotFoundException('Khong tim thay don muon');
                            }
                            if (!isAdmin && request.requesterId !== userId) {
                                throw new common_1.ForbiddenException('Ban khong co quyen xem don muon nay');
                            }
                            return [2 /*return*/, this.mapLoanRequest(request)];
                    }
                });
            });
        };
        LibraryService_1.prototype.cancelLoanRequest = function (requestId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var request, updatedRequest;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryLoanRequest.findUnique({
                                where: { id: requestId },
                                include: this.loanRequestInclude,
                            })];
                        case 1:
                            request = _a.sent();
                            if (!request) {
                                throw new common_1.NotFoundException('Khong tim thay don muon');
                            }
                            if (request.requesterId !== userId) {
                                throw new common_1.ForbiddenException('Ban khong co quyen huy don muon nay');
                            }
                            if (request.status !== client_1.LibraryLoanRequestStatus.pending) {
                                throw new common_1.BadRequestException('Chi co the huy don muon dang cho duyet');
                            }
                            return [4 /*yield*/, this.prisma.libraryLoanRequest.update({
                                    where: { id: request.id },
                                    data: {
                                        status: client_1.LibraryLoanRequestStatus.cancelled,
                                    },
                                    include: this.loanRequestInclude,
                                })];
                        case 2:
                            updatedRequest = _a.sent();
                            return [2 /*return*/, this.mapLoanRequest(updatedRequest)];
                    }
                });
            });
        };
        LibraryService_1.prototype.deleteLoanRequest = function (requestId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var request;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryLoanRequest.findUnique({
                                where: { id: requestId },
                                select: {
                                    id: true,
                                    requesterId: true,
                                    status: true,
                                },
                            })];
                        case 1:
                            request = _a.sent();
                            if (!request) {
                                throw new common_1.NotFoundException('Khong tim thay don muon');
                            }
                            if (request.requesterId !== userId) {
                                throw new common_1.ForbiddenException('Ban khong co quyen xoa don muon nay');
                            }
                            if (request.status !== client_1.LibraryLoanRequestStatus.cancelled &&
                                request.status !== client_1.LibraryLoanRequestStatus.rejected &&
                                request.status !== client_1.LibraryLoanRequestStatus.approved) {
                                throw new common_1.BadRequestException('Chi co the xoa don muon da duoc xu ly hoac da huy');
                            }
                            return [4 /*yield*/, this.prisma.libraryLoanRequest.delete({
                                    where: { id: request.id },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { id: request.id, deleted: true }];
                    }
                });
            });
        };
        LibraryService_1.prototype.listAdminLoanRequests = function (status) {
            return __awaiter(this, void 0, void 0, function () {
                var items;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryLoanRequest.findMany({
                                where: status ? { status: status } : {},
                                include: this.loanRequestInclude,
                                orderBy: [{ createdAt: 'desc' }],
                            })];
                        case 1:
                            items = _a.sent();
                            return [2 /*return*/, items.map(function (item) { return _this.mapLoanRequest(item); })];
                    }
                });
            });
        };
        LibraryService_1.prototype.approveLoanRequest = function (requestId, approverId) {
            return __awaiter(this, void 0, void 0, function () {
                var now, updatedRequest;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            now = new Date();
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var request, dueAt;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, tx.libraryLoanRequest.findUnique({
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
                                                })];
                                            case 1:
                                                request = _a.sent();
                                                if (!request) {
                                                    throw new common_1.NotFoundException('Khong tim thay don muon');
                                                }
                                                if (request.status !== client_1.LibraryLoanRequestStatus.pending) {
                                                    throw new common_1.BadRequestException('Chi co the duyet don dang cho');
                                                }
                                                if (!request.requester.isActive) {
                                                    throw new common_1.NotFoundException('Khong tim thay nguoi muon');
                                                }
                                                if (!request.book.isActive || request.copy.bookId !== request.bookId) {
                                                    throw new common_1.BadRequestException('Du lieu don muon khong hop le');
                                                }
                                                if (request.copy.status !== client_1.LibraryBookCopyStatus.available) {
                                                    throw new common_1.BadRequestException('Ban sao sach hien khong o trang thai san sang');
                                                }
                                                return [4 /*yield*/, this.assertBorrowCapacity(request.requester.id, request.requester.role, tx)];
                                            case 2:
                                                _a.sent();
                                                dueAt = new Date(now);
                                                dueAt.setDate(dueAt.getDate() + getBorrowPolicy(request.requester.role).borrowDays);
                                                return [4 /*yield*/, tx.libraryLoan.create({
                                                        data: {
                                                            copyId: request.copyId,
                                                            borrowerId: request.requesterId,
                                                            dueAt: dueAt,
                                                            borrowNote: request.note,
                                                        },
                                                    })];
                                            case 3:
                                                _a.sent();
                                                return [4 /*yield*/, tx.libraryBookCopy.update({
                                                        where: { id: request.copyId },
                                                        data: { status: client_1.LibraryBookCopyStatus.borrowed },
                                                    })];
                                            case 4:
                                                _a.sent();
                                                return [2 /*return*/, tx.libraryLoanRequest.update({
                                                        where: { id: request.id },
                                                        data: {
                                                            status: client_1.LibraryLoanRequestStatus.approved,
                                                            approvedById: approverId,
                                                            approvedAt: now,
                                                        },
                                                        include: this.loanRequestInclude,
                                                    })];
                                        }
                                    });
                                }); })];
                        case 1:
                            updatedRequest = _a.sent();
                            return [2 /*return*/, this.mapLoanRequest(updatedRequest)];
                    }
                });
            });
        };
        LibraryService_1.prototype.rejectLoanRequest = function (requestId, approverId) {
            return __awaiter(this, void 0, void 0, function () {
                var request, updatedRequest;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryLoanRequest.findUnique({
                                where: { id: requestId },
                                select: { id: true, status: true },
                            })];
                        case 1:
                            request = _a.sent();
                            if (!request) {
                                throw new common_1.NotFoundException('Khong tim thay don muon');
                            }
                            if (request.status !== client_1.LibraryLoanRequestStatus.pending) {
                                throw new common_1.BadRequestException('Chi co the tu choi don dang cho');
                            }
                            return [4 /*yield*/, this.prisma.libraryLoanRequest.update({
                                    where: { id: request.id },
                                    data: {
                                        status: client_1.LibraryLoanRequestStatus.rejected,
                                        approvedById: approverId,
                                        approvedAt: new Date(),
                                    },
                                    include: this.loanRequestInclude,
                                })];
                        case 2:
                            updatedRequest = _a.sent();
                            return [2 /*return*/, this.mapLoanRequest(updatedRequest)];
                    }
                });
            });
        };
        LibraryService_1.prototype.markCopyStatus = function (copyId, status, conditionNote) {
            return __awaiter(this, void 0, void 0, function () {
                var copy;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryBookCopy.findUnique({
                                where: { id: copyId },
                                select: { id: true },
                            })];
                        case 1:
                            copy = _a.sent();
                            if (!copy) {
                                throw new common_1.NotFoundException('Khong tim thay ban sao sach');
                            }
                            return [2 /*return*/, this.prisma.libraryBookCopy.update({
                                    where: { id: copyId },
                                    data: {
                                        status: status,
                                        conditionNote: (conditionNote === null || conditionNote === void 0 ? void 0 : conditionNote.trim()) || null,
                                    },
                                })];
                    }
                });
            });
        };
        LibraryService_1.prototype.checkout = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var borrower, copy, _a, selectedCopy, _b, dueAt;
                var _this = this;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getEligibleBorrower(dto.borrowerId)];
                        case 1:
                            borrower = _c.sent();
                            return [4 /*yield*/, this.assertBorrowCapacity(borrower.id, borrower.role)];
                        case 2:
                            _c.sent();
                            if (!dto.copyId) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.prisma.libraryBookCopy.findUnique({
                                    where: { id: dto.copyId },
                                    include: { book: true },
                                })];
                        case 3:
                            _a = _c.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            _a = null;
                            _c.label = 5;
                        case 5:
                            copy = _a;
                            if (!(copy !== null && copy !== void 0)) return [3 /*break*/, 6];
                            _b = copy;
                            return [3 /*break*/, 8];
                        case 6: return [4 /*yield*/, this.prisma.libraryBookCopy.findFirst({
                                where: {
                                    status: client_1.LibraryBookCopyStatus.available,
                                    book: { isActive: true },
                                },
                                include: { book: true },
                                orderBy: [{ copyCode: 'asc' }],
                            })];
                        case 7:
                            _b = (_c.sent());
                            _c.label = 8;
                        case 8:
                            selectedCopy = _b;
                            if (!selectedCopy || !selectedCopy.book.isActive) {
                                throw new common_1.NotFoundException('Khong tim thay ban sao sach co the muon');
                            }
                            if (selectedCopy.status !== client_1.LibraryBookCopyStatus.available) {
                                throw new common_1.BadRequestException('Ban sao sach hien khong o trang thai san sang');
                            }
                            dueAt = new Date();
                            dueAt.setDate(dueAt.getDate() + getBorrowPolicy(borrower.role).borrowDays);
                            return [2 /*return*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var loan;
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0: return [4 /*yield*/, tx.libraryLoan.create({
                                                    data: {
                                                        copyId: selectedCopy.id,
                                                        borrowerId: borrower.id,
                                                        dueAt: dueAt,
                                                        borrowNote: ((_a = dto.note) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                                                    },
                                                })];
                                            case 1:
                                                loan = _b.sent();
                                                return [4 /*yield*/, tx.libraryBookCopy.update({
                                                        where: { id: selectedCopy.id },
                                                        data: { status: client_1.LibraryBookCopyStatus.borrowed },
                                                    })];
                                            case 2:
                                                _b.sent();
                                                return [4 /*yield*/, tx.libraryReservation.updateMany({
                                                        where: {
                                                            bookId: selectedCopy.bookId,
                                                            requesterId: borrower.id,
                                                            status: 'active',
                                                        },
                                                        data: {
                                                            status: 'fulfilled',
                                                            fulfilledAt: new Date(),
                                                        },
                                                    })];
                                            case 3:
                                                _b.sent();
                                                return [2 /*return*/, loan];
                                        }
                                    });
                                }); })];
                    }
                });
            });
        };
        LibraryService_1.prototype.checkin = function (loanId, note) {
            return __awaiter(this, void 0, void 0, function () {
                var loan;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryLoan.findUnique({
                                where: { id: loanId },
                                include: {
                                    copy: {
                                        select: {
                                            id: true,
                                            status: true,
                                        },
                                    },
                                },
                            })];
                        case 1:
                            loan = _a.sent();
                            if (!loan) {
                                throw new common_1.NotFoundException('Khong tim thay phieu muon');
                            }
                            if (loan.status === client_1.LibraryLoanStatus.returned) {
                                return [2 /*return*/, loan];
                            }
                            return [2 /*return*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var updatedLoan;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, tx.libraryLoan.update({
                                                    where: { id: loan.id },
                                                    data: {
                                                        status: client_1.LibraryLoanStatus.returned,
                                                        returnedAt: new Date(),
                                                        returnNote: (note === null || note === void 0 ? void 0 : note.trim()) || null,
                                                    },
                                                })];
                                            case 1:
                                                updatedLoan = _a.sent();
                                                return [4 /*yield*/, tx.libraryBookCopy.update({
                                                        where: { id: loan.copyId },
                                                        data: { status: client_1.LibraryBookCopyStatus.available },
                                                    })];
                                            case 2:
                                                _a.sent();
                                                return [2 /*return*/, updatedLoan];
                                        }
                                    });
                                }); })];
                    }
                });
            });
        };
        LibraryService_1.prototype.listAdminLoans = function () {
            return __awaiter(this, void 0, void 0, function () {
                var loans, now;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryLoan.findMany({
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
                            })];
                        case 1:
                            loans = _a.sent();
                            now = new Date();
                            return [2 /*return*/, loans.map(function (loan) { return ({
                                    id: loan.id,
                                    status: loan.status !== client_1.LibraryLoanStatus.returned && loan.dueAt < now
                                        ? client_1.LibraryLoanStatus.overdue
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
                                        fullName: "".concat(loan.borrower.firstName, " ").concat(loan.borrower.lastName).trim(),
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
                                }); })];
                    }
                });
            });
        };
        LibraryService_1.prototype.deleteReturnedLoan = function (loanId_1, userId_1) {
            return __awaiter(this, arguments, void 0, function (loanId, userId, isAdmin) {
                var loan;
                if (isAdmin === void 0) { isAdmin = false; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryLoan.findUnique({
                                where: { id: loanId },
                                select: { id: true, status: true, borrowerId: true },
                            })];
                        case 1:
                            loan = _a.sent();
                            if (!loan) {
                                throw new common_1.NotFoundException('Khong tim thay phieu muon');
                            }
                            if (!isAdmin && loan.borrowerId !== userId) {
                                throw new common_1.ForbiddenException('Ban khong co quyen xoa phieu muon nay');
                            }
                            if (loan.status !== client_1.LibraryLoanStatus.returned) {
                                throw new common_1.BadRequestException('Chi co the xoa phieu muon da tra');
                            }
                            return [4 /*yield*/, this.prisma.libraryLoan.delete({
                                    where: { id: loan.id },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { id: loan.id, deleted: true }];
                    }
                });
            });
        };
        LibraryService_1.prototype.listMyLoans = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var loans, now;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryLoan.findMany({
                                where: { borrowerId: userId },
                                include: {
                                    copy: {
                                        include: {
                                            book: true,
                                        },
                                    },
                                },
                                orderBy: [{ borrowedAt: 'desc' }],
                            })];
                        case 1:
                            loans = _a.sent();
                            now = new Date();
                            return [2 /*return*/, loans.map(function (loan) { return ({
                                    id: loan.id,
                                    status: loan.status !== client_1.LibraryLoanStatus.returned && loan.dueAt < now
                                        ? client_1.LibraryLoanStatus.overdue
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
                                }); })];
                    }
                });
            });
        };
        LibraryService_1.prototype.renewLoan = function (userId, role, loanId) {
            return __awaiter(this, void 0, void 0, function () {
                var loan, policy, nextDueAt;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryLoan.findUnique({
                                where: { id: loanId },
                                include: {
                                    copy: {
                                        select: {
                                            id: true,
                                            status: true,
                                        },
                                    },
                                },
                            })];
                        case 1:
                            loan = _a.sent();
                            if (!loan) {
                                throw new common_1.NotFoundException('Khong tim thay phieu muon');
                            }
                            if (loan.borrowerId !== userId) {
                                throw new common_1.ForbiddenException('Ban khong co quyen gia han phieu muon nay');
                            }
                            if (loan.status === client_1.LibraryLoanStatus.returned) {
                                throw new common_1.BadRequestException('Phieu muon da tra khong the gia han');
                            }
                            if (loan.dueAt < new Date()) {
                                throw new common_1.BadRequestException('Phieu muon da qua han nen khong the gia han');
                            }
                            policy = getBorrowPolicy(role);
                            if (loan.renewedCount >= policy.maxRenew) {
                                throw new common_1.BadRequestException('Da het so lan gia han cho phep');
                            }
                            nextDueAt = new Date(loan.dueAt);
                            nextDueAt.setDate(nextDueAt.getDate() + policy.borrowDays);
                            return [2 /*return*/, this.prisma.libraryLoan.update({
                                    where: { id: loan.id },
                                    data: {
                                        dueAt: nextDueAt,
                                        renewedCount: {
                                            increment: 1,
                                        },
                                    },
                                })];
                    }
                });
            });
        };
        LibraryService_1.prototype.listMyReservations = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var reservations;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryReservation.findMany({
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
                            })];
                        case 1:
                            reservations = _a.sent();
                            return [2 /*return*/, reservations.map(function (item) { return ({
                                    id: item.id,
                                    status: item.status,
                                    note: item.note,
                                    createdAt: item.createdAt.toISOString(),
                                    expiresAt: item.expiresAt.toISOString(),
                                    fulfilledAt: toISO(item.fulfilledAt),
                                    cancelledAt: toISO(item.cancelledAt),
                                    book: item.book,
                                }); })];
                    }
                });
            });
        };
        LibraryService_1.prototype.createReservation = function (userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var book, existing, expiresAt;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryBook.findUnique({
                                where: { id: dto.bookId },
                                select: { id: true, isActive: true },
                            })];
                        case 1:
                            book = _b.sent();
                            if (!book || !book.isActive) {
                                throw new common_1.NotFoundException('Khong tim thay sach');
                            }
                            return [4 /*yield*/, this.prisma.libraryReservation.findFirst({
                                    where: {
                                        requesterId: userId,
                                        bookId: book.id,
                                        status: 'active',
                                    },
                                    select: { id: true },
                                })];
                        case 2:
                            existing = _b.sent();
                            if (existing) {
                                throw new common_1.BadRequestException('Ban da co yeu cau giu cho con hieu luc cho sach nay');
                            }
                            expiresAt = new Date();
                            expiresAt.setHours(expiresAt.getHours() + RESERVATION_EXPIRES_HOURS);
                            return [2 /*return*/, this.prisma.libraryReservation.create({
                                    data: {
                                        requesterId: userId,
                                        bookId: book.id,
                                        note: ((_a = dto.note) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                                        expiresAt: expiresAt,
                                    },
                                })];
                    }
                });
            });
        };
        LibraryService_1.prototype.cancelReservation = function (userId, reservationId, isAdmin) {
            return __awaiter(this, void 0, void 0, function () {
                var reservation;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryReservation.findUnique({
                                where: { id: reservationId },
                                select: {
                                    id: true,
                                    requesterId: true,
                                    status: true,
                                },
                            })];
                        case 1:
                            reservation = _a.sent();
                            if (!reservation) {
                                throw new common_1.NotFoundException('Khong tim thay yeu cau giu cho');
                            }
                            if (!isAdmin && reservation.requesterId !== userId) {
                                throw new common_1.ForbiddenException('Ban khong co quyen huy yeu cau nay');
                            }
                            if (reservation.status !== 'active') {
                                return [2 /*return*/, reservation];
                            }
                            return [2 /*return*/, this.prisma.libraryReservation.update({
                                    where: { id: reservation.id },
                                    data: {
                                        status: 'cancelled',
                                        cancelledAt: new Date(),
                                    },
                                })];
                    }
                });
            });
        };
        LibraryService_1.prototype.assertBookExists = function (bookId) {
            return __awaiter(this, void 0, void 0, function () {
                var book;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryBook.findUnique({
                                where: { id: bookId },
                                select: { id: true },
                            })];
                        case 1:
                            book = _a.sent();
                            if (!book) {
                                throw new common_1.NotFoundException('Khong tim thay sach');
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        LibraryService_1.prototype.assertCopyExists = function (copyId) {
            return __awaiter(this, void 0, void 0, function () {
                var copy;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.libraryBookCopy.findUnique({
                                where: { id: copyId },
                                select: { id: true },
                            })];
                        case 1:
                            copy = _a.sent();
                            if (!copy) {
                                throw new common_1.NotFoundException('Khong tim thay ban sao sach');
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        LibraryService_1.prototype.parseOptionalDate = function (value, message) {
            var trimmed = value.trim();
            var dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
            if (dateOnlyMatch) {
                var year = Number(dateOnlyMatch[1]);
                var month = Number(dateOnlyMatch[2]);
                var day = Number(dateOnlyMatch[3]);
                var parsedDateOnly = new Date(Date.UTC(year, month - 1, day));
                if (parsedDateOnly.getUTCFullYear() !== year ||
                    parsedDateOnly.getUTCMonth() !== month - 1 ||
                    parsedDateOnly.getUTCDate() !== day) {
                    throw new common_1.BadRequestException(message);
                }
                return parsedDateOnly;
            }
            var parsed = new Date(trimmed);
            if (Number.isNaN(parsed.getTime())) {
                throw new common_1.BadRequestException(message);
            }
            return parsed;
        };
        LibraryService_1.prototype.getEligibleBorrower = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var borrower;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.user.findUnique({
                                where: { id: userId },
                                select: { id: true, role: true, isActive: true },
                            })];
                        case 1:
                            borrower = _a.sent();
                            if (!borrower || !borrower.isActive) {
                                throw new common_1.NotFoundException('Khong tim thay nguoi muon');
                            }
                            if (borrower.role !== client_1.Role.student && borrower.role !== client_1.Role.lecturer) {
                                throw new common_1.BadRequestException('Chi sinh vien hoac giang vien duoc muon sach');
                            }
                            return [2 /*return*/, borrower];
                    }
                });
            });
        };
        LibraryService_1.prototype.assertBorrowCapacity = function (borrowerId_1, role_1) {
            return __awaiter(this, arguments, void 0, function (borrowerId, role, prismaClient) {
                var policy, activeLoanCount;
                if (prismaClient === void 0) { prismaClient = this.prisma; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            policy = getBorrowPolicy(role);
                            return [4 /*yield*/, prismaClient.libraryLoan.count({
                                    where: {
                                        borrowerId: borrowerId,
                                        status: {
                                            in: ACTIVE_LOAN_STATUSES,
                                        },
                                    },
                                })];
                        case 1:
                            activeLoanCount = _a.sent();
                            if (activeLoanCount >= policy.maxBorrowed) {
                                throw new common_1.BadRequestException('Da vuot qua so luong sach co the muon');
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        LibraryService_1.prototype.mapLoanRequest = function (request) {
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
        };
        LibraryService_1.prototype.buildFullName = function (firstName, lastName) {
            return "".concat(firstName !== null && firstName !== void 0 ? firstName : '', " ").concat(lastName !== null && lastName !== void 0 ? lastName : '').trim();
        };
        return LibraryService_1;
    }());
    __setFunctionName(_classThis, "LibraryService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        LibraryService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return LibraryService = _classThis;
}();
exports.LibraryService = LibraryService;
