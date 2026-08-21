"use strict";
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
exports.ScheduleService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var DEMO_SCHEDULE_USER_EMAIL = 'student@gm.uit.edu.vn';
function buildStudentSemesterInclude(userId) {
    return {
        classSections: {
            include: {
                course: { select: { code: true, name: true, credits: true } },
                scheduleItems: {
                    where: { userId: userId },
                    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
                },
            },
            orderBy: [{ classCode: 'asc' }],
        },
    };
}
function buildLecturerSemesterInclude(userId) {
    return {
        classSections: {
            where: {
                lecturerId: userId,
            },
            include: {
                course: { select: { code: true, name: true, credits: true } },
                lecturer: { select: { firstName: true, lastName: true } },
                meetings: {
                    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
                },
            },
            orderBy: [{ classCode: 'asc' }],
        },
    };
}
function toFullName(firstName, lastName) {
    return [lastName, firstName].filter(Boolean).join(' ').trim();
}
var ScheduleService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ScheduleService = _classThis = /** @class */ (function () {
        function ScheduleService_1(prisma) {
            this.prisma = prisma;
        }
        ScheduleService_1.prototype.getAllSemestersWithSchedules = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var effectiveUserId, role;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.resolveScheduleUserId(userId)];
                        case 1:
                            effectiveUserId = _a.sent();
                            return [4 /*yield*/, this.getUserRole(effectiveUserId)];
                        case 2:
                            role = _a.sent();
                            return [2 /*return*/, this.getSemestersByRole(role, effectiveUserId)];
                    }
                });
            });
        };
        ScheduleService_1.prototype.getCurrentSemesterSchedule = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var effectiveUserId, role, semesters, current;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.resolveScheduleUserId(userId)];
                        case 1:
                            effectiveUserId = _a.sent();
                            return [4 /*yield*/, this.getUserRole(effectiveUserId)];
                        case 2:
                            role = _a.sent();
                            return [4 /*yield*/, this.getSemestersByRole(role, effectiveUserId)];
                        case 3:
                            semesters = _a.sent();
                            current = semesters.find(function (item) { return item.isCurrent; });
                            if (!current) {
                                throw new common_1.NotFoundException('Current semester not found');
                            }
                            return [2 /*return*/, current];
                    }
                });
            });
        };
        ScheduleService_1.prototype.getSemesterScheduleById = function (userId, semesterId) {
            return __awaiter(this, void 0, void 0, function () {
                var effectiveUserId, role, semesters, semester;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.resolveScheduleUserId(userId)];
                        case 1:
                            effectiveUserId = _a.sent();
                            return [4 /*yield*/, this.getUserRole(effectiveUserId)];
                        case 2:
                            role = _a.sent();
                            return [4 /*yield*/, this.getSemestersByRole(role, effectiveUserId)];
                        case 3:
                            semesters = _a.sent();
                            semester = semesters.find(function (entry) { return entry.id === semesterId; });
                            if (!semester) {
                                throw new common_1.NotFoundException('Semester not found');
                            }
                            return [2 /*return*/, semester];
                    }
                });
            });
        };
        ScheduleService_1.prototype.resolveScheduleUserId = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var demoUser;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (userId) {
                                return [2 /*return*/, userId];
                            }
                            return [4 /*yield*/, this.prisma.user.findUnique({
                                    where: { email: DEMO_SCHEDULE_USER_EMAIL },
                                    select: { id: true },
                                })];
                        case 1:
                            demoUser = _a.sent();
                            if (!demoUser) {
                                throw new common_1.NotFoundException('Demo schedule user not found');
                            }
                            return [2 /*return*/, demoUser.id];
                    }
                });
            });
        };
        ScheduleService_1.prototype.getUserRole = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.user.findUnique({
                                where: { id: userId },
                                select: { role: true },
                            })];
                        case 1:
                            user = _a.sent();
                            if (!user) {
                                throw new common_1.NotFoundException('User not found');
                            }
                            return [2 /*return*/, user.role];
                    }
                });
            });
        };
        ScheduleService_1.prototype.getSemestersByRole = function (role, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var semesters_1, semesters_2, semesters;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(role === client_1.Role.student)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.prisma.semester.findMany({
                                    include: buildStudentSemesterInclude(userId),
                                    orderBy: { startDate: 'desc' },
                                })];
                        case 1:
                            semesters_1 = _a.sent();
                            return [2 /*return*/, semesters_1.map(function (semester) { return _this.mapStudentSemesterSchedule(semester); })];
                        case 2:
                            if (!(role === client_1.Role.lecturer)) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.prisma.semester.findMany({
                                    include: buildLecturerSemesterInclude(userId),
                                    orderBy: { startDate: 'desc' },
                                })];
                        case 3:
                            semesters_2 = _a.sent();
                            return [2 /*return*/, semesters_2.map(function (semester) { return _this.mapLecturerSemesterSchedule(semester); })];
                        case 4: return [4 /*yield*/, this.prisma.semester.findMany({
                                orderBy: { startDate: 'desc' },
                            })];
                        case 5:
                            semesters = _a.sent();
                            return [2 /*return*/, semesters.map(function (semester) { return ({
                                    id: semester.id,
                                    name: semester.name,
                                    academicYear: semester.academicYear,
                                    term: semester.term,
                                    startDate: semester.startDate,
                                    endDate: semester.endDate,
                                    isCurrent: semester.isCurrent,
                                    sessions: [],
                                }); })];
                    }
                });
            });
        };
        ScheduleService_1.prototype.mapStudentSemesterSchedule = function (semester) {
            return {
                id: semester.id,
                name: semester.name,
                academicYear: semester.academicYear,
                term: semester.term,
                startDate: semester.startDate,
                endDate: semester.endDate,
                isCurrent: semester.isCurrent,
                sessions: semester.classSections
                    .flatMap(function (classSection) {
                    return classSection.scheduleItems.map(function (item) { return ({
                        id: item.id,
                        classCode: classSection.classCode,
                        sectionCode: classSection.sectionCode,
                        note: classSection.note,
                        instructor: item.instructor,
                        room: item.room,
                        dayOfWeek: item.dayOfWeek,
                        startTime: item.startTime,
                        endTime: item.endTime,
                        startPeriod: item.startPeriod,
                        endPeriod: item.endPeriod,
                        sessionType: item.sessionType,
                        course: classSection.course,
                    }); });
                })
                    .sort(function (left, right) {
                    if (left.dayOfWeek !== right.dayOfWeek) {
                        return left.dayOfWeek - right.dayOfWeek;
                    }
                    return left.startTime.localeCompare(right.startTime);
                }),
            };
        };
        ScheduleService_1.prototype.mapLecturerSemesterSchedule = function (semester) {
            return {
                id: semester.id,
                name: semester.name,
                academicYear: semester.academicYear,
                term: semester.term,
                startDate: semester.startDate,
                endDate: semester.endDate,
                isCurrent: semester.isCurrent,
                sessions: semester.classSections
                    .flatMap(function (classSection) {
                    return classSection.meetings.map(function (meeting) {
                        var _a, _b;
                        return ({
                            id: meeting.id,
                            classCode: classSection.classCode,
                            sectionCode: classSection.sectionCode,
                            note: (_a = meeting.note) !== null && _a !== void 0 ? _a : classSection.note,
                            instructor: classSection.lecturer
                                ? toFullName(classSection.lecturer.firstName, classSection.lecturer.lastName)
                                : null,
                            room: (_b = meeting.room) !== null && _b !== void 0 ? _b : null,
                            dayOfWeek: meeting.dayOfWeek,
                            startTime: meeting.startTime,
                            endTime: meeting.endTime,
                            startPeriod: meeting.startPeriod,
                            endPeriod: meeting.endPeriod,
                            sessionType: meeting.sessionType,
                            course: classSection.course,
                        });
                    });
                })
                    .sort(function (left, right) {
                    if (left.dayOfWeek !== right.dayOfWeek) {
                        return left.dayOfWeek - right.dayOfWeek;
                    }
                    return left.startTime.localeCompare(right.startTime);
                }),
            };
        };
        return ScheduleService_1;
    }());
    __setFunctionName(_classThis, "ScheduleService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ScheduleService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ScheduleService = _classThis;
}();
exports.ScheduleService = ScheduleService;
