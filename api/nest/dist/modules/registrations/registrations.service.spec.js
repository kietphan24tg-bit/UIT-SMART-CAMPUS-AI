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
var registrations_service_1 = require("./registrations.service");
describe('RegistrationsService', function () {
    var service;
    var prisma = {
        classSection: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        classEnrollment: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            upsert: jest.fn(),
            update: jest.fn(),
        },
        scheduleItem: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
        },
        $transaction: jest.fn(),
    };
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var moduleRef;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.clearAllMocks();
                    return [4 /*yield*/, testing_1.Test.createTestingModule({
                            providers: [
                                registrations_service_1.RegistrationsService,
                                {
                                    provide: prisma_service_1.PrismaService,
                                    useValue: prisma,
                                },
                            ],
                        }).compile()];
                case 1:
                    moduleRef = _a.sent();
                    service = moduleRef.get(registrations_service_1.RegistrationsService);
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects registration when class section is full', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.classSection.findUnique.mockResolvedValue({
                        id: 'section-1',
                        registrationOpen: true,
                        capacity: 1,
                        meetings: [],
                        _count: {
                            enrollments: 1,
                        },
                    });
                    prisma.classEnrollment.findUnique.mockResolvedValue(null);
                    return [4 /*yield*/, expect(service.register('student-1', 'section-1')).rejects.toBeInstanceOf(common_1.ConflictException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects registration when schedule conflicts with active enrollment', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.classSection.findUnique.mockResolvedValue({
                        id: 'section-1',
                        registrationOpen: true,
                        capacity: 40,
                        meetings: [
                            {
                                id: 'meeting-1',
                                dayOfWeek: 2,
                                startTime: '07:30',
                                endTime: '09:00',
                                room: 'B1.02',
                                startPeriod: 1,
                                endPeriod: 2,
                                sessionType: 'daytime',
                                note: null,
                            },
                        ],
                        _count: {
                            enrollments: 0,
                        },
                    });
                    prisma.classEnrollment.findUnique.mockResolvedValue(null);
                    prisma.classEnrollment.findMany.mockResolvedValue([
                        {
                            classSection: {
                                meetings: [
                                    {
                                        dayOfWeek: 2,
                                        startTime: '08:15',
                                        endTime: '09:45',
                                    },
                                ],
                            },
                        },
                    ]);
                    return [4 /*yield*/, expect(service.register('student-1', 'section-1')).rejects.toBeInstanceOf(common_1.ConflictException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('creates enrollment and synchronizes schedule items when registration succeeds', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meetings, tx;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    meetings = [
                        {
                            id: 'meeting-1',
                            dayOfWeek: 2,
                            room: 'B1.02',
                            startTime: '07:30',
                            endTime: '09:00',
                            startPeriod: 1,
                            endPeriod: 2,
                            sessionType: 'daytime',
                            note: null,
                        },
                    ];
                    prisma.classSection.findUnique.mockResolvedValue({
                        id: 'section-1',
                        classCode: 'SE346.Q11',
                        sectionCode: 'Q11',
                        note: null,
                        registrationOpen: true,
                        capacity: 40,
                        meetings: meetings,
                        _count: {
                            enrollments: 1,
                        },
                    });
                    prisma.classEnrollment.findUnique
                        .mockResolvedValueOnce(null)
                        .mockResolvedValueOnce({
                        id: 'enrollment-1',
                        status: client_1.EnrollmentStatus.active,
                        registeredAt: new Date('2026-04-25T01:00:00.000Z'),
                        droppedAt: null,
                        classSection: {
                            id: 'section-1',
                            classCode: 'SE346.Q11',
                            sectionCode: 'Q11',
                            note: null,
                            registrationOpen: true,
                            capacity: 40,
                            course: {
                                code: 'SE346',
                                name: 'Internet of Things',
                                credits: 4,
                            },
                            semester: {
                                id: 'sem-1',
                                name: 'HK2 2025-2026',
                                isCurrent: true,
                            },
                            lecturer: null,
                            meetings: meetings,
                            _count: {
                                enrollments: 2,
                            },
                        },
                    });
                    prisma.classEnrollment.findMany.mockResolvedValue([]);
                    tx = {
                        classEnrollment: {
                            upsert: jest.fn().mockResolvedValue({ id: 'enrollment-1' }),
                        },
                        scheduleItem: {
                            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
                            createMany: jest.fn().mockResolvedValue({ count: 1 }),
                        },
                    };
                    prisma.$transaction.mockImplementation(function (cb) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, cb(tx)];
                    }); }); });
                    return [4 /*yield*/, service.register('student-1', 'section-1')];
                case 1:
                    _a.sent();
                    expect(tx.classEnrollment.upsert).toHaveBeenCalledWith({
                        where: {
                            studentId_classSectionId: {
                                studentId: 'student-1',
                                classSectionId: 'section-1',
                            },
                        },
                        update: {
                            status: client_1.EnrollmentStatus.active,
                            registeredAt: expect.any(Date),
                            droppedAt: null,
                        },
                        create: {
                            studentId: 'student-1',
                            classSectionId: 'section-1',
                            status: client_1.EnrollmentStatus.active,
                        },
                    });
                    expect(tx.scheduleItem.deleteMany).toHaveBeenCalledWith({
                        where: {
                            userId: 'student-1',
                            classSectionId: 'section-1',
                        },
                    });
                    expect(tx.scheduleItem.createMany).toHaveBeenCalledWith({
                        data: [
                            expect.objectContaining({
                                userId: 'student-1',
                                classSectionId: 'section-1',
                                dayOfWeek: 2,
                                startTime: '07:30',
                                endTime: '09:00',
                            }),
                        ],
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('drops enrollment and removes schedule items for the class section', function () { return __awaiter(void 0, void 0, void 0, function () {
        var tx, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.classEnrollment.findFirst.mockResolvedValue({
                        id: 'enrollment-1',
                        studentId: 'student-1',
                        classSectionId: 'section-1',
                        status: client_1.EnrollmentStatus.active,
                    });
                    prisma.classEnrollment.findUnique.mockResolvedValue({
                        id: 'enrollment-1',
                        status: client_1.EnrollmentStatus.dropped,
                        registeredAt: new Date('2026-04-25T01:00:00.000Z'),
                        droppedAt: new Date('2026-04-25T02:00:00.000Z'),
                        classSection: {
                            id: 'section-1',
                            classCode: 'SE346.Q11',
                            sectionCode: 'Q11',
                            note: null,
                            registrationOpen: true,
                            capacity: 40,
                            course: {
                                code: 'SE346',
                                name: 'Internet of Things',
                                credits: 4,
                            },
                            semester: {
                                id: 'sem-1',
                                name: 'HK2 2025-2026',
                                isCurrent: true,
                            },
                            lecturer: null,
                            meetings: [],
                            _count: {
                                enrollments: 1,
                            },
                        },
                    });
                    tx = {
                        classEnrollment: {
                            update: jest.fn().mockResolvedValue({ id: 'enrollment-1' }),
                        },
                        scheduleItem: {
                            deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
                        },
                    };
                    prisma.$transaction.mockImplementation(function (cb) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, cb(tx)];
                    }); }); });
                    return [4 /*yield*/, service.drop('student-1', 'enrollment-1')];
                case 1:
                    result = _a.sent();
                    expect(tx.classEnrollment.update).toHaveBeenCalledWith({
                        where: { id: 'enrollment-1' },
                        data: {
                            status: client_1.EnrollmentStatus.dropped,
                            droppedAt: expect.any(Date),
                        },
                    });
                    expect(tx.scheduleItem.deleteMany).toHaveBeenCalledWith({
                        where: {
                            userId: 'student-1',
                            classSectionId: 'section-1',
                        },
                    });
                    expect(result).toMatchObject({
                        id: 'enrollment-1',
                        status: client_1.EnrollmentStatus.dropped,
                        classSection: {
                            id: 'section-1',
                        },
                    });
                    return [2 /*return*/];
            }
        });
    }); });
});
