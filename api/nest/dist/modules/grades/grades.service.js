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
exports.GradesService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var GradesService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var GradesService = _classThis = /** @class */ (function () {
        function GradesService_1(prisma, notificationsService) {
            this.prisma = prisma;
            this.notificationsService = notificationsService;
            this.defaultWeights = {
                processWeight: 20,
                practiceWeight: 20,
                midtermWeight: 20,
                finalWeight: 40,
            };
        }
        GradesService_1.prototype.emptySummary = function (totalSemesters) {
            if (totalSemesters === void 0) { totalSemesters = 0; }
            return {
                gpa: 0,
                totalCredits: 0,
                totalEarnedCredits: 0,
                totalCourses: 0,
                totalSemesters: totalSemesters,
            };
        };
        GradesService_1.prototype.buildSummary = function (grades) {
            var gradedCourses = grades.filter(function (grade) { return grade.totalScore !== null; });
            var totalCredits = gradedCourses.reduce(function (sum, grade) { return sum + grade.course.credits; }, 0);
            var totalPoints = gradedCourses.reduce(function (sum, grade) { var _a; return sum + ((_a = grade.totalScore) !== null && _a !== void 0 ? _a : 0) * grade.course.credits; }, 0);
            var totalEarnedCredits = grades.reduce(function (sum, grade) {
                var _a;
                return sum +
                    ((_a = grade.earnedCredits) !== null && _a !== void 0 ? _a : (grade.totalScore !== null && grade.totalScore >= 5 ? grade.course.credits : 0));
            }, 0);
            return {
                gpa: totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0,
                totalCredits: totalCredits,
                totalEarnedCredits: totalEarnedCredits,
                totalCourses: gradedCourses.length,
                totalSemesters: 1,
            };
        };
        GradesService_1.prototype.buildGradeKey = function (courseId, semesterId) {
            return "".concat(semesterId, ":").concat(courseId);
        };
        GradesService_1.prototype.normalizeGradeRecord = function (grade, enrollment) {
            var _a, _b, _c, _d;
            var processScore = (_a = grade.processScore) !== null && _a !== void 0 ? _a : grade.assignment;
            var midtermScore = (_b = grade.midtermScore) !== null && _b !== void 0 ? _b : grade.midterm;
            var finalScore = (_c = grade.finalScore) !== null && _c !== void 0 ? _c : grade.finalExam;
            return __assign({ id: grade.id, midterm: midtermScore, finalExam: finalScore, assignment: processScore, processScore: processScore, practiceScore: (_d = grade.practiceScore) !== null && _d !== void 0 ? _d : null, midtermScore: midtermScore, finalScore: finalScore, totalScore: grade.totalScore, letterGrade: grade.letterGrade, gradePoint: grade.gradePoint, isExempt: grade.isExempt, earnedCredits: grade.earnedCredits, course: grade.course }, (enrollment
                ? {
                    classSection: {
                        id: enrollment.classSection.id,
                        classCode: enrollment.classSection.classCode,
                        sectionCode: enrollment.classSection.sectionCode,
                    },
                }
                : {}));
        };
        GradesService_1.prototype.normalizeEnrollmentPlaceholder = function (enrollment) {
            return {
                id: "enrollment-".concat(enrollment.id),
                midterm: null,
                finalExam: null,
                assignment: null,
                processScore: null,
                practiceScore: null,
                midtermScore: null,
                finalScore: null,
                totalScore: null,
                letterGrade: null,
                gradePoint: null,
                isExempt: false,
                earnedCredits: 0,
                course: enrollment.classSection.course,
                classSection: {
                    id: enrollment.classSection.id,
                    classCode: enrollment.classSection.classCode,
                    sectionCode: enrollment.classSection.sectionCode,
                },
            };
        };
        GradesService_1.prototype.loadGrades = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.grade.findMany({
                            where: { userId: userId },
                            include: {
                                course: { select: { code: true, name: true, credits: true } },
                                semester: {
                                    select: {
                                        id: true,
                                        name: true,
                                        academicYear: true,
                                        term: true,
                                        startDate: true,
                                        endDate: true,
                                        isCurrent: true,
                                    },
                                },
                            },
                            orderBy: [{ semester: { startDate: 'desc' } }, { course: { code: 'asc' } }],
                        })];
                });
            });
        };
        GradesService_1.prototype.loadActiveEnrollments = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var enrollments;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.classEnrollment.findMany({
                                where: { studentId: userId, status: client_1.EnrollmentStatus.active },
                                include: {
                                    classSection: {
                                        include: {
                                            course: { select: { code: true, name: true, credits: true } },
                                            semester: {
                                                select: {
                                                    id: true,
                                                    name: true,
                                                    academicYear: true,
                                                    term: true,
                                                    startDate: true,
                                                    endDate: true,
                                                    isCurrent: true,
                                                },
                                            },
                                        },
                                    },
                                },
                                orderBy: [
                                    { classSection: { semester: { startDate: 'desc' } } },
                                    { classSection: { course: { code: 'asc' } } },
                                ],
                            })];
                        case 1:
                            enrollments = _a.sent();
                            return [2 /*return*/, enrollments !== null && enrollments !== void 0 ? enrollments : []];
                    }
                });
            });
        };
        GradesService_1.prototype.groupSemesterGrades = function (grades, enrollments) {
            var _this = this;
            if (enrollments === void 0) { enrollments = []; }
            var semestersMap = new Map();
            for (var _i = 0, grades_1 = grades; _i < grades_1.length; _i++) {
                var grade = grades_1[_i];
                var existing = semestersMap.get(grade.semester.id);
                if (existing) {
                    existing.grades.push(grade);
                    continue;
                }
                semestersMap.set(grade.semester.id, {
                    semester: grade.semester,
                    grades: [grade],
                    enrollments: [],
                });
            }
            for (var _a = 0, enrollments_1 = enrollments; _a < enrollments_1.length; _a++) {
                var enrollment = enrollments_1[_a];
                var semester = enrollment.classSection.semester;
                var existing = semestersMap.get(semester.id);
                if (existing) {
                    existing.enrollments.push(enrollment);
                    continue;
                }
                semestersMap.set(semester.id, {
                    semester: semester,
                    grades: [],
                    enrollments: [enrollment],
                });
            }
            return __spreadArray([], semestersMap.values(), true).map(function (entry) {
                var enrollmentByGradeKey = new Map(entry.enrollments.map(function (enrollment) { return [
                    _this.buildGradeKey(enrollment.classSection.courseId, enrollment.classSection.semesterId),
                    enrollment,
                ]; }));
                var effectiveGrades = entry.semester.isCurrent && enrollmentByGradeKey.size > 0
                    ? entry.grades.filter(function (grade) {
                        return enrollmentByGradeKey.has(_this.buildGradeKey(grade.courseId, grade.semesterId));
                    })
                    : entry.grades;
                var gradeKeys = new Set(effectiveGrades.map(function (grade) { return _this.buildGradeKey(grade.courseId, grade.semesterId); }));
                var enrollmentPlaceholders = entry.enrollments.filter(function (enrollment) {
                    return !gradeKeys.has(_this.buildGradeKey(enrollment.classSection.courseId, enrollment.classSection.semesterId));
                });
                return {
                    id: entry.semester.id,
                    name: entry.semester.name,
                    academicYear: entry.semester.academicYear,
                    term: entry.semester.term,
                    startDate: entry.semester.startDate,
                    endDate: entry.semester.endDate,
                    isCurrent: entry.semester.isCurrent,
                    summary: _this.buildSummary(effectiveGrades),
                    grades: __spreadArray(__spreadArray([], effectiveGrades.map(function (grade) {
                        return _this.normalizeGradeRecord(grade, enrollmentByGradeKey.get(_this.buildGradeKey(grade.courseId, grade.semesterId)));
                    }), true), enrollmentPlaceholders.map(function (enrollment) {
                        return _this.normalizeEnrollmentPlaceholder(enrollment);
                    }), true).sort(function (left, right) { return left.course.code.localeCompare(right.course.code); }),
                };
            })
                .sort(function (left, right) { return right.startDate.getTime() - left.startDate.getTime(); });
        };
        GradesService_1.prototype.filterCurrentGradesByEnrollments = function (grades, enrollments) {
            var _this = this;
            var currentEnrollmentKeys = new Set(enrollments
                .filter(function (enrollment) { return enrollment.classSection.semester.isCurrent; })
                .map(function (enrollment) {
                return _this.buildGradeKey(enrollment.classSection.courseId, enrollment.classSection.semesterId);
            }));
            if (currentEnrollmentKeys.size === 0) {
                return grades;
            }
            return grades.filter(function (grade) {
                return !grade.semester.isCurrent ||
                    currentEnrollmentKeys.has(_this.buildGradeKey(grade.courseId, grade.semesterId));
            });
        };
        GradesService_1.prototype.canManageAllGrades = function (role) {
            return false;
        };
        GradesService_1.prototype.assertCanManageGrades = function (role) {
            if (role !== client_1.Role.lecturer) {
                throw new common_1.ForbiddenException('You are not allowed to manage grades');
            }
        };
        GradesService_1.prototype.assertWeightsValid = function (weights) {
            var total = weights.processWeight + weights.practiceWeight + weights.midtermWeight + weights.finalWeight;
            if (total !== 100) {
                throw new common_1.BadRequestException('Grade weights must sum to 100');
            }
        };
        GradesService_1.prototype.loadClassSectionForGradeAccess = function (classSectionId, actorId, actorRole) {
            return __awaiter(this, void 0, void 0, function () {
                var classSection;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.assertCanManageGrades(actorRole);
                            return [4 /*yield*/, this.prisma.classSection.findUnique({
                                    where: { id: classSectionId },
                                    include: {
                                        course: { select: { id: true, code: true, name: true, credits: true } },
                                        semester: {
                                            select: {
                                                id: true,
                                                name: true,
                                                academicYear: true,
                                                term: true,
                                                isCurrent: true,
                                            },
                                        },
                                    },
                                })];
                        case 1:
                            classSection = _a.sent();
                            if (!classSection) {
                                throw new common_1.NotFoundException('Class section not found');
                            }
                            if (!this.canManageAllGrades(actorRole) &&
                                (!classSection.lecturerId || classSection.lecturerId !== actorId)) {
                                throw new common_1.ForbiddenException('You are not assigned to this class section');
                            }
                            return [2 /*return*/, classSection];
                    }
                });
            });
        };
        GradesService_1.prototype.calculateTotalScore = function (row, weights) {
            var weightedParts = [
                { score: row.processScore, weight: weights.processWeight },
                { score: row.practiceScore, weight: weights.practiceWeight },
                { score: row.midtermScore, weight: weights.midtermWeight },
                { score: row.finalScore, weight: weights.finalWeight },
            ];
            if (weightedParts.some(function (part) { return part.weight > 0 && part.score == null; })) {
                return null;
            }
            var total = weightedParts.reduce(function (sum, part) { var _a; return sum + ((_a = part.score) !== null && _a !== void 0 ? _a : 0) * part.weight; }, 0);
            return Math.round((total / 100) * 10) / 10;
        };
        GradesService_1.prototype.shouldNotifyGradePublished = function (previousTotalScore, nextTotalScore) {
            return nextTotalScore !== null && previousTotalScore !== nextTotalScore;
        };
        GradesService_1.prototype.notifyPublishedGrades = function (classSection, rows) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!this.notificationsService || rows.length === 0) {
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, Promise.all(rows.map(function (row) {
                                    return _this.notificationsService.createNotificationsForUsers({
                                        userIds: [row.studentId],
                                        title: "\u0110i\u1EC3m ".concat(classSection.course.code, " \u0111\u00E3 \u0111\u01B0\u1EE3c c\u1EADp nh\u1EADt"),
                                        body: "".concat(classSection.course.name, ": \u0111i\u1EC3m t\u1ED5ng k\u1EBFt ").concat(row.totalScore, "."),
                                        type: 'grade_published',
                                        data: {
                                            classSectionId: classSection.id,
                                            classCode: classSection.classCode,
                                            courseCode: classSection.course.code,
                                            courseName: classSection.course.name,
                                            semesterId: classSection.semester.id,
                                            gradeId: row.gradeId,
                                            totalScore: row.totalScore,
                                        },
                                    });
                                }))];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        GradesService_1.prototype.getAllSemesterGrades = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, grades, enrollments;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.loadGrades(userId),
                                this.loadActiveEnrollments(userId),
                            ])];
                        case 1:
                            _a = _b.sent(), grades = _a[0], enrollments = _a[1];
                            return [2 /*return*/, this.groupSemesterGrades(grades, enrollments)];
                    }
                });
            });
        };
        GradesService_1.prototype.getGradesSummary = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, grades, enrollments, groupedSemesters, effectiveGrades;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.loadGrades(userId),
                                this.loadActiveEnrollments(userId),
                            ])];
                        case 1:
                            _a = _b.sent(), grades = _a[0], enrollments = _a[1];
                            if (grades.length === 0 && enrollments.length === 0) {
                                return [2 /*return*/, this.emptySummary(0)];
                            }
                            groupedSemesters = this.groupSemesterGrades(grades, enrollments);
                            effectiveGrades = this.filterCurrentGradesByEnrollments(grades, enrollments);
                            return [2 /*return*/, __assign(__assign({}, this.buildSummary(effectiveGrades)), { totalSemesters: groupedSemesters.length })];
                    }
                });
            });
        };
        GradesService_1.prototype.getCurrentSemesterGrades = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, grades, enrollments, semesters, currentSemester;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.loadGrades(userId),
                                this.loadActiveEnrollments(userId),
                            ])];
                        case 1:
                            _a = _c.sent(), grades = _a[0], enrollments = _a[1];
                            semesters = this.groupSemesterGrades(grades, enrollments);
                            if (semesters.length === 0) {
                                return [2 /*return*/, {
                                        id: '',
                                        name: '',
                                        academicYear: '',
                                        term: 0,
                                        startDate: '',
                                        endDate: '',
                                        isCurrent: false,
                                        summary: this.emptySummary(0),
                                        grades: [],
                                    }];
                            }
                            currentSemester = (_b = semesters.find(function (semester) { return semester.isCurrent; })) !== null && _b !== void 0 ? _b : semesters[0];
                            return [2 /*return*/, __assign(__assign({}, currentSemester), { summary: __assign(__assign({}, currentSemester.summary), { totalSemesters: 1 }) })];
                    }
                });
            });
        };
        GradesService_1.prototype.getSemesterGradesById = function (userId, semesterId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, grades, enrollments, semesters, semester;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.loadGrades(userId),
                                this.loadActiveEnrollments(userId),
                            ])];
                        case 1:
                            _a = _b.sent(), grades = _a[0], enrollments = _a[1];
                            semesters = this.groupSemesterGrades(grades, enrollments);
                            semester = semesters.find(function (entry) { return entry.id === semesterId; });
                            if (!semester) {
                                throw new common_1.NotFoundException('Semester grades not found');
                            }
                            return [2 /*return*/, __assign(__assign({}, semester), { summary: __assign(__assign({}, semester.summary), { totalSemesters: 1 }) })];
                    }
                });
            });
        };
        GradesService_1.prototype.getLecturerClassSections = function (actorId, actorRole) {
            return __awaiter(this, void 0, void 0, function () {
                var sections;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.assertCanManageGrades(actorRole);
                            return [4 /*yield*/, this.prisma.classSection.findMany({
                                    where: this.canManageAllGrades(actorRole) ? undefined : { lecturerId: actorId },
                                    include: {
                                        course: { select: { id: true, code: true, name: true, credits: true } },
                                        semester: {
                                            select: {
                                                id: true,
                                                name: true,
                                                academicYear: true,
                                                term: true,
                                                isCurrent: true,
                                            },
                                        },
                                        meetings: {
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
                            return [2 /*return*/, Promise.all(sections.map(function (section) { return __awaiter(_this, void 0, void 0, function () {
                                    var activeEnrollments, studentIds, completedCount, _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0: return [4 /*yield*/, this.prisma.classEnrollment.findMany({
                                                    where: { classSectionId: section.id, status: client_1.EnrollmentStatus.active },
                                                    select: { studentId: true },
                                                })];
                                            case 1:
                                                activeEnrollments = _b.sent();
                                                studentIds = activeEnrollments.map(function (item) { return item.studentId; });
                                                if (!(studentIds.length === 0)) return [3 /*break*/, 2];
                                                _a = 0;
                                                return [3 /*break*/, 4];
                                            case 2: return [4 /*yield*/, this.prisma.grade.count({
                                                    where: {
                                                        userId: { in: studentIds },
                                                        courseId: section.courseId,
                                                        semesterId: section.semesterId,
                                                        totalScore: { not: null },
                                                    },
                                                })];
                                            case 3:
                                                _a = _b.sent();
                                                _b.label = 4;
                                            case 4:
                                                completedCount = _a;
                                                return [2 /*return*/, {
                                                        id: section.id,
                                                        classCode: section.classCode,
                                                        sectionCode: section.sectionCode,
                                                        note: section.note,
                                                        capacity: section.capacity,
                                                        enrolledCount: section._count.enrollments,
                                                        gradedCount: completedCount,
                                                        gradingStatus: section._count.enrollments > 0 && completedCount >= section._count.enrollments
                                                            ? 'complete'
                                                            : 'incomplete',
                                                        weights: {
                                                            processWeight: section.processWeight,
                                                            practiceWeight: section.practiceWeight,
                                                            midtermWeight: section.midtermWeight,
                                                            finalWeight: section.finalWeight,
                                                        },
                                                        course: section.course,
                                                        semester: section.semester,
                                                        meetings: section.meetings,
                                                    }];
                                        }
                                    });
                                }); }))];
                    }
                });
            });
        };
        GradesService_1.prototype.getClassSectionGradeSheet = function (classSectionId, actorId, actorRole) {
            return __awaiter(this, void 0, void 0, function () {
                var classSection, roster, studentIds, grades, _a, gradesByStudentId;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.loadClassSectionForGradeAccess(classSectionId, actorId, actorRole)];
                        case 1:
                            classSection = _b.sent();
                            return [4 /*yield*/, this.prisma.classEnrollment.findMany({
                                    where: { classSectionId: classSectionId, status: client_1.EnrollmentStatus.active },
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
                            roster = _b.sent();
                            studentIds = roster.map(function (item) { return item.studentId; });
                            if (!(studentIds.length === 0)) return [3 /*break*/, 3];
                            _a = [];
                            return [3 /*break*/, 5];
                        case 3: return [4 /*yield*/, this.prisma.grade.findMany({
                                where: {
                                    userId: { in: studentIds },
                                    courseId: classSection.courseId,
                                    semesterId: classSection.semesterId,
                                },
                            })];
                        case 4:
                            _a = _b.sent();
                            _b.label = 5;
                        case 5:
                            grades = _a;
                            gradesByStudentId = new Map(grades.map(function (grade) { return [grade.userId, grade]; }));
                            return [2 /*return*/, {
                                    classSection: {
                                        id: classSection.id,
                                        classCode: classSection.classCode,
                                        sectionCode: classSection.sectionCode,
                                        capacity: classSection.capacity,
                                        course: classSection.course,
                                        semester: classSection.semester,
                                    },
                                    weights: {
                                        processWeight: classSection.processWeight,
                                        practiceWeight: classSection.practiceWeight,
                                        midtermWeight: classSection.midtermWeight,
                                        finalWeight: classSection.finalWeight,
                                    },
                                    students: roster.map(function (enrollment) {
                                        var _a, _b, _c;
                                        var grade = gradesByStudentId.get(enrollment.studentId);
                                        return {
                                            id: enrollment.student.id,
                                            email: enrollment.student.email,
                                            firstName: enrollment.student.firstName,
                                            lastName: enrollment.student.lastName,
                                            studentId: enrollment.student.studentId,
                                            grade: grade
                                                ? {
                                                    id: grade.id,
                                                    processScore: (_a = grade.processScore) !== null && _a !== void 0 ? _a : grade.assignment,
                                                    practiceScore: grade.practiceScore,
                                                    midtermScore: (_b = grade.midtermScore) !== null && _b !== void 0 ? _b : grade.midterm,
                                                    finalScore: (_c = grade.finalScore) !== null && _c !== void 0 ? _c : grade.finalExam,
                                                    totalScore: grade.totalScore,
                                                    letterGrade: grade.letterGrade,
                                                    gradePoint: grade.gradePoint,
                                                    earnedCredits: grade.earnedCredits,
                                                }
                                                : null,
                                        };
                                    }),
                                }];
                    }
                });
            });
        };
        GradesService_1.prototype.updateClassSectionGradeWeights = function (classSectionId, actorId, actorRole, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var classSection, roster, studentIds, grades, _a;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            this.assertWeightsValid(dto);
                            return [4 /*yield*/, this.loadClassSectionForGradeAccess(classSectionId, actorId, actorRole)];
                        case 1:
                            classSection = _b.sent();
                            return [4 /*yield*/, this.prisma.classSection.update({
                                    where: { id: classSectionId },
                                    data: {
                                        processWeight: dto.processWeight,
                                        practiceWeight: dto.practiceWeight,
                                        midtermWeight: dto.midtermWeight,
                                        finalWeight: dto.finalWeight,
                                    },
                                })];
                        case 2:
                            _b.sent();
                            return [4 /*yield*/, this.prisma.classEnrollment.findMany({
                                    where: { classSectionId: classSectionId, status: client_1.EnrollmentStatus.active },
                                    select: { studentId: true },
                                })];
                        case 3:
                            roster = _b.sent();
                            studentIds = roster.map(function (item) { return item.studentId; });
                            if (!(studentIds.length === 0)) return [3 /*break*/, 4];
                            _a = [];
                            return [3 /*break*/, 6];
                        case 4: return [4 /*yield*/, this.prisma.grade.findMany({
                                where: {
                                    userId: { in: studentIds },
                                    courseId: classSection.courseId,
                                    semesterId: classSection.semesterId,
                                },
                            })];
                        case 5:
                            _a = _b.sent();
                            _b.label = 6;
                        case 6:
                            grades = _a;
                            return [4 /*yield*/, this.prisma.$transaction(grades.map(function (grade) {
                                    var _a, _b, _c;
                                    var totalScore = _this.calculateTotalScore({
                                        processScore: (_a = grade.processScore) !== null && _a !== void 0 ? _a : grade.assignment,
                                        practiceScore: grade.practiceScore,
                                        midtermScore: (_b = grade.midtermScore) !== null && _b !== void 0 ? _b : grade.midterm,
                                        finalScore: (_c = grade.finalScore) !== null && _c !== void 0 ? _c : grade.finalExam,
                                    }, dto);
                                    var earnedCredits = totalScore !== null && totalScore >= 5 ? classSection.course.credits : 0;
                                    return _this.prisma.grade.update({
                                        where: { id: grade.id },
                                        data: {
                                            totalScore: totalScore,
                                            gradePoint: totalScore,
                                            earnedCredits: earnedCredits,
                                        },
                                    });
                                }))];
                        case 7:
                            _b.sent();
                            return [2 /*return*/, this.getClassSectionGradeSheet(classSectionId, actorId, actorRole)];
                    }
                });
            });
        };
        GradesService_1.prototype.upsertClassSectionGradeSheet = function (classSectionId, actorId, actorRole, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var classSection, weights, enrolled, enrolledStudentIds, _i, _a, row, existingGrades, _b, existingGradeByStudentId, notificationCandidates, upsertedGrades, upsertedGradeByStudentId;
                var _this = this;
                var _c, _d, _e, _f;
                return __generator(this, function (_g) {
                    switch (_g.label) {
                        case 0: return [4 /*yield*/, this.loadClassSectionForGradeAccess(classSectionId, actorId, actorRole)];
                        case 1:
                            classSection = _g.sent();
                            weights = {
                                processWeight: (_c = classSection.processWeight) !== null && _c !== void 0 ? _c : this.defaultWeights.processWeight,
                                practiceWeight: (_d = classSection.practiceWeight) !== null && _d !== void 0 ? _d : this.defaultWeights.practiceWeight,
                                midtermWeight: (_e = classSection.midtermWeight) !== null && _e !== void 0 ? _e : this.defaultWeights.midtermWeight,
                                finalWeight: (_f = classSection.finalWeight) !== null && _f !== void 0 ? _f : this.defaultWeights.finalWeight,
                            };
                            this.assertWeightsValid(weights);
                            return [4 /*yield*/, this.prisma.classEnrollment.findMany({
                                    where: { classSectionId: classSectionId, status: client_1.EnrollmentStatus.active },
                                    select: { studentId: true },
                                })];
                        case 2:
                            enrolled = _g.sent();
                            enrolledStudentIds = new Set(enrolled.map(function (item) { return item.studentId; }));
                            for (_i = 0, _a = dto.rows; _i < _a.length; _i++) {
                                row = _a[_i];
                                if (!enrolledStudentIds.has(row.studentId)) {
                                    throw new common_1.BadRequestException('Grade sheet contains a student outside this class section');
                                }
                            }
                            if (!(enrolled.length === 0)) return [3 /*break*/, 3];
                            _b = [];
                            return [3 /*break*/, 5];
                        case 3: return [4 /*yield*/, this.prisma.grade.findMany({
                                where: {
                                    userId: { in: enrolled.map(function (item) { return item.studentId; }) },
                                    courseId: classSection.courseId,
                                    semesterId: classSection.semesterId,
                                },
                                select: {
                                    id: true,
                                    userId: true,
                                    totalScore: true,
                                },
                            })];
                        case 4:
                            _b = _g.sent();
                            _g.label = 5;
                        case 5:
                            existingGrades = _b;
                            existingGradeByStudentId = new Map(existingGrades.map(function (grade) { return [grade.userId, grade]; }));
                            notificationCandidates = [];
                            return [4 /*yield*/, this.prisma.$transaction(dto.rows.map(function (row) {
                                    var _a, _b, _c, _d;
                                    var processScore = (_a = row.processScore) !== null && _a !== void 0 ? _a : null;
                                    var practiceScore = (_b = row.practiceScore) !== null && _b !== void 0 ? _b : null;
                                    var midtermScore = (_c = row.midtermScore) !== null && _c !== void 0 ? _c : null;
                                    var finalScore = (_d = row.finalScore) !== null && _d !== void 0 ? _d : null;
                                    var totalScore = _this.calculateTotalScore({ processScore: processScore, practiceScore: practiceScore, midtermScore: midtermScore, finalScore: finalScore }, weights);
                                    var earnedCredits = totalScore !== null && totalScore >= 5 ? classSection.course.credits : 0;
                                    var previousGrade = existingGradeByStudentId.get(row.studentId);
                                    if (totalScore !== null &&
                                        _this.shouldNotifyGradePublished(previousGrade === null || previousGrade === void 0 ? void 0 : previousGrade.totalScore, totalScore)) {
                                        notificationCandidates.push({ studentId: row.studentId, totalScore: totalScore });
                                    }
                                    return _this.prisma.grade.upsert({
                                        where: {
                                            userId_courseId_semesterId: {
                                                userId: row.studentId,
                                                courseId: classSection.courseId,
                                                semesterId: classSection.semesterId,
                                            },
                                        },
                                        update: {
                                            processScore: processScore,
                                            practiceScore: practiceScore,
                                            midtermScore: midtermScore,
                                            finalScore: finalScore,
                                            assignment: processScore,
                                            midterm: midtermScore,
                                            finalExam: finalScore,
                                            totalScore: totalScore,
                                            gradePoint: totalScore,
                                            earnedCredits: earnedCredits,
                                        },
                                        create: {
                                            userId: row.studentId,
                                            courseId: classSection.courseId,
                                            semesterId: classSection.semesterId,
                                            processScore: processScore,
                                            practiceScore: practiceScore,
                                            midtermScore: midtermScore,
                                            finalScore: finalScore,
                                            assignment: processScore,
                                            midterm: midtermScore,
                                            finalExam: finalScore,
                                            totalScore: totalScore,
                                            gradePoint: totalScore,
                                            earnedCredits: earnedCredits,
                                        },
                                    });
                                }))];
                        case 6:
                            upsertedGrades = _g.sent();
                            upsertedGradeByStudentId = new Map(upsertedGrades.map(function (grade, index) { var _a; return [(_a = dto.rows[index]) === null || _a === void 0 ? void 0 : _a.studentId, grade]; }));
                            return [4 /*yield*/, this.notifyPublishedGrades(classSection, notificationCandidates
                                    .map(function (candidate) {
                                    var grade = upsertedGradeByStudentId.get(candidate.studentId);
                                    return (grade === null || grade === void 0 ? void 0 : grade.id) ? __assign(__assign({}, candidate), { gradeId: grade.id }) : null;
                                })
                                    .filter(function (candidate) {
                                    return Boolean(candidate);
                                }))];
                        case 7:
                            _g.sent();
                            return [2 /*return*/, this.getClassSectionGradeSheet(classSectionId, actorId, actorRole)];
                    }
                });
            });
        };
        return GradesService_1;
    }());
    __setFunctionName(_classThis, "GradesService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        GradesService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return GradesService = _classThis;
}();
exports.GradesService = GradesService;
