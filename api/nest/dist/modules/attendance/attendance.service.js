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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
var node_crypto_1 = require("node:crypto");
var exceljs_1 = require("exceljs");
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var shared_1 = require("@smart-campus/shared");
var redis_1 = require("redis");
function formatFullName(firstName, lastName) {
    return [lastName, firstName].filter(Boolean).join(' ').trim();
}
function formatExportDateTime(value) {
    if (!value) {
        return '';
    }
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(value);
}
function sanitizeFileName(value) {
    return value.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_');
}
var AttendanceService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AttendanceService = _classThis = /** @class */ (function () {
        function AttendanceService_1(prisma, configService) {
            this.prisma = prisma;
            this.configService = configService;
            this.qrRefreshSeconds = 30;
            this.checkinRateLimitSeconds = 2;
            this.memoryStore = new Map();
            this.redisEnabled = false;
            this.tokenTtlSeconds = Number(this.configService.get('ATTENDANCE_TOKEN_TTL_SECONDS', 90));
            var redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
            var isTestEnvironment = process.env.NODE_ENV === 'test';
            this.redisClient = (0, redis_1.createClient)(__assign({ url: redisUrl }, (isTestEnvironment
                ? {
                    socket: {
                        connectTimeout: 1000,
                        reconnectStrategy: false,
                    },
                }
                : {})));
        }
        AttendanceService_1.prototype.onModuleInit = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 3, , 4]);
                            if (!!this.redisClient.isOpen) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.redisClient.connect()];
                        case 1:
                            _b.sent();
                            _b.label = 2;
                        case 2:
                            this.redisEnabled = this.redisClient.isOpen;
                            return [3 /*break*/, 4];
                        case 3:
                            _a = _b.sent();
                            this.redisEnabled = false;
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        AttendanceService_1.prototype.onModuleDestroy = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 3, , 4]);
                            if (!this.redisClient.isOpen) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.redisClient.close()];
                        case 1:
                            _b.sent();
                            _b.label = 2;
                        case 2: return [3 /*break*/, 4];
                        case 3:
                            _a = _b.sent();
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        AttendanceService_1.prototype.startSession = function (actorId, actorRole, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var classSection, sessionLecturerId, existingActiveSession, startedAt, durationMinutes, expiresAt, session, displayKey, displayTtlSeconds, appBaseUrl, base;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            this.assertCanManageAttendance(actorRole);
                            return [4 /*yield*/, this.prisma.classSection.findUnique({
                                    where: { id: dto.classSectionId },
                                    select: { id: true, lecturerId: true },
                                })];
                        case 1:
                            classSection = _b.sent();
                            if (!classSection) {
                                throw new common_1.NotFoundException('Class section not found');
                            }
                            if (!this.canManageAllAttendance(actorRole) &&
                                (!classSection.lecturerId || classSection.lecturerId !== actorId)) {
                                throw new common_1.ForbiddenException('You are not assigned to this class section');
                            }
                            sessionLecturerId = this.canManageAllAttendance(actorRole) && classSection.lecturerId
                                ? classSection.lecturerId
                                : actorId;
                            return [4 /*yield*/, this.prisma.attendanceSession.findFirst({
                                    where: {
                                        classSectionId: dto.classSectionId,
                                        status: client_1.AttendanceSessionStatus.active,
                                        expiresAt: { gt: new Date() },
                                    },
                                    select: { id: true },
                                })];
                        case 2:
                            existingActiveSession = _b.sent();
                            if (existingActiveSession) {
                                throw new common_1.ConflictException('This class section already has an active attendance session');
                            }
                            startedAt = new Date();
                            durationMinutes = (_a = dto.durationMinutes) !== null && _a !== void 0 ? _a : 10;
                            expiresAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
                            return [4 /*yield*/, this.prisma.attendanceSession.create({
                                    data: {
                                        classSectionId: dto.classSectionId,
                                        lecturerId: sessionLecturerId,
                                        expiresAt: expiresAt,
                                    },
                                })];
                        case 3:
                            session = _b.sent();
                            displayKey = "dsp_".concat((0, node_crypto_1.randomBytes)(24).toString('base64url'));
                            displayTtlSeconds = Math.max(1, Math.ceil((expiresAt.getTime() - startedAt.getTime()) / 1000));
                            return [4 /*yield*/, this.setStoreValue(this.buildDisplayKeyStoreKey(session.id), displayKey, displayTtlSeconds)];
                        case 4:
                            _b.sent();
                            appBaseUrl = this.configService.get('APP_BASE_URL', 'http://localhost:3000');
                            base = appBaseUrl.replace(/\/$/, '');
                            return [2 /*return*/, {
                                    sessionId: session.id,
                                    displayKey: displayKey,
                                    displayUrl: "".concat(base, "/live/attendance/").concat(session.id, "?displayKey=").concat(encodeURIComponent(displayKey)),
                                    startedAt: session.startedAt,
                                    expiresAt: session.expiresAt,
                                    status: session.status,
                                }];
                    }
                });
            });
        };
        AttendanceService_1.prototype.stopSession = function (sessionId, actorId, actorRole) {
            return __awaiter(this, void 0, void 0, function () {
                var session;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.assertCanManageAttendance(actorRole);
                            return [4 /*yield*/, this.prisma.attendanceSession.findUnique({
                                    where: { id: sessionId },
                                })];
                        case 1:
                            session = _a.sent();
                            if (!session || (!this.canManageAllAttendance(actorRole) && session.lecturerId !== actorId)) {
                                throw new common_1.NotFoundException('Không tìm thấy phiên điểm danh');
                            }
                            return [4 /*yield*/, this.revokeDisplayKeyForSession(sessionId)];
                        case 2:
                            _a.sent();
                            if (session.status !== client_1.AttendanceSessionStatus.active) {
                                return [2 /*return*/, session];
                            }
                            return [2 /*return*/, this.prisma.attendanceSession.update({
                                    where: { id: sessionId },
                                    data: {
                                        status: client_1.AttendanceSessionStatus.closed,
                                        closedAt: new Date(),
                                    },
                                })];
                    }
                });
            });
        };
        AttendanceService_1.prototype.issueQrToken = function (sessionId, displayKey) {
            return __awaiter(this, void 0, void 0, function () {
                var session, activeSession, now, expiresAt, token, payload;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.assertDisplayKeyPresent(displayKey);
                            return [4 /*yield*/, this.validateDisplayKeyOrThrow(sessionId, displayKey)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.attendanceSession.findUnique({
                                    where: { id: sessionId },
                                    include: {
                                        classSection: {
                                            select: {
                                                classCode: true,
                                                sectionCode: true,
                                                course: { select: { name: true } },
                                            },
                                        },
                                    },
                                })];
                        case 2:
                            session = _a.sent();
                            return [4 /*yield*/, this.ensureSessionActive(session)];
                        case 3:
                            activeSession = _a.sent();
                            now = new Date();
                            expiresAt = new Date(now.getTime() + this.tokenTtlSeconds * 1000);
                            token = "att_".concat((0, node_crypto_1.randomBytes)(18).toString('base64url'));
                            payload = {
                                sessionId: activeSession.id,
                                issuedAt: now.toISOString(),
                                expiresAt: expiresAt.toISOString(),
                            };
                            return [4 /*yield*/, this.setStoreValue(this.buildTokenKey(token), JSON.stringify(payload), this.tokenTtlSeconds)];
                        case 4:
                            _a.sent();
                            return [2 /*return*/, {
                                    token: token,
                                    expiresAt: expiresAt,
                                    refreshInSeconds: this.qrRefreshSeconds,
                                    ttlSeconds: this.tokenTtlSeconds,
                                    session: {
                                        classCode: activeSession.classSection.classCode,
                                        sectionCode: activeSession.classSection.sectionCode,
                                        courseName: activeSession.classSection.course.name,
                                        status: activeSession.status,
                                    },
                                }];
                    }
                });
            });
        };
        AttendanceService_1.prototype.renderLiveAttendancePage = function (sessionId, displayKey, response) {
            return __awaiter(this, void 0, void 0, function () {
                var session, html, error_1, statusCode, html;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 4, , 5]);
                            this.assertDisplayKeyPresent(displayKey);
                            return [4 /*yield*/, this.validateDisplayKeyOrThrow(sessionId, displayKey)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.attendanceSession.findUnique({
                                    where: { id: sessionId },
                                })];
                        case 2:
                            session = _a.sent();
                            return [4 /*yield*/, this.ensureSessionActive(session)];
                        case 3:
                            _a.sent();
                            html = this.renderLiveAttendanceHtml(sessionId, displayKey);
                            if (response) {
                                return [2 /*return*/, response.type('html').status(common_1.HttpStatus.OK).send(html)];
                            }
                            return [2 /*return*/, html];
                        case 4:
                            error_1 = _a.sent();
                            statusCode = error_1 instanceof common_1.NotFoundException
                                ? common_1.HttpStatus.NOT_FOUND
                                : error_1 instanceof common_1.ForbiddenException || error_1 instanceof common_1.BadRequestException
                                    ? common_1.HttpStatus.GONE
                                    : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
                            html = this.renderInactiveLiveAttendanceHtml(statusCode === common_1.HttpStatus.INTERNAL_SERVER_ERROR
                                ? 'Không thể tải màn hình điểm danh lúc này.'
                                : 'Phiên điểm danh đã kết thúc. Liên kết QR này không còn hiệu lực.');
                            if (response) {
                                return [2 /*return*/, response.type('html').status(statusCode).send(html)];
                            }
                            return [2 /*return*/, html];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        AttendanceService_1.prototype.checkin = function (studentId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var rawTokenPayload, tokenPayload, session, activeSession, activeEnrollment, record, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.enforceCheckinRateLimit(studentId)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.getStoreValue(this.buildTokenKey(dto.token))];
                        case 2:
                            rawTokenPayload = _a.sent();
                            if (!rawTokenPayload) {
                                throw new common_1.BadRequestException({
                                    code: 'TOKEN_INVALID',
                                    message: 'Mã điểm danh không hợp lệ hoặc đã hết hạn',
                                });
                            }
                            try {
                                tokenPayload = JSON.parse(rawTokenPayload);
                            }
                            catch (_b) {
                                throw new common_1.BadRequestException({
                                    code: 'TOKEN_INVALID',
                                    message: 'Mã điểm danh không hợp lệ',
                                });
                            }
                            return [4 /*yield*/, this.prisma.attendanceSession.findUnique({
                                    where: { id: tokenPayload.sessionId },
                                })];
                        case 3:
                            session = _a.sent();
                            return [4 /*yield*/, this.ensureSessionActive(session)];
                        case 4:
                            activeSession = _a.sent();
                            return [4 /*yield*/, this.prisma.classEnrollment.findFirst({
                                    where: {
                                        studentId: studentId,
                                        classSectionId: activeSession.classSectionId,
                                        status: client_1.EnrollmentStatus.active,
                                    },
                                    select: { id: true },
                                })];
                        case 5:
                            activeEnrollment = _a.sent();
                            if (!activeEnrollment) {
                                throw new common_1.ForbiddenException({
                                    code: 'NOT_ENROLLED',
                                    message: 'Sinh viên chưa đăng ký lớp học phần này',
                                });
                            }
                            _a.label = 6;
                        case 6:
                            _a.trys.push([6, 8, , 9]);
                            return [4 /*yield*/, this.prisma.attendanceRecord.create({
                                    data: {
                                        sessionId: activeSession.id,
                                        studentId: studentId,
                                    },
                                })];
                        case 7:
                            record = _a.sent();
                            return [2 /*return*/, {
                                    sessionId: activeSession.id,
                                    studentId: record.studentId,
                                    checkinTime: record.checkinTime,
                                }];
                        case 8:
                            error_2 = _a.sent();
                            if (this.isUniqueConstraintError(error_2)) {
                                throw new common_1.ConflictException({
                                    code: 'ALREADY_CHECKED_IN',
                                    message: 'Sinh viên đã điểm danh cho buổi học này',
                                });
                            }
                            throw error_2;
                        case 9: return [2 /*return*/];
                    }
                });
            });
        };
        AttendanceService_1.prototype.getSessionRecords = function (sessionId, actorId, actorRole, query) {
            return __awaiter(this, void 0, void 0, function () {
                var page, limit, skip, _a, items, total;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.verifySessionAccessByRole(sessionId, actorId, actorRole)];
                        case 1:
                            _d.sent();
                            page = Math.max((_b = query.page) !== null && _b !== void 0 ? _b : shared_1.PAGINATION_DEFAULTS.PAGE, shared_1.PAGINATION_DEFAULTS.PAGE);
                            limit = Math.min(Math.max((_c = query.limit) !== null && _c !== void 0 ? _c : shared_1.PAGINATION_DEFAULTS.LIMIT, 1), shared_1.PAGINATION_DEFAULTS.MAX_LIMIT);
                            skip = (page - 1) * limit;
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.attendanceRecord.findMany({
                                        where: { sessionId: sessionId },
                                        include: {
                                            student: {
                                                select: {
                                                    id: true,
                                                    email: true,
                                                    firstName: true,
                                                    lastName: true,
                                                    studentId: true,
                                                },
                                            },
                                        },
                                        orderBy: { checkinTime: 'asc' },
                                        skip: skip,
                                        take: limit,
                                    }),
                                    this.prisma.attendanceRecord.count({ where: { sessionId: sessionId } }),
                                ])];
                        case 2:
                            _a = _d.sent(), items = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    items: items.map(function (item) { return ({
                                        id: item.id,
                                        checkinTime: item.checkinTime,
                                        student: item.student,
                                    }); }),
                                    meta: {
                                        total: total,
                                        page: page,
                                        limit: limit,
                                        totalPages: Math.ceil(total / limit),
                                    },
                                }];
                    }
                });
            });
        };
        AttendanceService_1.prototype.exportSessionAttendance = function (sessionId, actorId, actorRole) {
            return __awaiter(this, void 0, void 0, function () {
                var session, roster;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.verifySessionAccessByRole(sessionId, actorId, actorRole)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.attendanceSession.findUnique({
                                    where: { id: sessionId },
                                    include: {
                                        classSection: {
                                            select: {
                                                id: true,
                                                classCode: true,
                                                sectionCode: true,
                                                course: {
                                                    select: {
                                                        code: true,
                                                        name: true,
                                                        credits: true,
                                                    },
                                                },
                                            },
                                        },
                                        records: {
                                            include: {
                                                student: {
                                                    select: {
                                                        id: true,
                                                        email: true,
                                                        firstName: true,
                                                        lastName: true,
                                                        studentId: true,
                                                    },
                                                },
                                            },
                                            orderBy: { checkinTime: 'asc' },
                                        },
                                    },
                                })];
                        case 2:
                            session = _a.sent();
                            if (!session) {
                                throw new common_1.NotFoundException('Không tìm thấy phiên điểm danh');
                            }
                            return [4 /*yield*/, this.prisma.classEnrollment.findMany({
                                    where: {
                                        classSectionId: session.classSectionId,
                                        status: client_1.EnrollmentStatus.active,
                                    },
                                    include: {
                                        student: {
                                            select: {
                                                id: true,
                                                email: true,
                                                firstName: true,
                                                lastName: true,
                                                studentId: true,
                                            },
                                        },
                                    },
                                    orderBy: {
                                        student: {
                                            studentId: 'asc',
                                        },
                                    },
                                })];
                        case 3:
                            roster = _a.sent();
                            return [2 /*return*/, this.buildAttendanceExportWorkbook(session, roster)];
                    }
                });
            });
        };
        AttendanceService_1.prototype.exportClassSectionAttendanceSummary = function (classSectionId, actorId, actorRole) {
            return __awaiter(this, void 0, void 0, function () {
                var classSection, roster;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.verifyClassSectionAccessByRole(classSectionId, actorId, actorRole)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.classSection.findUnique({
                                    where: { id: classSectionId },
                                    include: {
                                        course: {
                                            select: {
                                                code: true,
                                                name: true,
                                                credits: true,
                                            },
                                        },
                                        lecturer: {
                                            select: {
                                                firstName: true,
                                                lastName: true,
                                                email: true,
                                            },
                                        },
                                        attendanceSessions: {
                                            include: {
                                                records: {
                                                    select: {
                                                        studentId: true,
                                                    },
                                                },
                                            },
                                            orderBy: { startedAt: 'asc' },
                                        },
                                    },
                                })];
                        case 2:
                            classSection = _a.sent();
                            if (!classSection) {
                                throw new common_1.NotFoundException('Class section not found');
                            }
                            return [4 /*yield*/, this.prisma.classEnrollment.findMany({
                                    where: {
                                        classSectionId: classSectionId,
                                        status: client_1.EnrollmentStatus.active,
                                    },
                                    include: {
                                        student: {
                                            select: {
                                                id: true,
                                                email: true,
                                                firstName: true,
                                                lastName: true,
                                                studentId: true,
                                            },
                                        },
                                    },
                                    orderBy: {
                                        student: {
                                            studentId: 'asc',
                                        },
                                    },
                                })];
                        case 3:
                            roster = _a.sent();
                            return [2 /*return*/, this.buildAttendanceClassSummaryWorkbook(classSection, roster)];
                    }
                });
            });
        };
        AttendanceService_1.prototype.getHistory = function (actorId, actorRole, query) {
            return __awaiter(this, void 0, void 0, function () {
                var page, limit, skip, where, day, dayStart, dayEnd, _a, items, total;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            this.assertCanManageAttendance(actorRole);
                            page = Math.max((_b = query.page) !== null && _b !== void 0 ? _b : shared_1.PAGINATION_DEFAULTS.PAGE, shared_1.PAGINATION_DEFAULTS.PAGE);
                            limit = Math.min(Math.max((_c = query.limit) !== null && _c !== void 0 ? _c : shared_1.PAGINATION_DEFAULTS.LIMIT, 1), shared_1.PAGINATION_DEFAULTS.MAX_LIMIT);
                            skip = (page - 1) * limit;
                            where = __assign({ classSectionId: query.classSectionId }, (!this.canManageAllAttendance(actorRole) ? { lecturerId: actorId } : {}));
                            if (query.date) {
                                day = new Date(query.date);
                                dayStart = new Date(day);
                                dayStart.setHours(0, 0, 0, 0);
                                dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
                                where.startedAt = {
                                    gte: dayStart,
                                    lt: dayEnd,
                                };
                            }
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.attendanceSession.findMany({
                                        where: where,
                                        include: {
                                            classSection: {
                                                select: {
                                                    id: true,
                                                    classCode: true,
                                                    sectionCode: true,
                                                },
                                            },
                                            _count: {
                                                select: { records: true },
                                            },
                                        },
                                        orderBy: { startedAt: 'desc' },
                                        skip: skip,
                                        take: limit,
                                    }),
                                    this.prisma.attendanceSession.count({ where: where }),
                                ])];
                        case 1:
                            _a = _d.sent(), items = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    items: items.map(function (item) { return ({
                                        id: item.id,
                                        status: item.status,
                                        startedAt: item.startedAt,
                                        expiresAt: item.expiresAt,
                                        closedAt: item.closedAt,
                                        classSection: item.classSection,
                                        checkedInCount: item._count.records,
                                    }); }),
                                    meta: {
                                        total: total,
                                        page: page,
                                        limit: limit,
                                        totalPages: Math.ceil(total / limit),
                                    },
                                }];
                    }
                });
            });
        };
        AttendanceService_1.prototype.getClassSectionSessionSummary = function (classSectionId, actorId, actorRole) {
            return __awaiter(this, void 0, void 0, function () {
                var scopeWhere, _a, totalSessions, activeSessions, closedSessions, expiredSessions, latestSession;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            this.assertCanManageAttendance(actorRole);
                            return [4 /*yield*/, this.verifyClassSectionAccessByRole(classSectionId, actorId, actorRole)];
                        case 1:
                            _b.sent();
                            scopeWhere = __assign({ classSectionId: classSectionId }, (!this.canManageAllAttendance(actorRole) ? { lecturerId: actorId } : {}));
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.attendanceSession.count({
                                        where: scopeWhere,
                                    }),
                                    this.prisma.attendanceSession.count({
                                        where: __assign(__assign({}, scopeWhere), { status: client_1.AttendanceSessionStatus.active }),
                                    }),
                                    this.prisma.attendanceSession.count({
                                        where: __assign(__assign({}, scopeWhere), { status: client_1.AttendanceSessionStatus.closed }),
                                    }),
                                    this.prisma.attendanceSession.count({
                                        where: __assign(__assign({}, scopeWhere), { status: client_1.AttendanceSessionStatus.expired }),
                                    }),
                                    this.prisma.attendanceSession.findFirst({
                                        where: scopeWhere,
                                        include: {
                                            _count: {
                                                select: { records: true },
                                            },
                                        },
                                        orderBy: { startedAt: 'desc' },
                                    }),
                                ])];
                        case 2:
                            _a = _b.sent(), totalSessions = _a[0], activeSessions = _a[1], closedSessions = _a[2], expiredSessions = _a[3], latestSession = _a[4];
                            return [2 /*return*/, {
                                    totalSessions: totalSessions,
                                    activeSessions: activeSessions,
                                    closedSessions: closedSessions,
                                    expiredSessions: expiredSessions,
                                    latestSession: latestSession
                                        ? {
                                            id: latestSession.id,
                                            status: latestSession.status,
                                            startedAt: latestSession.startedAt,
                                            expiresAt: latestSession.expiresAt,
                                            checkedInCount: latestSession._count.records,
                                        }
                                        : null,
                                }];
                    }
                });
            });
        };
        AttendanceService_1.prototype.getLecturerClassSections = function (actorId, actorRole) {
            return __awaiter(this, void 0, void 0, function () {
                var sections;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.assertCanManageAttendance(actorRole);
                            return [4 /*yield*/, this.prisma.classSection.findMany({
                                    where: __assign({}, (!this.canManageAllAttendance(actorRole) ? { lecturerId: actorId } : {})),
                                    include: {
                                        course: {
                                            select: {
                                                code: true,
                                                name: true,
                                                credits: true,
                                            },
                                        },
                                        semester: {
                                            select: {
                                                id: true,
                                                name: true,
                                                isCurrent: true,
                                            },
                                        },
                                        meetings: {
                                            select: {
                                                id: true,
                                                dayOfWeek: true,
                                                room: true,
                                                startTime: true,
                                                endTime: true,
                                                startPeriod: true,
                                                endPeriod: true,
                                                sessionType: true,
                                                note: true,
                                            },
                                            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
                                        },
                                        _count: {
                                            select: {
                                                enrollments: {
                                                    where: { status: client_1.EnrollmentStatus.active },
                                                },
                                            },
                                        },
                                    },
                                    orderBy: [{ semester: { startDate: 'desc' } }, { classCode: 'asc' }],
                                })];
                        case 1:
                            sections = _a.sent();
                            return [2 /*return*/, sections.map(function (section) { return ({
                                    id: section.id,
                                    classCode: section.classCode,
                                    sectionCode: section.sectionCode,
                                    note: section.note,
                                    capacity: section.capacity,
                                    registrationOpen: section.registrationOpen,
                                    enrolledCount: section._count.enrollments,
                                    course: section.course,
                                    semester: section.semester,
                                    meetings: section.meetings,
                                }); })];
                    }
                });
            });
        };
        AttendanceService_1.prototype.getClassSectionStudents = function (classSectionId, actorId, actorRole) {
            return __awaiter(this, void 0, void 0, function () {
                var roster;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.assertCanManageAttendance(actorRole);
                            return [4 /*yield*/, this.verifyClassSectionAccessByRole(classSectionId, actorId, actorRole)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.classEnrollment.findMany({
                                    where: {
                                        classSectionId: classSectionId,
                                        status: client_1.EnrollmentStatus.active,
                                    },
                                    include: {
                                        student: {
                                            select: {
                                                id: true,
                                                email: true,
                                                firstName: true,
                                                lastName: true,
                                                studentId: true,
                                            },
                                        },
                                    },
                                    orderBy: {
                                        student: {
                                            studentId: 'asc',
                                        },
                                    },
                                })];
                        case 2:
                            roster = _a.sent();
                            return [2 /*return*/, roster.map(function (enrollment) { return ({
                                    id: enrollment.student.id,
                                    email: enrollment.student.email,
                                    firstName: enrollment.student.firstName,
                                    lastName: enrollment.student.lastName,
                                    studentId: enrollment.student.studentId,
                                }); })];
                    }
                });
            });
        };
        AttendanceService_1.prototype.getStudentHistory = function (studentId, query) {
            return __awaiter(this, void 0, void 0, function () {
                var page, limit, skip, _a, items, total;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            page = Math.max((_b = query.page) !== null && _b !== void 0 ? _b : shared_1.PAGINATION_DEFAULTS.PAGE, shared_1.PAGINATION_DEFAULTS.PAGE);
                            limit = Math.min(Math.max((_c = query.limit) !== null && _c !== void 0 ? _c : shared_1.PAGINATION_DEFAULTS.LIMIT, 1), shared_1.PAGINATION_DEFAULTS.MAX_LIMIT);
                            skip = (page - 1) * limit;
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.attendanceRecord.findMany({
                                        where: { studentId: studentId },
                                        include: {
                                            session: {
                                                include: {
                                                    classSection: {
                                                        include: {
                                                            course: {
                                                                select: {
                                                                    code: true,
                                                                    name: true,
                                                                    credits: true,
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                        orderBy: { checkinTime: 'desc' },
                                        skip: skip,
                                        take: limit,
                                    }),
                                    this.prisma.attendanceRecord.count({
                                        where: { studentId: studentId },
                                    }),
                                ])];
                        case 1:
                            _a = _d.sent(), items = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    items: items.map(function (item) { return ({
                                        id: item.id,
                                        checkinTime: item.checkinTime,
                                        sessionId: item.sessionId,
                                        classSection: {
                                            id: item.session.classSection.id,
                                            classCode: item.session.classSection.classCode,
                                            sectionCode: item.session.classSection.sectionCode,
                                            course: item.session.classSection.course,
                                        },
                                        session: {
                                            id: item.session.id,
                                            status: item.session.status,
                                            startedAt: item.session.startedAt,
                                            expiresAt: item.session.expiresAt,
                                        },
                                    }); }),
                                    meta: {
                                        total: total,
                                        page: page,
                                        limit: limit,
                                        totalPages: Math.ceil(total / limit),
                                    },
                                }];
                    }
                });
            });
        };
        AttendanceService_1.prototype.verifySessionAccessByRole = function (sessionId, actorId, actorRole) {
            return __awaiter(this, void 0, void 0, function () {
                var session;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.assertCanManageAttendance(actorRole);
                            return [4 /*yield*/, this.prisma.attendanceSession.findFirst({
                                    where: __assign({ id: sessionId }, (!this.canManageAllAttendance(actorRole) ? { lecturerId: actorId } : {})),
                                    select: { id: true },
                                })];
                        case 1:
                            session = _a.sent();
                            if (!session) {
                                throw new common_1.NotFoundException('Không tìm thấy phiên điểm danh');
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        AttendanceService_1.prototype.verifyClassSectionAccessByRole = function (classSectionId, actorId, actorRole) {
            return __awaiter(this, void 0, void 0, function () {
                var classSection;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.assertCanManageAttendance(actorRole);
                            return [4 /*yield*/, this.prisma.classSection.findFirst({
                                    where: __assign({ id: classSectionId }, (!this.canManageAllAttendance(actorRole) ? { lecturerId: actorId } : {})),
                                    select: { id: true },
                                })];
                        case 1:
                            classSection = _a.sent();
                            if (!classSection) {
                                throw new common_1.NotFoundException('Class section not found');
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        AttendanceService_1.prototype.buildAttendanceExportWorkbook = function (session, roster) {
            return __awaiter(this, void 0, void 0, function () {
                var workbook, worksheet, recordsByStudentId, infoRows, headerRowIndex, headerRow, startedDate, fileName, _a, _b;
                var _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            workbook = new exceljs_1.default.Workbook();
                            worksheet = workbook.addWorksheet('Diem danh');
                            recordsByStudentId = new Map(session.records.map(function (record) { return [record.studentId, record]; }));
                            worksheet.columns = [
                                { header: 'STT', key: 'index', width: 8 },
                                { header: 'MSSV', key: 'studentId', width: 18 },
                                { header: 'Họ và tên', key: 'fullName', width: 28 },
                                { header: 'Email', key: 'email', width: 30 },
                                { header: 'Trạng thái', key: 'status', width: 16 },
                                { header: 'Giờ check-in', key: 'checkinTime', width: 22 },
                            ];
                            worksheet.mergeCells('A1:F1');
                            worksheet.getCell('A1').value = 'BÁO CÁO ĐIỂM DANH QR';
                            worksheet.getCell('A1').font = { bold: true, size: 14 };
                            worksheet.getCell('A1').alignment = { horizontal: 'center' };
                            infoRows = [
                                ['Môn học', session.classSection.course.name],
                                ['Mã môn', session.classSection.course.code],
                                ['Mã lớp', session.classSection.classCode],
                                ['Bắt đầu', formatExportDateTime(session.startedAt)],
                                ['Hết hạn', formatExportDateTime(session.expiresAt)],
                                ['Đã check-in / Sĩ số', "".concat(session.records.length, "/").concat(roster.length)],
                            ];
                            infoRows.forEach(function (_a, index) {
                                var label = _a[0], value = _a[1];
                                var rowNumber = index + 3;
                                var row = worksheet.getRow(rowNumber);
                                worksheet.mergeCells("B".concat(rowNumber, ":F").concat(rowNumber));
                                row.getCell(1).value = label;
                                row.getCell(2).value = value;
                                row.getCell(1).font = { bold: true };
                                row.getCell(2).alignment = { horizontal: 'left' };
                            });
                            headerRowIndex = infoRows.length + 5;
                            headerRow = worksheet.getRow(headerRowIndex);
                            headerRow.values = ['STT', 'MSSV', 'Họ và tên', 'Email', 'Trạng thái', 'Giờ check-in'];
                            headerRow.font = { bold: true };
                            headerRow.eachCell(function (cell) {
                                cell.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: { argb: 'FFEAF3FF' },
                                };
                                cell.border = {
                                    top: { style: 'thin', color: { argb: 'FFD5E2F2' } },
                                    left: { style: 'thin', color: { argb: 'FFD5E2F2' } },
                                    bottom: { style: 'thin', color: { argb: 'FFD5E2F2' } },
                                    right: { style: 'thin', color: { argb: 'FFD5E2F2' } },
                                };
                            });
                            roster.forEach(function (enrollment, index) {
                                var _a;
                                var record = recordsByStudentId.get(enrollment.studentId);
                                var row = worksheet.addRow({
                                    index: index + 1,
                                    studentId: (_a = enrollment.student.studentId) !== null && _a !== void 0 ? _a : enrollment.student.email,
                                    fullName: formatFullName(enrollment.student.firstName, enrollment.student.lastName),
                                    email: enrollment.student.email,
                                    status: record ? 'Có mặt' : 'Vắng',
                                    checkinTime: record ? formatExportDateTime(record.checkinTime) : '',
                                });
                                row.eachCell(function (cell) {
                                    cell.border = {
                                        top: { style: 'thin', color: { argb: 'FFE4EDF7' } },
                                        left: { style: 'thin', color: { argb: 'FFE4EDF7' } },
                                        bottom: { style: 'thin', color: { argb: 'FFE4EDF7' } },
                                        right: { style: 'thin', color: { argb: 'FFE4EDF7' } },
                                    };
                                });
                            });
                            worksheet.views = [{ state: 'frozen', ySplit: headerRowIndex }];
                            startedDate = new Intl.DateTimeFormat('sv-SE', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                            })
                                .format(session.startedAt)
                                .replace(/-/g, '');
                            fileName = sanitizeFileName("attendance-".concat(session.classSection.classCode, "-").concat(startedDate, ".xlsx"));
                            _c = {
                                fileName: fileName
                            };
                            _b = (_a = Buffer).from;
                            return [4 /*yield*/, workbook.xlsx.writeBuffer()];
                        case 1: return [2 /*return*/, (_c.buffer = _b.apply(_a, [_d.sent()]),
                                _c)];
                    }
                });
            });
        };
        AttendanceService_1.prototype.buildAttendanceClassSummaryWorkbook = function (classSection, roster) {
            return __awaiter(this, void 0, void 0, function () {
                var workbook, worksheet, sessions, lastColumnIndex, lastColumnLetter, lecturerName, titleCell, infoRows, legendCell, legendItems, headerRowNumber, headerRow, footerRowNumber, footerCell, fileName, _a, _b;
                var _c;
                var _this = this;
                var _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            workbook = new exceljs_1.default.Workbook();
                            worksheet = workbook.addWorksheet('Tong hop diem danh');
                            sessions = classSection.attendanceSessions;
                            lastColumnIndex = 4 + sessions.length;
                            lastColumnLetter = String.fromCharCode(64 + Math.max(lastColumnIndex, 4));
                            lecturerName = classSection.lecturer
                                ? formatFullName(classSection.lecturer.firstName, classSection.lecturer.lastName)
                                : '';
                            worksheet.views = [{ state: 'frozen', ySplit: 7, xSplit: 3 }];
                            worksheet.properties.defaultRowHeight = 22;
                            worksheet.columns = __spreadArray([
                                { key: 'index', width: 8 },
                                { key: 'studentId', width: 16 },
                                { key: 'fullName', width: 28 },
                                { key: 'email', width: 30 }
                            ], sessions.map(function () { return ({ width: 16 }); }), true);
                            worksheet.mergeCells("A1:".concat(lastColumnLetter, "1"));
                            titleCell = worksheet.getCell('A1');
                            titleCell.value = 'BAO CAO TONG HOP DIEM DANH THEO LOP';
                            titleCell.font = { bold: true, size: 16 };
                            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
                            infoRows = [
                                ['Mon hoc', classSection.course.name],
                                ['Ma mon', classSection.course.code],
                                ['Ma lop', classSection.classCode],
                                ['Giang vien', lecturerName || ((_d = classSection.lecturer) === null || _d === void 0 ? void 0 : _d.email) || 'Chua cap nhat'],
                                ['Tong sinh vien', String(roster.length)],
                            ];
                            infoRows.forEach(function (_a, index) {
                                var label = _a[0], value = _a[1];
                                var rowNumber = index + 3;
                                worksheet.getCell("A".concat(rowNumber)).value = label;
                                worksheet.getCell("A".concat(rowNumber)).font = { bold: true, size: 11 };
                                worksheet.getCell("B".concat(rowNumber)).value = value;
                                worksheet.mergeCells("B".concat(rowNumber, ":D").concat(rowNumber));
                                worksheet.getCell("B".concat(rowNumber)).alignment = { horizontal: 'left' };
                            });
                            legendCell = worksheet.getCell('F3');
                            legendCell.value = 'Chu thich';
                            legendCell.font = { bold: true, size: 11 };
                            legendItems = [
                                ['F4', 'Co mat'],
                                ['F5', 'Vang'],
                                ['G4', 'Dang mo'],
                                ['G5', 'Het han'],
                            ];
                            legendItems.forEach(function (_a) {
                                var cellRef = _a[0], value = _a[1];
                                var cell = worksheet.getCell(cellRef);
                                cell.value = value;
                                _this.applySummaryStatusStyle(cell, value);
                                _this.applySummaryBorder(cell);
                            });
                            headerRowNumber = 7;
                            headerRow = worksheet.getRow(headerRowNumber);
                            headerRow.height = 34;
                            headerRow.getCell(1).value = 'STT';
                            headerRow.getCell(2).value = 'MSSV';
                            headerRow.getCell(3).value = 'Ho va ten';
                            headerRow.getCell(4).value = 'Email';
                            sessions.forEach(function (session, index) {
                                var dateLabel = new Intl.DateTimeFormat('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                }).format(session.startedAt);
                                var timeLabel = new Intl.DateTimeFormat('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                }).format(session.startedAt);
                                headerRow.getCell(5 + index).value = "".concat(dateLabel, "\n").concat(timeLabel);
                            });
                            headerRow.eachCell(function (cell) {
                                cell.font = { bold: true, size: 11 };
                                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                                cell.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: { argb: 'FFEAF3FF' },
                                };
                                _this.applySummaryBorder(cell, 'FFC9D7E6');
                            });
                            roster.forEach(function (enrollment, index) {
                                var _a;
                                var row = worksheet.addRow(__spreadArray([
                                    index + 1,
                                    (_a = enrollment.student.studentId) !== null && _a !== void 0 ? _a : enrollment.student.email,
                                    formatFullName(enrollment.student.firstName, enrollment.student.lastName),
                                    enrollment.student.email
                                ], sessions.map(function (session) {
                                    return session.records.some(function (record) { return record.studentId === enrollment.studentId; })
                                        ? 'Co mat'
                                        : session.status === client_1.AttendanceSessionStatus.active
                                            ? 'Dang mo'
                                            : session.status === client_1.AttendanceSessionStatus.expired
                                                ? 'Het han'
                                                : 'Vang';
                                }), true));
                                row.height = 24;
                                row.eachCell(function (cell, colNumber) {
                                    _this.applySummaryBorder(cell);
                                    if (colNumber >= 5) {
                                        _this.applySummaryStatusStyle(cell, String(cell.value || ''));
                                    }
                                    else {
                                        cell.alignment = { vertical: 'middle' };
                                    }
                                });
                            });
                            footerRowNumber = worksheet.lastRow.number + 2;
                            worksheet.mergeCells("A".concat(footerRowNumber, ":").concat(lastColumnLetter).concat(footerRowNumber));
                            footerCell = worksheet.getCell("A".concat(footerRowNumber));
                            footerCell.value =
                                'Bao cao nay tong hop theo lop: moi cot la mot phien diem danh, moi dong la mot sinh vien.';
                            footerCell.font = { italic: true, size: 10, color: { argb: 'FF667085' } };
                            fileName = sanitizeFileName("attendance-summary-".concat(classSection.classCode, ".xlsx"));
                            _c = {
                                fileName: fileName
                            };
                            _b = (_a = Buffer).from;
                            return [4 /*yield*/, workbook.xlsx.writeBuffer()];
                        case 1: return [2 /*return*/, (_c.buffer = _b.apply(_a, [_e.sent()]),
                                _c)];
                    }
                });
            });
        };
        AttendanceService_1.prototype.applySummaryBorder = function (cell, color) {
            if (color === void 0) { color = 'FFD7E0EA'; }
            cell.border = {
                top: { style: 'thin', color: { argb: color } },
                left: { style: 'thin', color: { argb: color } },
                bottom: { style: 'thin', color: { argb: color } },
                right: { style: 'thin', color: { argb: color } },
            };
        };
        AttendanceService_1.prototype.applySummaryStatusStyle = function (cell, value) {
            var _a;
            var toneByStatus = {
                'Co mat': { fill: 'FFE8F7EC', text: 'FF146C2E' },
                Vang: { fill: 'FFFCE8E6', text: 'FFC5221F' },
                'Dang mo': { fill: 'FFFFF4E5', text: 'FF9A6700' },
                'Het han': { fill: 'FFE8F0FE', text: 'FF175CD3' },
            };
            var tone = (_a = toneByStatus[value]) !== null && _a !== void 0 ? _a : { fill: 'FFF8FAFC', text: 'FF344054' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: tone.fill },
            };
            cell.font = { color: { argb: tone.text }, bold: true, size: 11 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        };
        AttendanceService_1.prototype.canManageAllAttendance = function (role) {
            return false;
        };
        AttendanceService_1.prototype.assertCanManageAttendance = function (role) {
            if (role !== client_1.Role.lecturer) {
                throw new common_1.ForbiddenException('You are not allowed to manage attendance');
            }
        };
        AttendanceService_1.prototype.buildTokenKey = function (token) {
            return "attendance:token:".concat(token);
        };
        AttendanceService_1.prototype.buildDisplayKeyStoreKey = function (sessionId) {
            return "attendance:display:".concat(sessionId);
        };
        AttendanceService_1.prototype.buildCheckinRateLimitKey = function (studentId) {
            return "attendance:checkin:rate-limit:".concat(studentId);
        };
        AttendanceService_1.prototype.enforceCheckinRateLimit = function (studentId) {
            return __awaiter(this, void 0, void 0, function () {
                var allowed;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.setStoreValueIfAbsent(this.buildCheckinRateLimitKey(studentId), '1', this.checkinRateLimitSeconds)];
                        case 1:
                            allowed = _a.sent();
                            if (!allowed) {
                                throw new common_1.HttpException({
                                    code: 'RATE_LIMITED',
                                    message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.',
                                }, common_1.HttpStatus.TOO_MANY_REQUESTS);
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        AttendanceService_1.prototype.ensureSessionActive = function (session) {
            return __awaiter(this, void 0, void 0, function () {
                var now;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!session) {
                                throw new common_1.NotFoundException('Không tìm thấy phiên điểm danh');
                            }
                            if (session.status === client_1.AttendanceSessionStatus.closed) {
                                throw new common_1.BadRequestException({
                                    code: 'SESSION_CLOSED',
                                    message: 'Phiên điểm danh đã đóng',
                                });
                            }
                            now = new Date();
                            if (!(session.expiresAt <= now || session.status === client_1.AttendanceSessionStatus.expired)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.markSessionExpired(session.id)];
                        case 1:
                            _a.sent();
                            throw new common_1.BadRequestException({
                                code: 'SESSION_CLOSED',
                                message: 'Phiên điểm danh đã hết hạn',
                            });
                        case 2: return [2 /*return*/, session];
                    }
                });
            });
        };
        AttendanceService_1.prototype.markSessionExpired = function (sessionId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.revokeDisplayKeyForSession(sessionId)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.attendanceSession.updateMany({
                                    where: {
                                        id: sessionId,
                                        status: client_1.AttendanceSessionStatus.active,
                                    },
                                    data: {
                                        status: client_1.AttendanceSessionStatus.expired,
                                    },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        AttendanceService_1.prototype.assertDisplayKeyPresent = function (displayKey) {
            if (!displayKey || !String(displayKey).trim()) {
                throw new common_1.ForbiddenException('Mã hiển thị không hợp lệ');
            }
        };
        AttendanceService_1.prototype.validateDisplayKeyOrThrow = function (sessionId, displayKey) {
            return __awaiter(this, void 0, void 0, function () {
                var stored;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getStoreValue(this.buildDisplayKeyStoreKey(sessionId))];
                        case 1:
                            stored = _a.sent();
                            if (!stored || stored !== displayKey) {
                                throw new common_1.ForbiddenException('Mã hiển thị không hợp lệ');
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        AttendanceService_1.prototype.revokeDisplayKeyForSession = function (sessionId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.deleteStoreValue(this.buildDisplayKeyStoreKey(sessionId))];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        AttendanceService_1.prototype.renderLiveAttendanceHtml = function (sessionId, displayKey) {
            var appBaseUrl = this.configService
                .get('APP_BASE_URL', 'http://localhost:3000')
                .replace(/\/$/, '');
            var clientConfig = {
                sessionId: sessionId,
                displayKey: displayKey,
                apiBaseUrl: appBaseUrl,
                apiPrefix: shared_1.API_PREFIX,
            };
            var configJson = JSON.stringify(clientConfig);
            return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n  <title>\u0110i\u1EC3m danh QR</title>\n  <script src=\"https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js\"></script>\n  <style>\n    :root { color-scheme: light dark; }\n    body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem; }\n    h1 { font-size: 1.25rem; margin: 0 0 0.5rem; text-align: center; }\n    .sub { opacity: 0.85; text-align: center; margin-bottom: 1rem; }\n    #qr-wrap { background: #fff; color: #000; padding: 1rem; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }\n    canvas { display: block; max-width: min(70vw, 360px); height: auto !important; }\n    #status { margin-top: 1rem; text-align: center; font-size: 0.95rem; }\n    .err { color: #c00; }\n  </style>\n</head>\n<body>\n  <h1 id=\"title\">\u0110i\u1EC3m danh</h1>\n  <p class=\"sub\" id=\"subtitle\"></p>\n  <div id=\"qr-wrap\"><canvas id=\"qr\" width=\"280\" height=\"280\" aria-label=\"M\u00E3 QR \u0111i\u1EC3m danh\"></canvas></div>\n  <p id=\"status\">\u0110ang t\u1EA3i...</p>\n  <script>\n    (function () {\n      var cfg = ".concat(configJson, ";\n      var canvas = document.getElementById('qr');\n      var statusEl = document.getElementById('status');\n      var titleEl = document.getElementById('title');\n      var subtitleEl = document.getElementById('subtitle');\n      var pollMs = 30000;\n      var timeoutId = null;\n\n      function setStatus(text, isErr) {\n        statusEl.textContent = text;\n        statusEl.className = isErr ? 'err' : '';\n      }\n\n      function showInactive(text) {\n        if (timeoutId) {\n          clearTimeout(timeoutId);\n          timeoutId = null;\n        }\n        canvas.style.display = 'none';\n        setStatus(text || 'Phi\u00EAn \u0111i\u1EC3m danh \u0111\u00E3 k\u1EBFt th\u00FAc. Li\u00EAn k\u1EBFt n\u00E0y kh\u00F4ng c\u00F2n hi\u1EC7u l\u1EF1c.', true);\n      }\n\n      function buildSubtitle(session) {\n        if (!session) {\n          return '';\n        }\n        var classCode = String(session.classCode || '').trim();\n        var sectionCode = String(session.sectionCode || '').trim();\n        if (!classCode) {\n          return sectionCode;\n        }\n        if (!sectionCode) {\n          return classCode;\n        }\n        return classCode.toUpperCase().endsWith(sectionCode.toUpperCase())\n          ? classCode\n          : (classCode + ' - ' + sectionCode);\n      }\n\n      function buildQrUrl() {\n        var base = String(cfg.apiBaseUrl || '').replace(/[/]$/, '');\n        var prefix = String(cfg.apiPrefix || '');\n        return base + prefix + '/attendance/session/' + encodeURIComponent(cfg.sessionId) + '/qr-token?displayKey=' + encodeURIComponent(cfg.displayKey);\n      }\n\n      function scheduleNext() {\n        if (timeoutId) {\n          clearTimeout(timeoutId);\n        }\n        timeoutId = setTimeout(function () {\n          tick().finally(scheduleNext);\n        }, pollMs);\n      }\n\n      async function tick() {\n        try {\n          var res = await fetch(buildQrUrl(), { credentials: 'omit' });\n          var body = await res.json().catch(function () { return null; });\n          if (!res.ok) {\n            if (res.status === 400 || res.status === 403 || res.status === 404 || res.status === 410) {\n              showInactive('Phi\u00EAn \u0111i\u1EC3m danh \u0111\u00E3 k\u1EBFt th\u00FAc. Li\u00EAn k\u1EBFt n\u00E0y kh\u00F4ng c\u00F2n hi\u1EC7u l\u1EF1c.');\n              return;\n            }\n            setStatus((body && body.message) ? body.message : ('HTTP ' + res.status), true);\n            return;\n          }\n          var data = body && body.data;\n          if (!data || !data.token) {\n            setStatus('Ph\u1EA3n h\u1ED3i kh\u00F4ng h\u1EE3p l\u1EC7', true);\n            return;\n          }\n          if (data.refreshInSeconds) {\n            pollMs = Number(data.refreshInSeconds) * 1000 || 30000;\n          }\n          if (data.session) {\n            titleEl.textContent = data.session.courseName || '\u0110i\u1EC3m danh';\n            subtitleEl.textContent = buildSubtitle(data.session);\n          }\n          await QRCode.toCanvas(canvas, data.token, { margin: 2, width: 280 });\n          canvas.style.display = 'block';\n          setStatus('M\u1EDF \u1EE9ng d\u1EE5ng \u0111\u1EC3 qu\u00E9t m\u00E3 \u0111i\u1EC3m danh');\n        } catch (e) {\n          setStatus(String(e && e.message ? e.message : e), true);\n        }\n      }\n\n      tick().finally(scheduleNext);\n    })();\n  </script>\n</body>\n</html>");
        };
        AttendanceService_1.prototype.renderInactiveLiveAttendanceHtml = function (message) {
            return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n  <title>\u0110i\u1EC3m danh QR</title>\n  <style>\n    body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; background: #f8fafc; color: #0f172a; }\n    .card { width: min(100%, 520px); background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2rem; text-align: center; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08); }\n    h1 { margin: 0 0 0.75rem; font-size: 1.5rem; }\n    p { margin: 0; line-height: 1.6; color: #475569; }\n  </style>\n</head>\n<body>\n  <main class=\"card\">\n    <h1>QR kh\u00F4ng c\u00F2n hi\u1EC7u l\u1EF1c</h1>\n    <p>".concat(message, "</p>\n  </main>\n</body>\n</html>");
        };
        AttendanceService_1.prototype.setStoreValue = function (key, value, ttlSeconds) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!this.redisEnabled) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.redisClient.set(key, value, { EX: ttlSeconds })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                        case 2:
                            this.memoryStore.set(key, {
                                value: value,
                                expiresAt: Date.now() + ttlSeconds * 1000,
                            });
                            return [2 /*return*/];
                    }
                });
            });
        };
        AttendanceService_1.prototype.setStoreValueIfAbsent = function (key, value, ttlSeconds) {
            return __awaiter(this, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!this.redisEnabled) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.redisClient.set(key, value, {
                                    EX: ttlSeconds,
                                    NX: true,
                                })];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, result === 'OK'];
                        case 2:
                            this.cleanupExpiredKey(key);
                            if (this.memoryStore.has(key)) {
                                return [2 /*return*/, false];
                            }
                            this.memoryStore.set(key, {
                                value: value,
                                expiresAt: Date.now() + ttlSeconds * 1000,
                            });
                            return [2 /*return*/, true];
                    }
                });
            });
        };
        AttendanceService_1.prototype.getStoreValue = function (key) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, _b;
                return __generator(this, function (_c) {
                    if (this.redisEnabled) {
                        return [2 /*return*/, this.redisClient.get(key)];
                    }
                    this.cleanupExpiredKey(key);
                    return [2 /*return*/, (_b = (_a = this.memoryStore.get(key)) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : null];
                });
            });
        };
        AttendanceService_1.prototype.deleteStoreValue = function (key) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!this.redisEnabled) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.redisClient.del(key)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                        case 2:
                            this.memoryStore.delete(key);
                            return [2 /*return*/];
                    }
                });
            });
        };
        AttendanceService_1.prototype.cleanupExpiredKey = function (key) {
            var entry = this.memoryStore.get(key);
            if (entry && entry.expiresAt <= Date.now()) {
                this.memoryStore.delete(key);
            }
        };
        AttendanceService_1.prototype.isUniqueConstraintError = function (error) {
            return Boolean(error &&
                typeof error === 'object' &&
                'code' in error &&
                typeof error.code === 'string' &&
                error.code === 'P2002');
        };
        return AttendanceService_1;
    }());
    __setFunctionName(_classThis, "AttendanceService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AttendanceService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AttendanceService = _classThis;
}();
exports.AttendanceService = AttendanceService;
