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
exports.CatalogService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var DEFAULT_SCHEDULE_SESSION_TYPE = 'daytime';
function toFullName(firstName, lastName) {
    return [lastName, firstName].filter(Boolean).join(' ').trim();
}
var CatalogService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var CatalogService = _classThis = /** @class */ (function () {
        function CatalogService_1(prisma) {
            this.prisma = prisma;
        }
        CatalogService_1.prototype.listSemesters = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.semester.findMany({
                            orderBy: { startDate: 'desc' },
                            select: {
                                id: true,
                                name: true,
                                academicYear: true,
                                term: true,
                                startDate: true,
                                endDate: true,
                                isCurrent: true,
                            },
                        })];
                });
            });
        };
        CatalogService_1.prototype.listCourses = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.course.findMany({
                            orderBy: { code: 'asc' },
                            select: {
                                id: true,
                                code: true,
                                name: true,
                                credits: true,
                                faculty: true,
                                description: true,
                            },
                        })];
                });
            });
        };
        CatalogService_1.prototype.createCourse = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    return [2 /*return*/, this.prisma.course.upsert({
                            where: { code: dto.code.trim().toUpperCase() },
                            update: {
                                name: dto.name.trim(),
                                credits: dto.credits,
                                faculty: ((_a = dto.faculty) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                                description: ((_b = dto.description) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                            },
                            create: {
                                code: dto.code.trim().toUpperCase(),
                                name: dto.name.trim(),
                                credits: dto.credits,
                                faculty: ((_c = dto.faculty) === null || _c === void 0 ? void 0 : _c.trim()) || null,
                                description: ((_d = dto.description) === null || _d === void 0 ? void 0 : _d.trim()) || null,
                            },
                            select: {
                                id: true,
                                code: true,
                                name: true,
                                credits: true,
                                faculty: true,
                                description: true,
                            },
                        })];
                });
            });
        };
        CatalogService_1.prototype.listLecturers = function () {
            return __awaiter(this, void 0, void 0, function () {
                var users;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.user.findMany({
                                where: {
                                    role: client_1.Role.lecturer,
                                    isActive: true,
                                },
                                orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
                                select: {
                                    id: true,
                                    email: true,
                                    firstName: true,
                                    lastName: true,
                                },
                            })];
                        case 1:
                            users = _a.sent();
                            return [2 /*return*/, users.map(function (user) { return ({
                                    id: user.id,
                                    email: user.email,
                                    fullName: toFullName(user.firstName, user.lastName),
                                }); })];
                    }
                });
            });
        };
        CatalogService_1.prototype.listClassSections = function (semesterId) {
            return __awaiter(this, void 0, void 0, function () {
                var sections;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.classSection.findMany({
                                where: semesterId ? { semesterId: semesterId } : undefined,
                                include: {
                                    course: { select: { id: true, code: true, name: true, credits: true } },
                                    semester: { select: { id: true, name: true, isCurrent: true } },
                                    lecturer: { select: { id: true, email: true, firstName: true, lastName: true } },
                                    meetings: {
                                        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
                                    },
                                    _count: {
                                        select: {
                                            enrollments: {
                                                where: { status: 'active' },
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
                                    lecturer: section.lecturer
                                        ? {
                                            id: section.lecturer.id,
                                            email: section.lecturer.email,
                                            fullName: toFullName(section.lecturer.firstName, section.lecturer.lastName),
                                        }
                                        : null,
                                    meetings: section.meetings,
                                }); })];
                    }
                });
            });
        };
        CatalogService_1.prototype.createClassSection = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, semester, course, lecturer, classCode, sectionCode, duplicated;
                var _b, _c, _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.prisma.semester.findUnique({ where: { id: dto.semesterId }, select: { id: true } }),
                                this.prisma.course.findUnique({
                                    where: { code: dto.courseCode.trim().toUpperCase() },
                                    select: { id: true },
                                }),
                            ])];
                        case 1:
                            _a = _f.sent(), semester = _a[0], course = _a[1];
                            if (!semester) {
                                throw new common_1.NotFoundException('Semester not found');
                            }
                            if (!course) {
                                throw new common_1.NotFoundException('Course not found');
                            }
                            if (!dto.lecturerId) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.prisma.user.findFirst({
                                    where: {
                                        id: dto.lecturerId,
                                        role: client_1.Role.lecturer,
                                        isActive: true,
                                    },
                                    select: { id: true },
                                })];
                        case 2:
                            lecturer = _f.sent();
                            if (!lecturer) {
                                throw new common_1.NotFoundException('Lecturer not found');
                            }
                            _f.label = 3;
                        case 3:
                            classCode = dto.classCode.trim().toUpperCase();
                            sectionCode = dto.sectionCode.trim().toUpperCase();
                            return [4 /*yield*/, this.prisma.classSection.findFirst({
                                    where: {
                                        semesterId: semester.id,
                                        courseId: course.id,
                                        sectionCode: sectionCode,
                                    },
                                    select: { id: true },
                                })];
                        case 4:
                            duplicated = _f.sent();
                            if (duplicated) {
                                throw new common_1.BadRequestException('Section code already exists for this course and semester');
                            }
                            return [2 /*return*/, this.prisma.classSection.create({
                                    data: {
                                        semesterId: semester.id,
                                        courseId: course.id,
                                        classCode: classCode,
                                        sectionCode: sectionCode,
                                        note: ((_b = dto.note) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                                        lecturerId: (_c = dto.lecturerId) !== null && _c !== void 0 ? _c : null,
                                        capacity: (_d = dto.capacity) !== null && _d !== void 0 ? _d : 60,
                                        registrationOpen: (_e = dto.registrationOpen) !== null && _e !== void 0 ? _e : true,
                                    },
                                    include: {
                                        course: { select: { code: true, name: true, credits: true } },
                                        semester: { select: { id: true, name: true, isCurrent: true } },
                                        lecturer: { select: { id: true, email: true, firstName: true, lastName: true } },
                                    },
                                })];
                    }
                });
            });
        };
        CatalogService_1.prototype.updateClassSection = function (sectionId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var section, lecturer;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.classSection.findUnique({
                                where: { id: sectionId },
                                select: { id: true },
                            })];
                        case 1:
                            section = _b.sent();
                            if (!section) {
                                throw new common_1.NotFoundException('Class section not found');
                            }
                            if (!dto.lecturerId) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.prisma.user.findFirst({
                                    where: {
                                        id: dto.lecturerId,
                                        role: client_1.Role.lecturer,
                                        isActive: true,
                                    },
                                    select: { id: true },
                                })];
                        case 2:
                            lecturer = _b.sent();
                            if (!lecturer) {
                                throw new common_1.NotFoundException('Lecturer not found');
                            }
                            _b.label = 3;
                        case 3: return [2 /*return*/, this.prisma.classSection.update({
                                where: { id: sectionId },
                                data: __assign(__assign(__assign(__assign(__assign({}, (dto.sectionCode ? { sectionCode: dto.sectionCode.trim().toUpperCase() } : {})), (dto.note !== undefined ? { note: ((_a = dto.note) === null || _a === void 0 ? void 0 : _a.trim()) || null } : {})), (dto.lecturerId !== undefined ? { lecturerId: dto.lecturerId || null } : {})), (dto.capacity !== undefined ? { capacity: dto.capacity } : {})), (dto.registrationOpen !== undefined ? { registrationOpen: dto.registrationOpen } : {})),
                            })];
                    }
                });
            });
        };
        CatalogService_1.prototype.replaceClassMeetings = function (sectionId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var section;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.classSection.findUnique({
                                where: { id: sectionId },
                                select: { id: true },
                            })];
                        case 1:
                            section = _a.sent();
                            if (!section) {
                                throw new common_1.NotFoundException('Class section not found');
                            }
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, tx.classMeeting.deleteMany({
                                                    where: {
                                                        classSectionId: sectionId,
                                                    },
                                                })];
                                            case 1:
                                                _a.sent();
                                                if (!(dto.meetings.length > 0)) return [3 /*break*/, 3];
                                                return [4 /*yield*/, tx.classMeeting.createMany({
                                                        data: dto.meetings.map(function (meeting) {
                                                            var _a, _b, _c, _d, _e;
                                                            return ({
                                                                classSectionId: sectionId,
                                                                dayOfWeek: meeting.dayOfWeek,
                                                                startTime: meeting.startTime,
                                                                endTime: meeting.endTime,
                                                                startPeriod: (_a = meeting.startPeriod) !== null && _a !== void 0 ? _a : null,
                                                                endPeriod: (_b = meeting.endPeriod) !== null && _b !== void 0 ? _b : null,
                                                                room: ((_c = meeting.room) === null || _c === void 0 ? void 0 : _c.trim()) || null,
                                                                sessionType: (_d = meeting.sessionType) !== null && _d !== void 0 ? _d : DEFAULT_SCHEDULE_SESSION_TYPE,
                                                                note: ((_e = meeting.note) === null || _e === void 0 ? void 0 : _e.trim()) || null,
                                                            });
                                                        }),
                                                    })];
                                            case 2:
                                                _a.sent();
                                                _a.label = 3;
                                            case 3: return [2 /*return*/];
                                        }
                                    });
                                }); })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, this.prisma.classSection.findUnique({
                                    where: { id: sectionId },
                                    include: {
                                        meetings: {
                                            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
                                        },
                                    },
                                })];
                    }
                });
            });
        };
        return CatalogService_1;
    }());
    __setFunctionName(_classThis, "CatalogService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CatalogService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CatalogService = _classThis;
}();
exports.CatalogService = CatalogService;
