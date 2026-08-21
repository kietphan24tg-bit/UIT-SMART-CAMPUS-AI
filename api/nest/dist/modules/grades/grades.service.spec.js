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
var testing_1 = require("@nestjs/testing");
var client_1 = require("@prisma/client");
var prisma_service_1 = require("../../database/prisma.service");
var notifications_service_1 = require("../notifications/notifications.service");
var grades_service_1 = require("./grades.service");
describe('GradesService', function () {
    var service;
    var prisma;
    var notificationsService;
    var mockGrades = [
        {
            id: 'g1',
            userId: 'user-1',
            courseId: 'c1',
            semesterId: 's1',
            midterm: 8,
            finalExam: 7,
            assignment: 9,
            totalScore: 7.8,
            letterGrade: null,
            gradePoint: 7.8,
            earnedCredits: 4,
            course: { code: 'SE346', name: 'IoT', credits: 4 },
            semester: {
                id: 's1',
                name: 'HK2 2024-2025',
                academicYear: '2024-2025',
                term: 2,
                startDate: new Date('2025-01-06T00:00:00.000Z'),
                endDate: new Date('2025-05-31T23:59:59.000Z'),
                isCurrent: false,
            },
        },
        {
            id: 'g2',
            userId: 'user-1',
            courseId: 'c2',
            semesterId: 's1',
            midterm: 9,
            finalExam: 9,
            assignment: 10,
            totalScore: 9.2,
            letterGrade: null,
            gradePoint: 9.2,
            earnedCredits: 3,
            course: { code: 'SE347', name: 'Mobile', credits: 3 },
            semester: {
                id: 's1',
                name: 'HK2 2024-2025',
                academicYear: '2024-2025',
                term: 2,
                startDate: new Date('2025-01-06T00:00:00.000Z'),
                endDate: new Date('2025-05-31T23:59:59.000Z'),
                isCurrent: false,
            },
        },
        {
            id: 'g3',
            userId: 'user-1',
            courseId: 'c3',
            semesterId: 's2',
            midterm: null,
            finalExam: null,
            assignment: null,
            totalScore: null,
            letterGrade: null,
            gradePoint: null,
            earnedCredits: 4,
            course: { code: 'ENG01', name: 'Anh van 1', credits: 4 },
            semester: {
                id: 's2',
                name: 'HK1 2024-2025',
                academicYear: '2024-2025',
                term: 1,
                startDate: new Date('2024-09-09T00:00:00.000Z'),
                endDate: new Date('2024-12-28T23:59:59.000Z'),
                isCurrent: false,
            },
        },
    ];
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var module;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, testing_1.Test.createTestingModule({
                        providers: [
                            grades_service_1.GradesService,
                            {
                                provide: prisma_service_1.PrismaService,
                                useValue: {
                                    $transaction: jest.fn(function (operations) { return Promise.all(operations); }),
                                    classSection: {
                                        findMany: jest.fn(),
                                        findUnique: jest.fn(),
                                        update: jest.fn(),
                                    },
                                    classEnrollment: { findMany: jest.fn() },
                                    grade: {
                                        count: jest.fn(),
                                        findMany: jest.fn(),
                                        update: jest.fn(),
                                        upsert: jest.fn(),
                                    },
                                },
                            },
                            {
                                provide: notifications_service_1.NotificationsService,
                                useValue: {
                                    createNotificationsForUsers: jest.fn(),
                                },
                            },
                        ],
                    }).compile()];
                case 1:
                    module = _a.sent();
                    service = module.get(grades_service_1.GradesService);
                    prisma = module.get(prisma_service_1.PrismaService);
                    notificationsService = module.get(notifications_service_1.NotificationsService);
                    return [2 /*return*/];
            }
        });
    }); });
    describe('getAllSemesterGrades', function () {
        it('should return all semester grades of the current user', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        prisma.grade.findMany.mockResolvedValue(mockGrades);
                        return [4 /*yield*/, service.getAllSemesterGrades('user-1')];
                    case 1:
                        result = _e.sent();
                        expect(prisma.grade.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1' } }));
                        expect(result).toHaveLength(2);
                        expect(result[0]).toMatchObject({
                            id: 's1',
                            name: 'HK2 2024-2025',
                            summary: {
                                gpa: 8.4,
                                totalCredits: 7,
                                totalEarnedCredits: 7,
                                totalCourses: 2,
                                totalSemesters: 1,
                            },
                        });
                        expect((_b = (_a = result[0]) === null || _a === void 0 ? void 0 : _a.grades[0]) === null || _b === void 0 ? void 0 : _b.course.code).toBe('SE346');
                        expect((_d = (_c = result[0]) === null || _c === void 0 ? void 0 : _c.grades[1]) === null || _d === void 0 ? void 0 : _d.course.code).toBe('SE347');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getGradesSummary', function () {
        it('should return cumulative summary across semesters', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.grade.findMany.mockResolvedValue(mockGrades);
                        return [4 /*yield*/, service.getGradesSummary('user-1')];
                    case 1:
                        result = _a.sent();
                        expect(result).toEqual({
                            gpa: 8.4,
                            totalCredits: 7,
                            totalEarnedCredits: 11,
                            totalCourses: 2,
                            totalSemesters: 2,
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return zero summary when no grades exist', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.grade.findMany.mockResolvedValue([]);
                        return [4 /*yield*/, service.getGradesSummary('user-1')];
                    case 1:
                        result = _a.sent();
                        expect(result).toEqual({
                            gpa: 0,
                            totalCredits: 0,
                            totalEarnedCredits: 0,
                            totalCourses: 0,
                            totalSemesters: 0,
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getCurrentSemesterGrades', function () {
        it('should return the semester marked as current', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.grade.findMany.mockResolvedValue([
                            __assign(__assign({}, mockGrades[0]), { semester: __assign(__assign({}, mockGrades[0].semester), { isCurrent: true }) }),
                            __assign(__assign({}, mockGrades[1]), { semester: __assign(__assign({}, mockGrades[1].semester), { isCurrent: true }) }),
                            mockGrades[2],
                        ]);
                        return [4 /*yield*/, service.getCurrentSemesterGrades('user-1')];
                    case 1:
                        result = _a.sent();
                        expect(result.id).toBe('s1');
                        expect(result.isCurrent).toBe(true);
                        expect(result.summary.totalSemesters).toBe(1);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should fallback to the newest semester when no semester is current', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.grade.findMany.mockResolvedValue(mockGrades);
                        return [4 /*yield*/, service.getCurrentSemesterGrades('user-1')];
                    case 1:
                        result = _a.sent();
                        expect(result.id).toBe('s1');
                        expect(result.name).toBe('HK2 2024-2025');
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return an empty payload when the user has no grades', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.grade.findMany.mockResolvedValue([]);
                        return [4 /*yield*/, service.getCurrentSemesterGrades('user-1')];
                    case 1:
                        result = _a.sent();
                        expect(result).toEqual({
                            id: '',
                            name: '',
                            academicYear: '',
                            term: 0,
                            startDate: '',
                            endDate: '',
                            isCurrent: false,
                            summary: {
                                gpa: 0,
                                totalCredits: 0,
                                totalEarnedCredits: 0,
                                totalCourses: 0,
                                totalSemesters: 0,
                            },
                            grades: [],
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should include current active enrollments even before grades are entered', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.grade.findMany.mockResolvedValue([]);
                        prisma.classEnrollment.findMany.mockResolvedValue([
                            {
                                id: 'enrollment-1',
                                studentId: 'user-1',
                                classSectionId: 'section-1',
                                classSection: {
                                    id: 'section-1',
                                    classCode: 'SE346.Q21',
                                    sectionCode: 'Q21',
                                    courseId: 'course-1',
                                    semesterId: 'semester-current',
                                    course: { code: 'SE346', name: 'Mobile', credits: 4 },
                                    semester: {
                                        id: 'semester-current',
                                        name: 'HK2 2025-2026',
                                        academicYear: '2025-2026',
                                        term: 2,
                                        startDate: new Date('2026-01-05T00:00:00.000Z'),
                                        endDate: new Date('2026-05-31T23:59:59.000Z'),
                                        isCurrent: true,
                                    },
                                },
                            },
                        ]);
                        return [4 /*yield*/, service.getCurrentSemesterGrades('user-1')];
                    case 1:
                        result = _a.sent();
                        expect(result).toMatchObject({
                            id: 'semester-current',
                            isCurrent: true,
                            summary: {
                                gpa: 0,
                                totalCredits: 0,
                                totalEarnedCredits: 0,
                                totalCourses: 0,
                                totalSemesters: 1,
                            },
                            grades: [
                                {
                                    id: 'enrollment-enrollment-1',
                                    totalScore: null,
                                    course: { code: 'SE346', name: 'Mobile', credits: 4 },
                                    classSection: {
                                        id: 'section-1',
                                        classCode: 'SE346.Q21',
                                        sectionCode: 'Q21',
                                    },
                                },
                            ],
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should hide current semester grade rows that do not match active enrollments', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        prisma.grade.findMany.mockResolvedValue([
                            {
                                id: 'mock-grade',
                                userId: 'user-1',
                                courseId: 'mock-course',
                                semesterId: 'semester-current',
                                midterm: 9,
                                finalExam: 9,
                                assignment: 9,
                                processScore: 9,
                                practiceScore: null,
                                midtermScore: 9,
                                finalScore: 9,
                                totalScore: 9,
                                letterGrade: null,
                                gradePoint: 9,
                                earnedCredits: 3,
                                course: { code: 'AI301', name: 'Mock AI', credits: 3 },
                                semester: {
                                    id: 'semester-current',
                                    name: 'HK2 2025-2026',
                                    academicYear: '2025-2026',
                                    term: 2,
                                    startDate: new Date('2026-01-05T00:00:00.000Z'),
                                    endDate: new Date('2026-05-31T23:59:59.000Z'),
                                    isCurrent: true,
                                },
                            },
                            {
                                id: 'real-grade',
                                userId: 'user-1',
                                courseId: 'real-course',
                                semesterId: 'semester-current',
                                midterm: 8,
                                finalExam: 8,
                                assignment: 8,
                                processScore: 8,
                                practiceScore: null,
                                midtermScore: 8,
                                finalScore: 8,
                                totalScore: 8,
                                letterGrade: null,
                                gradePoint: 8,
                                earnedCredits: 4,
                                course: { code: 'SE346', name: 'Mobile', credits: 4 },
                                semester: {
                                    id: 'semester-current',
                                    name: 'HK2 2025-2026',
                                    academicYear: '2025-2026',
                                    term: 2,
                                    startDate: new Date('2026-01-05T00:00:00.000Z'),
                                    endDate: new Date('2026-05-31T23:59:59.000Z'),
                                    isCurrent: true,
                                },
                            },
                        ]);
                        prisma.classEnrollment.findMany.mockResolvedValue([
                            {
                                id: 'enrollment-1',
                                studentId: 'user-1',
                                classSectionId: 'section-1',
                                classSection: {
                                    id: 'section-1',
                                    classCode: 'SE346.Q21',
                                    sectionCode: 'Q21',
                                    courseId: 'real-course',
                                    semesterId: 'semester-current',
                                    course: { code: 'SE346', name: 'Mobile', credits: 4 },
                                    semester: {
                                        id: 'semester-current',
                                        name: 'HK2 2025-2026',
                                        academicYear: '2025-2026',
                                        term: 2,
                                        startDate: new Date('2026-01-05T00:00:00.000Z'),
                                        endDate: new Date('2026-05-31T23:59:59.000Z'),
                                        isCurrent: true,
                                    },
                                },
                            },
                        ]);
                        return [4 /*yield*/, service.getCurrentSemesterGrades('user-1')];
                    case 1:
                        result = _b.sent();
                        expect(result.grades).toHaveLength(1);
                        expect((_a = result.grades[0]) === null || _a === void 0 ? void 0 : _a.course.code).toBe('SE346');
                        expect(result.summary).toMatchObject({
                            gpa: 8,
                            totalCredits: 4,
                            totalEarnedCredits: 4,
                            totalCourses: 1,
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getSemesterGradesById', function () {
        it('should return a specific semester by id', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.grade.findMany.mockResolvedValue(mockGrades);
                        return [4 /*yield*/, service.getSemesterGradesById('user-1', 's1')];
                    case 1:
                        result = _a.sent();
                        expect(result).toMatchObject({
                            id: 's1',
                            name: 'HK2 2024-2025',
                        });
                        expect(result.summary.totalSemesters).toBe(1);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw NotFoundException when semester grades are not found', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.grade.findMany.mockResolvedValue(mockGrades);
                        return [4 /*yield*/, expect(service.getSemesterGradesById('user-1', 'missing')).rejects.toThrow(common_1.NotFoundException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('lecturer grade entry', function () {
        var classSection = {
            id: 'section-1',
            semesterId: 'semester-1',
            courseId: 'course-1',
            lecturerId: 'lecturer-1',
            classCode: 'SE346.Q21',
            sectionCode: 'Q21',
            note: null,
            capacity: 40,
            registrationOpen: true,
            processWeight: 20,
            practiceWeight: 20,
            midtermWeight: 20,
            finalWeight: 40,
            createdAt: new Date(),
            updatedAt: new Date(),
            course: { id: 'course-1', code: 'SE346', name: 'Mobile', credits: 4 },
            semester: {
                id: 'semester-1',
                name: 'HK2 2025-2026',
                academicYear: '2025-2026',
                term: 2,
                isCurrent: true,
            },
        };
        it('rejects a lecturer who is not assigned to the class section', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.classSection.findUnique.mockResolvedValue(__assign(__assign({}, classSection), { lecturerId: 'other-lecturer' }));
                        return [4 /*yield*/, expect(service.getClassSectionGradeSheet('section-1', 'lecturer-1', client_1.Role.lecturer)).rejects.toThrow(common_1.ForbiddenException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('rejects grade weights that do not sum to 100', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(service.updateClassSectionGradeWeights('section-1', 'lecturer-1', client_1.Role.lecturer, {
                            processWeight: 25,
                            practiceWeight: 25,
                            midtermWeight: 25,
                            finalWeight: 20,
                        })).rejects.toThrow(common_1.BadRequestException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('rejects grade sheet rows for students outside the class section', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.classSection.findUnique.mockResolvedValue(classSection);
                        prisma.classEnrollment.findMany.mockResolvedValue([
                            { studentId: 'student-1' },
                        ]);
                        return [4 /*yield*/, expect(service.upsertClassSectionGradeSheet('section-1', 'lecturer-1', client_1.Role.lecturer, {
                                rows: [
                                    {
                                        studentId: 'student-2',
                                        processScore: 8,
                                        practiceScore: 8,
                                        midtermScore: 8,
                                        finalScore: 8,
                                    },
                                ],
                            })).rejects.toThrow(common_1.BadRequestException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('bulk upserts grades and calculates weighted total score', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.classSection.findUnique
                            .mockResolvedValueOnce(classSection)
                            .mockResolvedValueOnce(classSection);
                        prisma.classEnrollment.findMany
                            .mockResolvedValueOnce([{ studentId: 'student-1' }])
                            .mockResolvedValueOnce([
                            {
                                studentId: 'student-1',
                                student: {
                                    id: 'student-1',
                                    email: 'student@uit.edu.vn',
                                    firstName: 'An',
                                    lastName: 'Nguyen',
                                    studentId: '21520001',
                                },
                            },
                        ]);
                        prisma.grade.findMany.mockResolvedValue([
                            {
                                id: 'grade-1',
                                userId: 'student-1',
                                processScore: 8,
                                practiceScore: 9,
                                midtermScore: 7,
                                finalScore: 8,
                                assignment: 8,
                                midterm: 7,
                                finalExam: 8,
                                totalScore: 8,
                                letterGrade: null,
                                gradePoint: 8,
                                earnedCredits: 4,
                            },
                        ]);
                        prisma.grade.upsert.mockResolvedValue({ id: 'grade-1' });
                        return [4 /*yield*/, service.upsertClassSectionGradeSheet('section-1', 'lecturer-1', client_1.Role.lecturer, {
                                rows: [
                                    {
                                        studentId: 'student-1',
                                        processScore: 8,
                                        practiceScore: 9,
                                        midtermScore: 7,
                                        finalScore: 8,
                                    },
                                ],
                            })];
                    case 1:
                        _a.sent();
                        expect(prisma.grade.upsert).toHaveBeenCalledWith(expect.objectContaining({
                            update: expect.objectContaining({
                                processScore: 8,
                                practiceScore: 9,
                                midtermScore: 7,
                                finalScore: 8,
                                totalScore: 8,
                                earnedCredits: 4,
                            }),
                        }));
                        return [2 /*return*/];
                }
            });
        }); });
        it('notifies a student when a grade row becomes complete', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.classSection.findUnique
                            .mockResolvedValueOnce(classSection)
                            .mockResolvedValueOnce(classSection);
                        prisma.classEnrollment.findMany
                            .mockResolvedValueOnce([{ studentId: 'student-1' }])
                            .mockResolvedValueOnce([
                            {
                                studentId: 'student-1',
                                student: {
                                    id: 'student-1',
                                    email: 'student@uit.edu.vn',
                                    firstName: 'An',
                                    lastName: 'Nguyen',
                                    studentId: '21520001',
                                },
                            },
                        ]);
                        prisma.grade.findMany
                            .mockResolvedValueOnce([
                            {
                                id: 'grade-1',
                                userId: 'student-1',
                                totalScore: null,
                            },
                        ])
                            .mockResolvedValueOnce([
                            {
                                id: 'grade-1',
                                userId: 'student-1',
                                processScore: 8,
                                practiceScore: 9,
                                midtermScore: 7,
                                finalScore: 8,
                                assignment: 8,
                                midterm: 7,
                                finalExam: 8,
                                totalScore: 8,
                                letterGrade: null,
                                gradePoint: 8,
                                earnedCredits: 4,
                            },
                        ]);
                        prisma.grade.upsert.mockResolvedValue({ id: 'grade-1' });
                        notificationsService.createNotificationsForUsers.mockResolvedValue({
                            count: 1,
                        });
                        return [4 /*yield*/, service.upsertClassSectionGradeSheet('section-1', 'lecturer-1', client_1.Role.lecturer, {
                                rows: [
                                    {
                                        studentId: 'student-1',
                                        processScore: 8,
                                        practiceScore: 9,
                                        midtermScore: 7,
                                        finalScore: 8,
                                    },
                                ],
                            })];
                    case 1:
                        _a.sent();
                        expect(notificationsService.createNotificationsForUsers).toHaveBeenCalledWith(expect.objectContaining({
                            userIds: ['student-1'],
                            type: 'grade_published',
                            data: expect.objectContaining({
                                classSectionId: 'section-1',
                                courseCode: 'SE346',
                                courseName: 'Mobile',
                                semesterId: 'semester-1',
                                gradeId: 'grade-1',
                                totalScore: 8,
                            }),
                        }));
                        return [2 /*return*/];
                }
            });
        }); });
        it('does not notify when a grade row is still incomplete', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.classSection.findUnique
                            .mockResolvedValueOnce(classSection)
                            .mockResolvedValueOnce(classSection);
                        prisma.classEnrollment.findMany
                            .mockResolvedValueOnce([{ studentId: 'student-1' }])
                            .mockResolvedValueOnce([]);
                        prisma.grade.findMany.mockResolvedValue([]);
                        prisma.grade.upsert.mockResolvedValue({ id: 'grade-1' });
                        return [4 /*yield*/, service.upsertClassSectionGradeSheet('section-1', 'lecturer-1', client_1.Role.lecturer, {
                                rows: [
                                    {
                                        studentId: 'student-1',
                                        processScore: 8,
                                        practiceScore: null,
                                        midtermScore: 7,
                                        finalScore: 8,
                                    },
                                ],
                            })];
                    case 1:
                        _a.sent();
                        expect(notificationsService.createNotificationsForUsers).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('does not notify when the complete total score did not change', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.classSection.findUnique
                            .mockResolvedValueOnce(classSection)
                            .mockResolvedValueOnce(classSection);
                        prisma.classEnrollment.findMany
                            .mockResolvedValueOnce([{ studentId: 'student-1' }])
                            .mockResolvedValueOnce([]);
                        prisma.grade.findMany.mockResolvedValue([
                            {
                                id: 'grade-1',
                                userId: 'student-1',
                                totalScore: 8,
                            },
                        ]);
                        prisma.grade.upsert.mockResolvedValue({ id: 'grade-1' });
                        return [4 /*yield*/, service.upsertClassSectionGradeSheet('section-1', 'lecturer-1', client_1.Role.lecturer, {
                                rows: [
                                    {
                                        studentId: 'student-1',
                                        processScore: 8,
                                        practiceScore: 9,
                                        midtermScore: 7,
                                        finalScore: 8,
                                    },
                                ],
                            })];
                    case 1:
                        _a.sent();
                        expect(notificationsService.createNotificationsForUsers).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
