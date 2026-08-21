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
var testing_1 = require("@nestjs/testing");
var prisma_service_1 = require("../../database/prisma.service");
var schedule_service_1 = require("./schedule.service");
describe('ScheduleService', function () {
    var service;
    var prisma;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var module;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, testing_1.Test.createTestingModule({
                        providers: [
                            schedule_service_1.ScheduleService,
                            {
                                provide: prisma_service_1.PrismaService,
                                useValue: {
                                    user: { findUnique: jest.fn() },
                                    semester: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn() },
                                },
                            },
                        ],
                    }).compile()];
                case 1:
                    module = _a.sent();
                    service = module.get(schedule_service_1.ScheduleService);
                    prisma = module.get(prisma_service_1.PrismaService);
                    return [2 /*return*/];
            }
        });
    }); });
    it('returns student schedules for all semesters', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.user.findUnique.mockResolvedValue({ role: client_1.Role.student });
                    prisma.semester.findMany.mockResolvedValue([
                        {
                            id: 'sem-1',
                            name: 'HK2 2025-2026',
                            academicYear: '2025-2026',
                            term: 2,
                            startDate: new Date('2026-01-05'),
                            endDate: new Date('2026-05-30'),
                            isCurrent: true,
                            classSections: [
                                {
                                    classCode: 'SE346.Q22',
                                    sectionCode: 'Q22',
                                    note: 'IoT Lab',
                                    course: { code: 'SE346', name: 'IoT', credits: 4 },
                                    scheduleItems: [
                                        {
                                            id: 'schedule-2',
                                            instructor: 'Lecturer B',
                                            room: 'E3.2',
                                            dayOfWeek: 3,
                                            startTime: '09:00',
                                            endTime: '10:30',
                                            startPeriod: 2,
                                            endPeriod: 3,
                                            sessionType: 'daytime',
                                        },
                                        {
                                            id: 'schedule-1',
                                            instructor: 'Lecturer A',
                                            room: 'E3.1',
                                            dayOfWeek: 2,
                                            startTime: '07:30',
                                            endTime: '09:00',
                                            startPeriod: 1,
                                            endPeriod: 2,
                                            sessionType: 'daytime',
                                        },
                                    ],
                                },
                            ],
                        },
                    ]);
                    return [4 /*yield*/, service.getAllSemestersWithSchedules('student-1')];
                case 1:
                    result = _a.sent();
                    expect(prisma.user.findUnique).toHaveBeenCalledWith({
                        where: { id: 'student-1' },
                        select: { role: true },
                    });
                    expect(prisma.semester.findMany).toHaveBeenCalledWith(expect.objectContaining({
                        orderBy: { startDate: 'desc' },
                    }));
                    expect(result).toEqual([
                        expect.objectContaining({
                            id: 'sem-1',
                            isCurrent: true,
                            sessions: [
                                expect.objectContaining({ id: 'schedule-1', dayOfWeek: 2 }),
                                expect.objectContaining({ id: 'schedule-2', dayOfWeek: 3 }),
                            ],
                        }),
                    ]);
                    return [2 /*return*/];
            }
        });
    }); });
    it('returns current semester schedule', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.user.findUnique.mockResolvedValue({ role: client_1.Role.student });
                    prisma.semester.findMany.mockResolvedValue([
                        {
                            id: 'sem-current',
                            name: 'HK2 2025-2026',
                            academicYear: '2025-2026',
                            term: 2,
                            startDate: new Date('2026-01-05'),
                            endDate: new Date('2026-05-30'),
                            isCurrent: true,
                            classSections: [],
                        },
                    ]);
                    return [4 /*yield*/, service.getCurrentSemesterSchedule('student-1')];
                case 1:
                    result = _a.sent();
                    expect(result.id).toBe('sem-current');
                    expect(prisma.semester.findMany).toHaveBeenCalledWith(expect.objectContaining({
                        orderBy: { startDate: 'desc' },
                    }));
                    return [2 /*return*/];
            }
        });
    }); });
    it('throws NotFoundException when current semester is missing', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.user.findUnique.mockResolvedValue({ role: client_1.Role.student });
                    prisma.semester.findMany.mockResolvedValue([]);
                    return [4 /*yield*/, expect(service.getCurrentSemesterSchedule('student-1')).rejects.toThrow(common_1.NotFoundException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('returns current semester schedule for admin', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.user.findUnique.mockResolvedValue({ role: client_1.Role.admin });
                    prisma.semester.findMany.mockResolvedValue([
                        {
                            id: 'sem-current',
                            name: 'HK2 2025-2026',
                            academicYear: '2025-2026',
                            term: 2,
                            startDate: new Date('2026-01-05'),
                            endDate: new Date('2026-05-30'),
                            isCurrent: true,
                        },
                    ]);
                    return [4 /*yield*/, service.getCurrentSemesterSchedule('admin-1')];
                case 1:
                    result = _a.sent();
                    expect(result).toMatchObject({
                        id: 'sem-current',
                        sessions: [],
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('returns lecturer schedules from class meetings', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    prisma.user.findUnique.mockResolvedValue({ role: client_1.Role.lecturer });
                    prisma.semester.findMany.mockResolvedValue([
                        {
                            id: 'sem-1',
                            name: 'HK2 2025-2026',
                            academicYear: '2025-2026',
                            term: 2,
                            startDate: new Date('2026-01-05'),
                            endDate: new Date('2026-05-30'),
                            isCurrent: true,
                            classSections: [
                                {
                                    classCode: 'SE346.Q22',
                                    sectionCode: 'Q22',
                                    note: 'IoT Lab',
                                    course: { code: 'SE346', name: 'IoT', credits: 4 },
                                    lecturer: { firstName: 'An', lastName: 'Nguyen' },
                                    meetings: [
                                        {
                                            id: 'meeting-1',
                                            dayOfWeek: 2,
                                            startTime: '07:30',
                                            endTime: '09:00',
                                            startPeriod: 1,
                                            endPeriod: 2,
                                            sessionType: 'daytime',
                                            room: 'E3.1',
                                            note: null,
                                        },
                                    ],
                                },
                            ],
                        },
                    ]);
                    return [4 /*yield*/, service.getAllSemestersWithSchedules('lecturer-1')];
                case 1:
                    result = _b.sent();
                    expect((_a = result[0]) === null || _a === void 0 ? void 0 : _a.sessions[0]).toMatchObject({
                        id: 'meeting-1',
                        classCode: 'SE346.Q22',
                        instructor: 'Nguyen An',
                        room: 'E3.1',
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('returns empty sessions for admin/super_admin', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.user.findUnique.mockResolvedValue({ role: client_1.Role.admin });
                    prisma.semester.findMany.mockResolvedValue([
                        {
                            id: 'sem-1',
                            name: 'HK2 2025-2026',
                            academicYear: '2025-2026',
                            term: 2,
                            startDate: new Date('2026-01-05'),
                            endDate: new Date('2026-05-30'),
                            isCurrent: true,
                        },
                    ]);
                    return [4 /*yield*/, service.getAllSemestersWithSchedules('admin-1')];
                case 1:
                    result = _a.sent();
                    expect(result[0]).toMatchObject({
                        id: 'sem-1',
                        sessions: [],
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('throws NotFoundException when user is missing', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.user.findUnique.mockResolvedValue(null);
                    return [4 /*yield*/, expect(service.getAllSemestersWithSchedules('missing-user')).rejects.toThrow(common_1.NotFoundException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('returns semester by id', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.user.findUnique.mockResolvedValue({ role: client_1.Role.student });
                    prisma.semester.findMany.mockResolvedValue([
                        {
                            id: 'sem-1',
                            name: 'HK2 2025-2026',
                            academicYear: '2025-2026',
                            term: 2,
                            startDate: new Date('2026-01-05'),
                            endDate: new Date('2026-05-30'),
                            isCurrent: true,
                            classSections: [],
                        },
                    ]);
                    return [4 /*yield*/, service.getSemesterScheduleById('student-1', 'sem-1')];
                case 1:
                    result = _a.sent();
                    expect(result.id).toBe('sem-1');
                    expect(prisma.semester.findMany).toHaveBeenCalledWith(expect.objectContaining({
                        orderBy: { startDate: 'desc' },
                    }));
                    return [2 /*return*/];
            }
        });
    }); });
    it('throws NotFoundException when semester id is missing', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.user.findUnique.mockResolvedValue({ role: client_1.Role.student });
                    prisma.semester.findMany.mockResolvedValue([]);
                    return [4 /*yield*/, expect(service.getSemesterScheduleById('student-1', 'missing')).rejects.toThrow(common_1.NotFoundException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
