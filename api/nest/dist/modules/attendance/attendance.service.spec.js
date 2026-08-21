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
var config_1 = require("@nestjs/config");
var testing_1 = require("@nestjs/testing");
var client_1 = require("@prisma/client");
var prisma_service_1 = require("../../database/prisma.service");
var attendance_service_1 = require("./attendance.service");
describe('AttendanceService', function () {
    var service;
    var prisma;
    function createSessionAndToken(overrides) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId, classSectionId, sessionStart, qr;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        sessionId = (_a = overrides === null || overrides === void 0 ? void 0 : overrides.sessionId) !== null && _a !== void 0 ? _a : 'session-1';
                        classSectionId = (_b = overrides === null || overrides === void 0 ? void 0 : overrides.classSectionId) !== null && _b !== void 0 ? _b : 'section-1';
                        prisma.classSection.findUnique.mockResolvedValue({
                            id: classSectionId,
                            lecturerId: 'lecturer-1',
                        });
                        prisma.attendanceSession.findFirst.mockResolvedValue(null);
                        prisma.attendanceSession.create.mockResolvedValue({
                            id: sessionId,
                            startedAt: new Date(),
                            expiresAt: new Date(Date.now() + 600000),
                            status: client_1.AttendanceSessionStatus.active,
                        });
                        return [4 /*yield*/, service.startSession('lecturer-1', client_1.Role.lecturer, {
                                classSectionId: classSectionId,
                                durationMinutes: 10,
                            })];
                    case 1:
                        sessionStart = _e.sent();
                        prisma.attendanceSession.findUnique.mockResolvedValue({
                            id: sessionId,
                            status: (_c = overrides === null || overrides === void 0 ? void 0 : overrides.sessionStatus) !== null && _c !== void 0 ? _c : client_1.AttendanceSessionStatus.active,
                            expiresAt: (_d = overrides === null || overrides === void 0 ? void 0 : overrides.sessionExpiresAt) !== null && _d !== void 0 ? _d : new Date(Date.now() + 60000),
                            classSectionId: classSectionId,
                            classSection: {
                                classCode: 'SE346',
                                sectionCode: '01',
                                course: { name: 'Software Engineering' },
                            },
                        });
                        return [4 /*yield*/, service.issueQrToken(sessionId, sessionStart.displayKey)];
                    case 2:
                        qr = _e.sent();
                        return [2 /*return*/, { sessionId: sessionId, classSectionId: classSectionId, qr: qr }];
                }
            });
        });
    }
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var module;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, testing_1.Test.createTestingModule({
                        providers: [
                            attendance_service_1.AttendanceService,
                            {
                                provide: prisma_service_1.PrismaService,
                                useValue: {
                                    classSection: {
                                        findUnique: jest.fn(),
                                        findMany: jest.fn(),
                                        findFirst: jest.fn(),
                                    },
                                    attendanceSession: {
                                        create: jest.fn(),
                                        findUnique: jest.fn(),
                                        findFirst: jest.fn(),
                                        update: jest.fn(),
                                        updateMany: jest.fn(),
                                        findMany: jest.fn(),
                                        count: jest.fn(),
                                    },
                                    attendanceRecord: {
                                        create: jest.fn(),
                                        findMany: jest.fn(),
                                        count: jest.fn(),
                                    },
                                    classEnrollment: {
                                        findFirst: jest.fn(),
                                        findMany: jest.fn(),
                                    },
                                },
                            },
                            {
                                provide: config_1.ConfigService,
                                useValue: {
                                    get: jest.fn(function (key, defaultValue) {
                                        if (key === 'ATTENDANCE_TOKEN_TTL_SECONDS') {
                                            return 90;
                                        }
                                        if (key === 'APP_BASE_URL') {
                                            return 'http://localhost:3000';
                                        }
                                        if (key === 'REDIS_URL') {
                                            return 'redis://localhost:6379';
                                        }
                                        return defaultValue;
                                    }),
                                },
                            },
                        ],
                    }).compile()];
                case 1:
                    module = _a.sent();
                    service = module.get(attendance_service_1.AttendanceService);
                    prisma = module.get(prisma_service_1.PrismaService);
                    return [2 /*return*/];
            }
        });
    }); });
    describe('checkin', function () {
        it('creates attendance record when token and session are valid', function () { return __awaiter(void 0, void 0, void 0, function () {
            var qr, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.classEnrollment.findFirst.mockResolvedValue({
                            id: 'enrollment-1',
                        });
                        prisma.attendanceRecord.create.mockResolvedValue({
                            id: 'record-1',
                            sessionId: 'session-1',
                            studentId: 'student-1',
                            checkinTime: new Date(),
                        });
                        return [4 /*yield*/, createSessionAndToken()];
                    case 1:
                        qr = (_a.sent()).qr;
                        return [4 /*yield*/, service.checkin('student-1', { token: qr.token })];
                    case 2:
                        result = _a.sent();
                        expect(result.studentId).toBe('student-1');
                        expect(prisma.attendanceRecord.create).toHaveBeenCalledWith({
                            data: {
                                sessionId: 'session-1',
                                studentId: 'student-1',
                            },
                        });
                        expect(prisma.classEnrollment.findFirst).toHaveBeenCalledWith({
                            where: {
                                studentId: 'student-1',
                                classSectionId: 'section-1',
                                status: client_1.EnrollmentStatus.active,
                            },
                            select: { id: true },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('throws TOKEN_INVALID when token does not exist', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(service.checkin('student-1', { token: 'expired-token' })).rejects.toThrow(common_1.BadRequestException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('throws SESSION_CLOSED when attendance session is expired', function () { return __awaiter(void 0, void 0, void 0, function () {
            var qr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, createSessionAndToken({
                            sessionId: 'session-expired',
                        })];
                    case 1:
                        qr = (_a.sent()).qr;
                        prisma.attendanceSession.findUnique.mockResolvedValue({
                            id: 'session-expired',
                            status: client_1.AttendanceSessionStatus.expired,
                            expiresAt: new Date(Date.now() - 1000),
                            classSectionId: 'section-1',
                        });
                        return [4 /*yield*/, expect(service.checkin('student-1', { token: qr.token })).rejects.toThrow(common_1.BadRequestException)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('throws ForbiddenException when student is not enrolled', function () { return __awaiter(void 0, void 0, void 0, function () {
            var qr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.classEnrollment.findFirst.mockResolvedValue(null);
                        return [4 /*yield*/, createSessionAndToken()];
                    case 1:
                        qr = (_a.sent()).qr;
                        return [4 /*yield*/, expect(service.checkin('student-1', { token: qr.token })).rejects.toThrow(common_1.ForbiddenException)];
                    case 2:
                        _a.sent();
                        expect(prisma.attendanceRecord.create).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('throws ALREADY_CHECKED_IN when unique constraint is violated', function () { return __awaiter(void 0, void 0, void 0, function () {
            var qr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.classEnrollment.findFirst.mockResolvedValue({
                            id: 'enrollment-1',
                        });
                        prisma.attendanceRecord.create.mockRejectedValue({
                            code: 'P2002',
                        });
                        return [4 /*yield*/, createSessionAndToken()];
                    case 1:
                        qr = (_a.sent()).qr;
                        return [4 /*yield*/, expect(service.checkin('student-1', { token: qr.token })).rejects.toThrow(common_1.ConflictException)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('startSession', function () {
        it('throws ForbiddenException when lecturer does not own class section', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.classSection.findUnique.mockResolvedValue({
                            id: 'section-1',
                            lecturerId: 'lecturer-2',
                        });
                        return [4 /*yield*/, expect(service.startSession('lecturer-1', client_1.Role.lecturer, {
                                classSectionId: 'section-1',
                                durationMinutes: 10,
                            })).rejects.toThrow(common_1.ForbiddenException)];
                    case 1:
                        _a.sent();
                        expect(prisma.attendanceSession.create).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('rejects admin role on attendance management actions', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(service.startSession('admin-1', client_1.Role.admin, {
                            classSectionId: 'section-1',
                            durationMinutes: 10,
                        })).rejects.toThrow(common_1.ForbiddenException)];
                    case 1:
                        _a.sent();
                        expect(prisma.classSection.findUnique).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('rejects canteen_admin role on attendance management actions', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(service.startSession('canteen-admin-1', client_1.Role.canteen_admin, {
                            classSectionId: 'section-1',
                            durationMinutes: 10,
                        })).rejects.toThrow(common_1.ForbiddenException)];
                    case 1:
                        _a.sent();
                        expect(prisma.classSection.findUnique).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('management scope', function () {
        beforeEach(function () {
            prisma.attendanceSession.findFirst.mockResolvedValue({ id: 'session-1' });
            prisma.attendanceRecord.findMany.mockResolvedValue([]);
            prisma.attendanceRecord.count.mockResolvedValue(0);
            prisma.classSection.findFirst.mockResolvedValue({ id: 'section-1' });
        });
        it('scopes lecturer session records by lecturerId', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, service.getSessionRecords('session-1', 'lecturer-1', client_1.Role.lecturer, {
                            page: 1,
                            limit: 20,
                        })];
                    case 1:
                        _a.sent();
                        expect(prisma.attendanceSession.findFirst).toHaveBeenCalledWith({
                            where: { id: 'session-1', lecturerId: 'lecturer-1' },
                            select: { id: true },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('rejects admin when querying session records', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(service.getSessionRecords('session-1', 'admin-1', client_1.Role.admin, {
                            page: 1,
                            limit: 20,
                        })).rejects.toThrow(common_1.ForbiddenException)];
                    case 1:
                        _a.sent();
                        expect(prisma.attendanceSession.findFirst).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns enrolled students for an accessible class section', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.classEnrollment.findMany.mockResolvedValue([
                            {
                                student: {
                                    id: 'student-1',
                                    email: 'student1@gm.uit.edu.vn',
                                    firstName: 'Van A',
                                    lastName: 'Nguyen',
                                    studentId: '22520001',
                                },
                            },
                        ]);
                        return [4 /*yield*/, service.getClassSectionStudents('section-1', 'lecturer-1', client_1.Role.lecturer)];
                    case 1:
                        result = _a.sent();
                        expect(prisma.classSection.findFirst).toHaveBeenCalledWith({
                            where: { id: 'section-1', lecturerId: 'lecturer-1' },
                            select: { id: true },
                        });
                        expect(prisma.classEnrollment.findMany).toHaveBeenCalledWith({
                            where: {
                                classSectionId: 'section-1',
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
                        });
                        expect(result).toEqual([
                            {
                                id: 'student-1',
                                email: 'student1@gm.uit.edu.vn',
                                firstName: 'Van A',
                                lastName: 'Nguyen',
                                studentId: '22520001',
                            },
                        ]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns session summary for an accessible class section', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.attendanceSession.count
                            .mockResolvedValueOnce(4)
                            .mockResolvedValueOnce(1)
                            .mockResolvedValueOnce(2)
                            .mockResolvedValueOnce(1);
                        prisma.attendanceSession.findFirst.mockResolvedValueOnce({
                            id: 'session-4',
                            status: client_1.AttendanceSessionStatus.active,
                            startedAt: new Date('2026-04-27T05:49:00.000Z'),
                            expiresAt: new Date('2026-04-27T06:04:00.000Z'),
                            _count: {
                                records: 8,
                            },
                        });
                        return [4 /*yield*/, service.getClassSectionSessionSummary('section-1', 'lecturer-1', client_1.Role.lecturer)];
                    case 1:
                        result = _a.sent();
                        expect(prisma.classSection.findFirst).toHaveBeenCalledWith({
                            where: { id: 'section-1', lecturerId: 'lecturer-1' },
                            select: { id: true },
                        });
                        expect(result).toEqual({
                            totalSessions: 4,
                            activeSessions: 1,
                            closedSessions: 2,
                            expiredSessions: 1,
                            latestSession: {
                                id: 'session-4',
                                status: client_1.AttendanceSessionStatus.active,
                                startedAt: new Date('2026-04-27T05:49:00.000Z'),
                                expiresAt: new Date('2026-04-27T06:04:00.000Z'),
                                checkedInCount: 8,
                            },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('rejects super_admin in management list after lecturer-only restriction', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(service.getLecturerClassSections('super-admin-1', client_1.Role.super_admin)).rejects.toThrow(common_1.ForbiddenException)];
                    case 1:
                        _a.sent();
                        expect(prisma.classSection.findMany).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('issueQrToken', function () {
        it('throws ForbiddenException when displayKey is missing', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(service.issueQrToken('session-1', '')).rejects.toThrow(common_1.ForbiddenException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('throws ForbiddenException when displayKey does not match', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(service.issueQrToken('session-1', 'wrong-key')).rejects.toThrow(common_1.ForbiddenException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns token and session meta when displayKey is valid', function () { return __awaiter(void 0, void 0, void 0, function () {
            var qr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, createSessionAndToken()];
                    case 1:
                        qr = (_a.sent()).qr;
                        expect(qr.token).toMatch(/^att_/);
                        expect(qr.session).toEqual({
                            classCode: 'SE346',
                            sectionCode: '01',
                            courseName: 'Software Engineering',
                            status: client_1.AttendanceSessionStatus.active,
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('exportSessionAttendance', function () {
        it('exports roster with present and absent students', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.attendanceSession.findFirst.mockResolvedValue({
                            id: 'session-1',
                        });
                        prisma.attendanceSession.findUnique.mockResolvedValue({
                            id: 'session-1',
                            classSectionId: 'section-1',
                            lecturerId: 'lecturer-1',
                            status: client_1.AttendanceSessionStatus.closed,
                            startedAt: new Date('2026-04-25T00:30:00.000Z'),
                            expiresAt: new Date('2026-04-25T00:45:00.000Z'),
                            classSection: {
                                id: 'section-1',
                                classCode: 'SE346.Q21',
                                sectionCode: 'Q21',
                                course: {
                                    code: 'SE346',
                                    name: 'Lap trinh tren thiet bi di dong',
                                    credits: 4,
                                },
                            },
                            records: [
                                {
                                    id: 'record-1',
                                    studentId: 'student-1',
                                    checkinTime: new Date('2026-04-25T00:34:00.000Z'),
                                    student: {
                                        id: 'student-1',
                                        email: 'student1@gm.uit.edu.vn',
                                        firstName: 'Van A',
                                        lastName: 'Nguyen',
                                        studentId: '22520001',
                                    },
                                },
                            ],
                        });
                        prisma.classEnrollment.findMany.mockResolvedValue([
                            {
                                id: 'enrollment-1',
                                studentId: 'student-1',
                                student: {
                                    id: 'student-1',
                                    email: 'student1@gm.uit.edu.vn',
                                    firstName: 'Van A',
                                    lastName: 'Nguyen',
                                    studentId: '22520001',
                                },
                            },
                            {
                                id: 'enrollment-2',
                                studentId: 'student-2',
                                student: {
                                    id: 'student-2',
                                    email: 'student2@gm.uit.edu.vn',
                                    firstName: 'Thi B',
                                    lastName: 'Tran',
                                    studentId: '22520002',
                                },
                            },
                        ]);
                        return [4 /*yield*/, service.exportSessionAttendance('session-1', 'lecturer-1', client_1.Role.lecturer)];
                    case 1:
                        result = _a.sent();
                        expect(result.fileName).toContain('attendance-SE346.Q21-');
                        expect(result.fileName.endsWith('.xlsx')).toBe(true);
                        expect(Buffer.isBuffer(result.buffer)).toBe(true);
                        expect(result.buffer.byteLength).toBeGreaterThan(0);
                        expect(prisma.classEnrollment.findMany).toHaveBeenCalledWith({
                            where: {
                                classSectionId: 'section-1',
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
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('rejects admin when exporting a managed session outside lecturer scope', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(service.exportSessionAttendance('session-1', 'admin-1', client_1.Role.admin)).rejects.toThrow(common_1.ForbiddenException)];
                    case 1:
                        _a.sent();
                        expect(prisma.attendanceSession.findFirst).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
