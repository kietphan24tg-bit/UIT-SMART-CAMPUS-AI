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
exports.RegistrationsService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
function toFullName(firstName, lastName) {
    return [lastName, firstName].filter(Boolean).join(' ').trim();
}
function timeRangeOverlap(startA, endA, startB, endB) {
    return startA < endB && startB < endA;
}
function mapEnrollment(enrollment) {
    var enrolledCount = enrollment.classSection._count.enrollments;
    var seatsRemaining = Math.max(0, enrollment.classSection.capacity - enrolledCount);
    return {
        id: enrollment.id,
        status: enrollment.status,
        registeredAt: enrollment.registeredAt,
        droppedAt: enrollment.droppedAt,
        classSection: {
            id: enrollment.classSection.id,
            classCode: enrollment.classSection.classCode,
            sectionCode: enrollment.classSection.sectionCode,
            note: enrollment.classSection.note,
            registrationOpen: enrollment.classSection.registrationOpen,
            capacity: enrollment.classSection.capacity,
            enrolledCount: enrolledCount,
            seatsRemaining: seatsRemaining,
            course: enrollment.classSection.course,
            semester: enrollment.classSection.semester,
            lecturer: enrollment.classSection.lecturer
                ? {
                    id: enrollment.classSection.lecturer.id,
                    email: enrollment.classSection.lecturer.email,
                    fullName: toFullName(enrollment.classSection.lecturer.firstName, enrollment.classSection.lecturer.lastName),
                }
                : null,
            meetings: enrollment.classSection.meetings,
        },
    };
}
var RegistrationsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var RegistrationsService = _classThis = /** @class */ (function () {
        function RegistrationsService_1(prisma) {
            this.prisma = prisma;
        }
        RegistrationsService_1.prototype.getAvailableClassSections = function (studentId) {
            return __awaiter(this, void 0, void 0, function () {
                var activeEnrollments, enrolledSectionIds, activeMeetings, sections;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.classEnrollment.findMany({
                                where: {
                                    studentId: studentId,
                                    status: client_1.EnrollmentStatus.active,
                                },
                                include: {
                                    classSection: {
                                        include: {
                                            meetings: {
                                                select: {
                                                    dayOfWeek: true,
                                                    startTime: true,
                                                    endTime: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            })];
                        case 1:
                            activeEnrollments = _a.sent();
                            enrolledSectionIds = new Set(activeEnrollments.map(function (item) { return item.classSectionId; }));
                            activeMeetings = activeEnrollments.flatMap(function (item) { return item.classSection.meetings; });
                            return [4 /*yield*/, this.prisma.classSection.findMany({
                                    where: { registrationOpen: true },
                                    include: {
                                        course: { select: { code: true, name: true, credits: true } },
                                        semester: { select: { id: true, name: true, isCurrent: true } },
                                        lecturer: { select: { id: true, email: true, firstName: true, lastName: true } },
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
                        case 2:
                            sections = _a.sent();
                            return [2 /*return*/, sections.map(function (section) {
                                    var enrolledCount = section._count.enrollments;
                                    var seatsRemaining = Math.max(0, section.capacity - enrolledCount);
                                    var isRegistered = enrolledSectionIds.has(section.id);
                                    var hasConflict = section.meetings.some(function (candidateMeeting) {
                                        return activeMeetings.some(function (enrolledMeeting) {
                                            return candidateMeeting.dayOfWeek === enrolledMeeting.dayOfWeek &&
                                                timeRangeOverlap(candidateMeeting.startTime, candidateMeeting.endTime, enrolledMeeting.startTime, enrolledMeeting.endTime);
                                        });
                                    });
                                    return {
                                        id: section.id,
                                        classCode: section.classCode,
                                        sectionCode: section.sectionCode,
                                        note: section.note,
                                        registrationOpen: section.registrationOpen,
                                        capacity: section.capacity,
                                        enrolledCount: enrolledCount,
                                        seatsRemaining: seatsRemaining,
                                        isRegistered: isRegistered,
                                        hasConflict: hasConflict,
                                        canRegister: !isRegistered && !hasConflict && seatsRemaining > 0,
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
                                    };
                                })];
                    }
                });
            });
        };
        RegistrationsService_1.prototype.getMyRegistrations = function (studentId, status) {
            return __awaiter(this, void 0, void 0, function () {
                var enrollments;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.classEnrollment.findMany({
                                where: __assign({ studentId: studentId }, (status ? { status: status } : {})),
                                include: {
                                    classSection: {
                                        include: {
                                            course: { select: { code: true, name: true, credits: true } },
                                            semester: { select: { id: true, name: true, isCurrent: true } },
                                            lecturer: { select: { id: true, firstName: true, lastName: true, email: true } },
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
                                    },
                                },
                                orderBy: [{ registeredAt: 'desc' }],
                            })];
                        case 1:
                            enrollments = _a.sent();
                            return [2 /*return*/, enrollments.map(mapEnrollment)];
                    }
                });
            });
        };
        RegistrationsService_1.prototype.register = function (studentId, classSectionId) {
            return __awaiter(this, void 0, void 0, function () {
                var section, existingEnrollment, currentActiveEnrollments, hasConflict, enrollment;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.classSection.findUnique({
                                where: { id: classSectionId },
                                include: {
                                    meetings: {
                                        select: {
                                            id: true,
                                            dayOfWeek: true,
                                            startTime: true,
                                            endTime: true,
                                            room: true,
                                            startPeriod: true,
                                            endPeriod: true,
                                            sessionType: true,
                                            note: true,
                                        },
                                    },
                                    _count: {
                                        select: {
                                            enrollments: {
                                                where: { status: client_1.EnrollmentStatus.active },
                                            },
                                        },
                                    },
                                },
                            })];
                        case 1:
                            section = _a.sent();
                            if (!section) {
                                throw new common_1.NotFoundException('Class section not found');
                            }
                            if (!section.registrationOpen) {
                                throw new common_1.BadRequestException('Registration for this class section is closed');
                            }
                            return [4 /*yield*/, this.prisma.classEnrollment.findUnique({
                                    where: {
                                        studentId_classSectionId: {
                                            studentId: studentId,
                                            classSectionId: classSectionId,
                                        },
                                    },
                                })];
                        case 2:
                            existingEnrollment = _a.sent();
                            if ((existingEnrollment === null || existingEnrollment === void 0 ? void 0 : existingEnrollment.status) === client_1.EnrollmentStatus.active) {
                                throw new common_1.ConflictException('You are already registered in this class section');
                            }
                            if (section._count.enrollments >= section.capacity) {
                                throw new common_1.ConflictException('Class section is full');
                            }
                            return [4 /*yield*/, this.prisma.classEnrollment.findMany({
                                    where: {
                                        studentId: studentId,
                                        status: client_1.EnrollmentStatus.active,
                                    },
                                    include: {
                                        classSection: {
                                            include: {
                                                meetings: {
                                                    select: {
                                                        dayOfWeek: true,
                                                        startTime: true,
                                                        endTime: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                })];
                        case 3:
                            currentActiveEnrollments = _a.sent();
                            hasConflict = section.meetings.some(function (candidateMeeting) {
                                return currentActiveEnrollments.some(function (enrollment) {
                                    return enrollment.classSection.meetings.some(function (registeredMeeting) {
                                        return candidateMeeting.dayOfWeek === registeredMeeting.dayOfWeek &&
                                            timeRangeOverlap(candidateMeeting.startTime, candidateMeeting.endTime, registeredMeeting.startTime, registeredMeeting.endTime);
                                    });
                                });
                            });
                            if (hasConflict) {
                                throw new common_1.ConflictException('Schedule conflict detected');
                            }
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, tx.classEnrollment.upsert({
                                                    where: {
                                                        studentId_classSectionId: {
                                                            studentId: studentId,
                                                            classSectionId: classSectionId,
                                                        },
                                                    },
                                                    update: {
                                                        status: client_1.EnrollmentStatus.active,
                                                        registeredAt: new Date(),
                                                        droppedAt: null,
                                                    },
                                                    create: {
                                                        studentId: studentId,
                                                        classSectionId: classSectionId,
                                                        status: client_1.EnrollmentStatus.active,
                                                    },
                                                })];
                                            case 1:
                                                _a.sent();
                                                return [4 /*yield*/, tx.scheduleItem.deleteMany({
                                                        where: {
                                                            userId: studentId,
                                                            classSectionId: classSectionId,
                                                        },
                                                    })];
                                            case 2:
                                                _a.sent();
                                                if (!(section.meetings.length > 0)) return [3 /*break*/, 4];
                                                return [4 /*yield*/, tx.scheduleItem.createMany({
                                                        data: section.meetings.map(function (meeting) {
                                                            var _a;
                                                            return ({
                                                                userId: studentId,
                                                                classSectionId: classSectionId,
                                                                dayOfWeek: meeting.dayOfWeek,
                                                                startTime: meeting.startTime,
                                                                endTime: meeting.endTime,
                                                                startPeriod: meeting.startPeriod,
                                                                endPeriod: meeting.endPeriod,
                                                                sessionType: meeting.sessionType,
                                                                room: (_a = meeting.room) !== null && _a !== void 0 ? _a : null,
                                                                instructor: null,
                                                            });
                                                        }),
                                                    })];
                                            case 3:
                                                _a.sent();
                                                _a.label = 4;
                                            case 4: return [2 /*return*/];
                                        }
                                    });
                                }); })];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.classEnrollment.findUnique({
                                    where: {
                                        studentId_classSectionId: {
                                            studentId: studentId,
                                            classSectionId: classSectionId,
                                        },
                                    },
                                    include: {
                                        classSection: {
                                            include: {
                                                course: { select: { code: true, name: true, credits: true } },
                                                semester: { select: { id: true, name: true, isCurrent: true } },
                                                lecturer: { select: { id: true, firstName: true, lastName: true, email: true } },
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
                                        },
                                    },
                                })];
                        case 5:
                            enrollment = _a.sent();
                            if (!enrollment) {
                                throw new common_1.NotFoundException('Enrollment not found');
                            }
                            return [2 /*return*/, mapEnrollment(enrollment)];
                    }
                });
            });
        };
        RegistrationsService_1.prototype.drop = function (studentId, enrollmentId) {
            return __awaiter(this, void 0, void 0, function () {
                var enrollment;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.classEnrollment.findFirst({
                                where: {
                                    id: enrollmentId,
                                    studentId: studentId,
                                },
                            })];
                        case 1:
                            enrollment = _a.sent();
                            if (!enrollment) {
                                throw new common_1.NotFoundException('Enrollment not found');
                            }
                            if (enrollment.status === client_1.EnrollmentStatus.dropped) {
                                return [2 /*return*/, this.findEnrollmentOrThrow(enrollment.id)];
                            }
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, tx.classEnrollment.update({
                                                    where: { id: enrollment.id },
                                                    data: {
                                                        status: client_1.EnrollmentStatus.dropped,
                                                        droppedAt: new Date(),
                                                    },
                                                })];
                                            case 1:
                                                _a.sent();
                                                return [4 /*yield*/, tx.scheduleItem.deleteMany({
                                                        where: {
                                                            userId: studentId,
                                                            classSectionId: enrollment.classSectionId,
                                                        },
                                                    })];
                                            case 2:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, this.findEnrollmentOrThrow(enrollment.id)];
                    }
                });
            });
        };
        RegistrationsService_1.prototype.findEnrollmentOrThrow = function (enrollmentId) {
            return __awaiter(this, void 0, void 0, function () {
                var enrollment;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.classEnrollment.findUnique({
                                where: { id: enrollmentId },
                                include: {
                                    classSection: {
                                        include: {
                                            course: { select: { code: true, name: true, credits: true } },
                                            semester: { select: { id: true, name: true, isCurrent: true } },
                                            lecturer: { select: { id: true, firstName: true, lastName: true, email: true } },
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
                                    },
                                },
                            })];
                        case 1:
                            enrollment = _a.sent();
                            if (!enrollment) {
                                throw new common_1.NotFoundException('Enrollment not found');
                            }
                            return [2 /*return*/, mapEnrollment(enrollment)];
                    }
                });
            });
        };
        return RegistrationsService_1;
    }());
    __setFunctionName(_classThis, "RegistrationsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RegistrationsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RegistrationsService = _classThis;
}();
exports.RegistrationsService = RegistrationsService;
