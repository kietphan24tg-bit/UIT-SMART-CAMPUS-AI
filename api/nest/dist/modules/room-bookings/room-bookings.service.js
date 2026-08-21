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
exports.RoomBookingsService = void 0;
var common_1 = require("@nestjs/common");
var BANGKOK_TIME_ZONE = 'Asia/Bangkok';
var ACTIVE_ROOM_STATUS = 'active';
var OCCUPYING_BOOKING_STATUSES = ['approved', 'booked', 'maintenance'];
var INACTIVE_BOOKING_STATUSES = ['rejected', 'cancelled'];
var CREATED_BOOKING_STATUS = 'pending';
var EMPTY_ROOM_SCHEDULE_TEXT = 'Trống';
var ROOM_AVAILABLE_STATUS = 'Trống hiện tại';
var ROOM_OCCUPIED_STATUS = 'Đang được sử dụng';
var APPROVAL_REJECT_NOTE = 'Slot đã được duyệt cho yêu cầu khác';
var ROOM_CODE_COLLATOR = new Intl.Collator('en', {
    numeric: true,
    sensitivity: 'base',
});
var FIXED_ROOM_SCHEDULE_DAYS = [
    { dayOfWeek: 2, label: 'Thứ 2' },
    { dayOfWeek: 3, label: 'Thứ 3' },
    { dayOfWeek: 4, label: 'Thứ 4' },
    { dayOfWeek: 5, label: 'Thứ 5' },
    { dayOfWeek: 6, label: 'Thứ 6' },
    { dayOfWeek: 7, label: 'Thứ 7' },
];
var ROOM_BOOKING_MAX_WEEKS_AHEAD = 8;
var roomBookingInclude = {
    room: {
        select: {
            roomCode: true,
            name: true,
            floor: {
                select: {
                    building: {
                        select: {
                            code: true,
                            name: true,
                        },
                    },
                },
            },
        },
    },
    timeSlot: {
        select: {
            id: true,
            slotNumber: true,
            label: true,
            startTime: true,
            endTime: true,
        },
    },
    bookingSlots: {
        include: {
            timeSlot: {
                select: {
                    id: true,
                    slotNumber: true,
                    label: true,
                    startTime: true,
                    endTime: true,
                },
            },
        },
        orderBy: {
            slotOrder: 'asc',
        },
    },
};
function getBangkokDateTimeParts(now) {
    if (now === void 0) { now = new Date(); }
    var formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: BANGKOK_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    });
    var parts = Object.fromEntries(formatter
        .formatToParts(now)
        .filter(function (part) { return part.type !== 'literal'; })
        .map(function (part) { return [part.type, part.value]; }));
    return {
        dateKey: "".concat(parts.year, "-").concat(parts.month, "-").concat(parts.day),
        timeKey: "".concat(parts.hour, ":").concat(parts.minute),
    };
}
function isCurrentTimeInSlot(timeKey, startTime, endTime) {
    return startTime <= timeKey && timeKey < endTime;
}
function createUtcDate(dateKey) {
    return new Date("".concat(dateKey, "T00:00:00.000Z"));
}
function parseBookingDate(dateKey) {
    var normalizedDateKey = String(dateKey || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDateKey)) {
        throw new common_1.BadRequestException('bookingDate phải có định dạng YYYY-MM-DD');
    }
    var parsedDate = createUtcDate(normalizedDateKey);
    if (Number.isNaN(parsedDate.getTime())) {
        throw new common_1.BadRequestException('bookingDate không hợp lệ');
    }
    return parsedDate;
}
function addUtcDays(date, days) {
    var nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + days);
    return nextDate;
}
function getCurrentBangkokWeekRange(now) {
    if (now === void 0) { now = new Date(); }
    var dateKey = getBangkokDateTimeParts(now).dateKey;
    var currentDate = createUtcDate(dateKey);
    var utcDay = currentDate.getUTCDay();
    var isoDay = utcDay === 0 ? 7 : utcDay;
    var monday = addUtcDays(currentDate, 1 - isoDay);
    var saturday = addUtcDays(monday, 5);
    return {
        monday: monday,
        saturday: saturday,
    };
}
function toDateKey(date) {
    return date.toISOString().slice(0, 10);
}
function getDateByDayOfWeek(monday, dayOfWeek) {
    return addUtcDays(monday, dayOfWeek - 2);
}
function getRoomBookingDayOfWeek(bookingDate) {
    var utcDay = bookingDate.getUTCDay();
    return utcDay === 0 ? 8 : utcDay + 1;
}
function getMondayOfDateUtc(date) {
    var utcDay = date.getUTCDay();
    var isoDay = utcDay === 0 ? 7 : utcDay;
    return addUtcDays(date, 1 - isoDay);
}
function getFirstBookableWeekMonday(now) {
    if (now === void 0) { now = new Date(); }
    var currentMonday = getCurrentBangkokWeekRange(now).monday;
    return addUtcDays(currentMonday, 7);
}
function getLastAllowedWeekMonday(now) {
    if (now === void 0) { now = new Date(); }
    return addUtcDays(getFirstBookableWeekMonday(now), (ROOM_BOOKING_MAX_WEEKS_AHEAD - 1) * 7);
}
function assertBookingDateAllowedForRoomBooking(bookingDate, now) {
    if (now === void 0) { now = new Date(); }
    var dayOfWeek = getRoomBookingDayOfWeek(bookingDate);
    if (dayOfWeek < 2 || dayOfWeek > 7) {
        throw new common_1.BadRequestException('bookingDate chỉ được từ Thứ 2 đến Thứ 7');
    }
    var weekMonday = getMondayOfDateUtc(bookingDate);
    var firstAllowed = getFirstBookableWeekMonday(now);
    var lastAllowed = getLastAllowedWeekMonday(now);
    if (weekMonday.getTime() < firstAllowed.getTime()) {
        throw new common_1.BadRequestException('Đặt phòng phải cách ít nhất một tuần (từ tuần kế tiếp trở đi)');
    }
    if (weekMonday.getTime() > lastAllowed.getTime()) {
        throw new common_1.BadRequestException("\u0110\u1EB7t ph\u00F2ng t\u1ED1i \u0111a ".concat(ROOM_BOOKING_MAX_WEEKS_AHEAD, " tu\u1EA7n k\u1EC3 t\u1EEB tu\u1EA7n \u0111\u01B0\u1EE3c ph\u00E9p \u0111\u1EA7u ti\u00EAn"));
    }
}
function resolveScheduleWeekMonday(weekStart, now) {
    if (now === void 0) { now = new Date(); }
    var firstAllowed = getFirstBookableWeekMonday(now);
    var lastAllowed = getLastAllowedWeekMonday(now);
    var normalized = String(weekStart || '').trim();
    if (!normalized) {
        return firstAllowed;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        throw new common_1.BadRequestException('weekStart phải có định dạng YYYY-MM-DD');
    }
    var parsed = createUtcDate(normalized);
    if (Number.isNaN(parsed.getTime())) {
        throw new common_1.BadRequestException('weekStart không hợp lệ');
    }
    var monday = getMondayOfDateUtc(parsed);
    if (toDateKey(monday) !== normalized) {
        throw new common_1.BadRequestException('weekStart phải là thứ Hai của tuần');
    }
    if (monday.getTime() < firstAllowed.getTime() || monday.getTime() > lastAllowed.getTime()) {
        throw new common_1.BadRequestException('weekStart nằm ngoài khoảng đặt phòng cho phép');
    }
    return monday;
}
function buildFullName(firstName, lastName) {
    return [lastName, firstName].filter(Boolean).join(' ').trim();
}
function normalizeRoomText(value) {
    return String(value || '').trim().toUpperCase();
}
function isDateWithinRange(date, startDate, endDate) {
    return date.getTime() >= startDate.getTime() && date.getTime() <= endDate.getTime();
}
var RoomBookingsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var RoomBookingsService = _classThis = /** @class */ (function () {
        function RoomBookingsService_1(prisma, notificationsService) {
            this.prisma = prisma;
            this.notificationsService = notificationsService;
        }
        RoomBookingsService_1.prototype.createRoomBooking = function (userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var roomCode, bookingDate, _a, room, selectedTimeSlots, selectedTimeSlotIds, conflictingSlot, booking, error_1, releasedInactiveSlots, retryError_1, raceConflictingSlot;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            roomCode = String(dto.roomCode || '').trim().toUpperCase();
                            bookingDate = parseBookingDate(dto.bookingDate);
                            assertBookingDateAllowedForRoomBooking(bookingDate);
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.room.findFirst({
                                        where: {
                                            roomCode: roomCode,
                                            status: ACTIVE_ROOM_STATUS,
                                        },
                                        select: {
                                            id: true,
                                            roomCode: true,
                                        },
                                    }),
                                    this.getSelectedTimeSlots(dto.timeSlotIds),
                                ])];
                        case 1:
                            _a = _d.sent(), room = _a[0], selectedTimeSlots = _a[1];
                            if (!room) {
                                throw new common_1.NotFoundException('Không tìm thấy phòng');
                            }
                            selectedTimeSlotIds = selectedTimeSlots.map(function (timeSlot) { return timeSlot.id; });
                            return [4 /*yield*/, this.findConflictingSlot(room.id, room.roomCode, bookingDate, selectedTimeSlotIds)];
                        case 2:
                            conflictingSlot = _d.sent();
                            if (conflictingSlot) {
                                throw new common_1.ConflictException(this.buildCreateConflictMessage((_b = conflictingSlot.timeSlot) === null || _b === void 0 ? void 0 : _b.label));
                            }
                            booking = null;
                            _d.label = 3;
                        case 3:
                            _d.trys.push([3, 5, , 13]);
                            return [4 /*yield*/, this.createPendingBooking(room.id, userId, bookingDate, selectedTimeSlots, dto)];
                        case 4:
                            booking = _d.sent();
                            return [3 /*break*/, 13];
                        case 5:
                            error_1 = _d.sent();
                            if (!this.isUniqueConstraintError(error_1)) return [3 /*break*/, 12];
                            return [4 /*yield*/, this.releaseInactiveSlotConstraints(room.id, bookingDate, selectedTimeSlotIds)];
                        case 6:
                            releasedInactiveSlots = _d.sent();
                            if (!releasedInactiveSlots) return [3 /*break*/, 10];
                            _d.label = 7;
                        case 7:
                            _d.trys.push([7, 9, , 10]);
                            return [4 /*yield*/, this.createPendingBooking(room.id, userId, bookingDate, selectedTimeSlots, dto)];
                        case 8:
                            booking = _d.sent();
                            return [3 /*break*/, 10];
                        case 9:
                            retryError_1 = _d.sent();
                            if (!this.isUniqueConstraintError(retryError_1)) {
                                throw retryError_1;
                            }
                            return [3 /*break*/, 10];
                        case 10:
                            if (booking) {
                                return [2 /*return*/, this.getBookingById(booking.id)];
                            }
                            return [4 /*yield*/, this.findConflictingSlot(room.id, room.roomCode, bookingDate, selectedTimeSlotIds)];
                        case 11:
                            raceConflictingSlot = _d.sent();
                            throw new common_1.ConflictException(this.buildCreateConflictMessage((_c = raceConflictingSlot === null || raceConflictingSlot === void 0 ? void 0 : raceConflictingSlot.timeSlot) === null || _c === void 0 ? void 0 : _c.label));
                        case 12: throw error_1;
                        case 13:
                            if (!booking) {
                                throw new common_1.ConflictException('Không thể tạo yêu cầu đặt phòng.');
                            }
                            return [2 /*return*/, this.getBookingById(booking.id)];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.getBuildingRooms = function (buildingCode_1) {
            return __awaiter(this, arguments, void 0, function (buildingCode, filters) {
                var normalizedBuildingCode, _a, dateKey, timeKey, today, timeSlots, currentTimeSlot, where, rooms;
                var _this = this;
                if (filters === void 0) { filters = {}; }
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            normalizedBuildingCode = String(buildingCode || '').trim().toUpperCase();
                            if (!normalizedBuildingCode) {
                                return [2 /*return*/, []];
                            }
                            _a = getBangkokDateTimeParts(), dateKey = _a.dateKey, timeKey = _a.timeKey;
                            today = createUtcDate(dateKey);
                            return [4 /*yield*/, this.prisma.timeSlot.findMany({
                                    orderBy: { slotNumber: 'asc' },
                                })];
                        case 1:
                            timeSlots = _b.sent();
                            currentTimeSlot = timeSlots.find(function (slot) {
                                return isCurrentTimeInSlot(timeKey, slot.startTime, slot.endTime);
                            });
                            where = __assign({ status: ACTIVE_ROOM_STATUS, floor: __assign({ building: {
                                        code: normalizedBuildingCode,
                                    } }, (filters.floorNumber ? { floorNumber: filters.floorNumber } : {})) }, (filters.minCapacity ? { capacity: { gte: filters.minCapacity } } : {}));
                            return [4 /*yield*/, this.prisma.room.findMany({
                                    where: where,
                                    select: {
                                        roomCode: true,
                                        capacity: true,
                                        roomBookingSlots: currentTimeSlot
                                            ? {
                                                where: {
                                                    bookingDate: today,
                                                    timeSlotId: currentTimeSlot.id,
                                                    booking: {
                                                        status: { in: OCCUPYING_BOOKING_STATUSES },
                                                    },
                                                },
                                                select: {
                                                    id: true,
                                                },
                                            }
                                            : false,
                                    },
                                })];
                        case 2:
                            rooms = _b.sent();
                            return [2 /*return*/, rooms
                                    .map(function (room) { return ({
                                    roomCode: room.roomCode,
                                    capacity: room.capacity,
                                    status: _this.resolveRoomStatus(room.roomBookingSlots),
                                }); })
                                    .sort(function (left, right) { return ROOM_CODE_COLLATOR.compare(left.roomCode, right.roomCode); })];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.getRoomSchedule = function (roomCode, weekStart) {
            return __awaiter(this, void 0, void 0, function () {
                var normalizedRoomCode, monday, saturday, room, _a, timeSlots, roomBookingSlots, classMeetings, classMeetingIds, roomScheduleOverrides, bookingByDayAndSlot, _i, roomBookingSlots_1, slot, dayOfWeek, key, cancelledOrMovedClassMeetingByDate, overrideByDayAndSlot, _b, roomScheduleOverrides_1, override, overrideDateKey, dayOfWeek, key, classMeetingByDayAndSlot, _loop_1, _c, classMeetings_1, meeting, days;
                var _d, _e, _f;
                return __generator(this, function (_g) {
                    switch (_g.label) {
                        case 0:
                            normalizedRoomCode = String(roomCode || '').trim().toUpperCase();
                            if (!normalizedRoomCode) {
                                throw new common_1.NotFoundException('Không tìm thấy phòng');
                            }
                            monday = resolveScheduleWeekMonday(weekStart);
                            saturday = addUtcDays(monday, 5);
                            return [4 /*yield*/, this.prisma.room.findFirst({
                                    where: {
                                        roomCode: normalizedRoomCode,
                                        status: ACTIVE_ROOM_STATUS,
                                    },
                                    select: {
                                        id: true,
                                        roomCode: true,
                                        name: true,
                                        capacity: true,
                                        floor: {
                                            select: {
                                                building: {
                                                    select: {
                                                        code: true,
                                                        name: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                })];
                        case 1:
                            room = _g.sent();
                            if (!room) {
                                throw new common_1.NotFoundException('Không tìm thấy phòng');
                            }
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.timeSlot.findMany({
                                        orderBy: { slotNumber: 'asc' },
                                    }),
                                    this.prisma.roomBookingSlot.findMany({
                                        where: {
                                            roomId: room.id,
                                            bookingDate: {
                                                gte: monday,
                                                lte: saturday,
                                            },
                                            booking: {
                                                status: { in: OCCUPYING_BOOKING_STATUSES },
                                            },
                                        },
                                        select: {
                                            bookingId: true,
                                            bookingDate: true,
                                            timeSlotId: true,
                                            booking: {
                                                select: {
                                                    title: true,
                                                    purpose: true,
                                                    contactName: true,
                                                },
                                            },
                                        },
                                    }),
                                    this.prisma.classMeeting.findMany({
                                        where: {
                                            room: {
                                                equals: normalizedRoomCode,
                                                mode: 'insensitive',
                                            },
                                            classSection: {
                                                semester: {
                                                    startDate: { lte: saturday },
                                                    endDate: { gte: monday },
                                                },
                                            },
                                        },
                                        select: {
                                            id: true,
                                            dayOfWeek: true,
                                            startPeriod: true,
                                            endPeriod: true,
                                            startTime: true,
                                            endTime: true,
                                            classSection: {
                                                select: {
                                                    id: true,
                                                    classCode: true,
                                                    course: {
                                                        select: {
                                                            code: true,
                                                            name: true,
                                                        },
                                                    },
                                                    semester: {
                                                        select: {
                                                            startDate: true,
                                                            endDate: true,
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    }),
                                ])];
                        case 2:
                            _a = _g.sent(), timeSlots = _a[0], roomBookingSlots = _a[1], classMeetings = _a[2];
                            classMeetingIds = classMeetings.map(function (meeting) { return meeting.id; });
                            return [4 /*yield*/, this.prisma.roomScheduleOverride.findMany({
                                    where: {
                                        overrideDate: {
                                            gte: monday,
                                            lte: saturday,
                                        },
                                        OR: __spreadArray([
                                            { roomId: room.id }
                                        ], (classMeetingIds.length > 0
                                            ? [{ sourceClassMeetingId: { in: classMeetingIds } }]
                                            : []), true),
                                    },
                                    include: {
                                        timeSlot: {
                                            select: {
                                                id: true,
                                                slotNumber: true,
                                                label: true,
                                                startTime: true,
                                                endTime: true,
                                            },
                                        },
                                    },
                                })];
                        case 3:
                            roomScheduleOverrides = _g.sent();
                            bookingByDayAndSlot = new Map();
                            for (_i = 0, roomBookingSlots_1 = roomBookingSlots; _i < roomBookingSlots_1.length; _i++) {
                                slot = roomBookingSlots_1[_i];
                                dayOfWeek = getRoomBookingDayOfWeek(slot.bookingDate);
                                if (dayOfWeek < 2 || dayOfWeek > 7) {
                                    continue;
                                }
                                key = "".concat(dayOfWeek, ":").concat(slot.timeSlotId);
                                if (!bookingByDayAndSlot.has(key)) {
                                    bookingByDayAndSlot.set(key, {
                                        bookingId: slot.bookingId,
                                        title: (_e = (_d = slot.booking.title) !== null && _d !== void 0 ? _d : slot.booking.contactName) !== null && _e !== void 0 ? _e : 'Đã đặt',
                                        subtitle: (_f = slot.booking.purpose) !== null && _f !== void 0 ? _f : null,
                                    });
                                }
                            }
                            cancelledOrMovedClassMeetingByDate = new Set();
                            overrideByDayAndSlot = new Map();
                            for (_b = 0, roomScheduleOverrides_1 = roomScheduleOverrides; _b < roomScheduleOverrides_1.length; _b++) {
                                override = roomScheduleOverrides_1[_b];
                                overrideDateKey = toDateKey(override.overrideDate);
                                if (override.sourceClassMeetingId &&
                                    (override.type === 'cancel_class' || override.type === 'move_class')) {
                                    cancelledOrMovedClassMeetingByDate.add("".concat(overrideDateKey, ":").concat(override.sourceClassMeetingId));
                                }
                                if (override.roomId !== room.id || override.type === 'cancel_class') {
                                    continue;
                                }
                                dayOfWeek = getRoomBookingDayOfWeek(override.overrideDate);
                                if (dayOfWeek < 2 || dayOfWeek > 7) {
                                    continue;
                                }
                                key = "".concat(dayOfWeek, ":").concat(override.timeSlotId);
                                overrideByDayAndSlot.set(key, {
                                    overrideId: override.id,
                                    title: override.title,
                                    subtitle: override.note,
                                    type: override.type,
                                    sourceClassMeetingId: override.sourceClassMeetingId,
                                });
                            }
                            classMeetingByDayAndSlot = new Map();
                            _loop_1 = function (meeting) {
                                if (meeting.dayOfWeek < 2 || meeting.dayOfWeek > 7) {
                                    return "continue";
                                }
                                var meetingDate = getDateByDayOfWeek(monday, meeting.dayOfWeek);
                                if (!isDateWithinRange(meetingDate, meeting.classSection.semester.startDate, meeting.classSection.semester.endDate)) {
                                    return "continue";
                                }
                                if (cancelledOrMovedClassMeetingByDate.has("".concat(toDateKey(meetingDate), ":").concat(meeting.id))) {
                                    return "continue";
                                }
                                var matchingTimeSlots = timeSlots.filter(function (timeSlot) {
                                    if (meeting.startPeriod != null && meeting.endPeriod != null) {
                                        return (timeSlot.slotNumber >= meeting.startPeriod &&
                                            timeSlot.slotNumber <= meeting.endPeriod);
                                    }
                                    return timeSlot.startTime >= meeting.startTime && timeSlot.endTime <= meeting.endTime;
                                });
                                for (var _h = 0, matchingTimeSlots_1 = matchingTimeSlots; _h < matchingTimeSlots_1.length; _h++) {
                                    var timeSlot = matchingTimeSlots_1[_h];
                                    var key = "".concat(meeting.dayOfWeek, ":").concat(timeSlot.id);
                                    if (!classMeetingByDayAndSlot.has(key)) {
                                        classMeetingByDayAndSlot.set(key, {
                                            classMeetingId: meeting.id,
                                            classSectionId: meeting.classSection.id,
                                            title: meeting.classSection.classCode || meeting.classSection.course.code,
                                            subtitle: meeting.classSection.course.name || meeting.classSection.course.code,
                                        });
                                    }
                                }
                            };
                            for (_c = 0, classMeetings_1 = classMeetings; _c < classMeetings_1.length; _c++) {
                                meeting = classMeetings_1[_c];
                                _loop_1(meeting);
                            }
                            days = FIXED_ROOM_SCHEDULE_DAYS.map(function (day) { return ({
                                dayOfWeek: day.dayOfWeek,
                                dateKey: toDateKey(getDateByDayOfWeek(monday, day.dayOfWeek)),
                                label: day.label,
                                slots: timeSlots.map(function (timeSlot) {
                                    var key = "".concat(day.dayOfWeek, ":").concat(timeSlot.id);
                                    var override = overrideByDayAndSlot.get(key);
                                    if (override) {
                                        return {
                                            timeSlotId: timeSlot.id,
                                            slotNumber: timeSlot.slotNumber,
                                            label: timeSlot.label,
                                            startTime: timeSlot.startTime,
                                            endTime: timeSlot.endTime,
                                            status: 'occupied',
                                            source: 'override',
                                            title: override.title,
                                            subtitle: override.subtitle,
                                            bookingId: null,
                                            classSectionId: null,
                                            overrideId: override.overrideId,
                                            classMeetingId: override.sourceClassMeetingId,
                                            editable: true,
                                            bookable: false,
                                        };
                                    }
                                    var classMeeting = classMeetingByDayAndSlot.get(key);
                                    if (classMeeting) {
                                        return {
                                            timeSlotId: timeSlot.id,
                                            slotNumber: timeSlot.slotNumber,
                                            label: timeSlot.label,
                                            startTime: timeSlot.startTime,
                                            endTime: timeSlot.endTime,
                                            status: 'occupied',
                                            source: 'semester',
                                            title: classMeeting.title,
                                            subtitle: classMeeting.subtitle,
                                            bookingId: null,
                                            classSectionId: classMeeting.classSectionId,
                                            overrideId: null,
                                            classMeetingId: classMeeting.classMeetingId,
                                            editable: true,
                                            bookable: false,
                                        };
                                    }
                                    var booking = bookingByDayAndSlot.get(key);
                                    if (booking) {
                                        return {
                                            timeSlotId: timeSlot.id,
                                            slotNumber: timeSlot.slotNumber,
                                            label: timeSlot.label,
                                            startTime: timeSlot.startTime,
                                            endTime: timeSlot.endTime,
                                            status: 'occupied',
                                            source: 'booking',
                                            title: booking.title,
                                            subtitle: booking.subtitle,
                                            bookingId: booking.bookingId,
                                            classSectionId: null,
                                            overrideId: null,
                                            classMeetingId: null,
                                            editable: true,
                                            bookable: false,
                                        };
                                    }
                                    return {
                                        timeSlotId: timeSlot.id,
                                        slotNumber: timeSlot.slotNumber,
                                        label: timeSlot.label,
                                        startTime: timeSlot.startTime,
                                        endTime: timeSlot.endTime,
                                        status: 'free',
                                        source: null,
                                        title: null,
                                        subtitle: null,
                                        bookingId: null,
                                        classSectionId: null,
                                        overrideId: null,
                                        classMeetingId: null,
                                        editable: true,
                                        bookable: true,
                                    };
                                }),
                            }); });
                            return [2 /*return*/, {
                                    roomCode: room.roomCode,
                                    capacity: room.capacity,
                                    name: room.name,
                                    buildingCode: room.floor.building.code,
                                    buildingName: room.floor.building.name,
                                    weekStart: toDateKey(monday),
                                    days: days,
                                }];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.getBuildings = function () {
            return __awaiter(this, void 0, void 0, function () {
                var buildings, roomSummaries;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.building.findMany({
                                orderBy: { code: 'asc' },
                                select: {
                                    code: true,
                                    name: true,
                                },
                            })];
                        case 1:
                            buildings = _a.sent();
                            return [4 /*yield*/, Promise.all(buildings.map(function (building) { return __awaiter(_this, void 0, void 0, function () {
                                    var rooms, availableRooms;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.getBuildingRooms(building.code)];
                                            case 1:
                                                rooms = _a.sent();
                                                availableRooms = rooms.filter(function (room) { return room.status === ROOM_AVAILABLE_STATUS; }).length;
                                                return [2 /*return*/, {
                                                        id: building.code,
                                                        name: building.name,
                                                        availableRooms: availableRooms,
                                                        totalRooms: rooms.length,
                                                        subtitle: "".concat(availableRooms, " ph\u00F2ng tr\u1ED1ng"),
                                                    }];
                                        }
                                    });
                                }); }))];
                        case 2:
                            roomSummaries = _a.sent();
                            return [2 /*return*/, roomSummaries];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.getMyBookings = function (userId, status) {
            return __awaiter(this, void 0, void 0, function () {
                var bookings;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.roomBooking.findMany({
                                where: __assign({ userId: userId }, (status ? { status: status } : {})),
                                include: roomBookingInclude,
                                orderBy: [{ bookingDate: 'desc' }, { createdAt: 'desc' }],
                            })];
                        case 1:
                            bookings = _a.sent();
                            return [2 /*return*/, bookings.map(function (booking) { return _this.mapBooking(booking); })];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.getAdminBookings = function (status) {
            return __awaiter(this, void 0, void 0, function () {
                var bookings;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.roomBooking.findMany({
                                where: status ? { status: status } : undefined,
                                include: __assign(__assign({}, roomBookingInclude), { user: {
                                        select: {
                                            id: true,
                                            email: true,
                                            firstName: true,
                                            lastName: true,
                                        },
                                    } }),
                                orderBy: [{ bookingDate: 'desc' }, { createdAt: 'desc' }],
                            })];
                        case 1:
                            bookings = _a.sent();
                            return [2 /*return*/, bookings.map(function (booking) { return (__assign(__assign({}, _this.mapBooking(booking)), { requester: {
                                        id: booking.user.id,
                                        email: booking.user.email,
                                        fullName: buildFullName(booking.user.firstName, booking.user.lastName),
                                    } })); })];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.getAdminRequestRooms = function () {
            return __awaiter(this, arguments, void 0, function (status) {
                var bookings, grouped, _i, bookings_1, booking, roomCode, existing, _a, _b, slot;
                var _c;
                if (status === void 0) { status = 'pending'; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.prisma.roomBooking.findMany({
                                where: { status: status },
                                select: {
                                    id: true,
                                    bookingDate: true,
                                    room: {
                                        select: {
                                            roomCode: true,
                                            floor: {
                                                select: {
                                                    building: {
                                                        select: {
                                                            code: true,
                                                            name: true,
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    bookingSlots: {
                                        select: {
                                            timeSlotId: true,
                                        },
                                    },
                                },
                            })];
                        case 1:
                            bookings = _d.sent();
                            grouped = new Map();
                            for (_i = 0, bookings_1 = bookings; _i < bookings_1.length; _i++) {
                                booking = bookings_1[_i];
                                roomCode = booking.room.roomCode;
                                existing = (_c = grouped.get(roomCode)) !== null && _c !== void 0 ? _c : {
                                    roomCode: roomCode,
                                    buildingCode: booking.room.floor.building.code,
                                    buildingName: booking.room.floor.building.name,
                                    requestIds: new Set(),
                                    slotKeys: new Set(),
                                };
                                existing.requestIds.add(booking.id);
                                for (_a = 0, _b = booking.bookingSlots; _a < _b.length; _a++) {
                                    slot = _b[_a];
                                    existing.slotKeys.add("".concat(toDateKey(booking.bookingDate), ":").concat(slot.timeSlotId));
                                }
                                grouped.set(roomCode, existing);
                            }
                            return [2 /*return*/, Array.from(grouped.values())
                                    .map(function (entry) { return ({
                                    roomCode: entry.roomCode,
                                    buildingCode: entry.buildingCode,
                                    buildingName: entry.buildingName,
                                    pendingRequestCount: entry.requestIds.size,
                                    pendingSlotCount: entry.slotKeys.size,
                                }); })
                                    .sort(function (left, right) { return ROOM_CODE_COLLATOR.compare(left.roomCode, right.roomCode); })];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.getAdminRoomRequestSlots = function (roomCode_1) {
            return __awaiter(this, arguments, void 0, function (roomCode, status) {
                var room, slots, grouped, _i, slots_1, slot, bookingDate, key, existing;
                var _a;
                if (status === void 0) { status = 'pending'; }
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.room.findFirst({
                                where: {
                                    roomCode: normalizeRoomText(roomCode),
                                },
                                select: {
                                    id: true,
                                    roomCode: true,
                                },
                            })];
                        case 1:
                            room = _b.sent();
                            if (!room) {
                                throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y phÃ²ng');
                            }
                            return [4 /*yield*/, this.prisma.roomBookingSlot.findMany({
                                    where: {
                                        roomId: room.id,
                                        booking: { status: status },
                                    },
                                    include: {
                                        timeSlot: {
                                            select: {
                                                id: true,
                                                startTime: true,
                                                endTime: true,
                                            },
                                        },
                                        booking: {
                                            select: {
                                                id: true,
                                            },
                                        },
                                    },
                                    orderBy: [{ bookingDate: 'asc' }, { timeSlot: { slotNumber: 'asc' } }],
                                })];
                        case 2:
                            slots = _b.sent();
                            grouped = new Map();
                            for (_i = 0, slots_1 = slots; _i < slots_1.length; _i++) {
                                slot = slots_1[_i];
                                bookingDate = toDateKey(slot.bookingDate);
                                key = "".concat(bookingDate, ":").concat(slot.timeSlotId);
                                existing = (_a = grouped.get(key)) !== null && _a !== void 0 ? _a : {
                                    bookingDate: bookingDate,
                                    startTime: slot.timeSlot.startTime,
                                    endTime: slot.timeSlot.endTime,
                                    timeSlotIds: [slot.timeSlotId],
                                    requestIds: new Set(),
                                };
                                existing.requestIds.add(slot.booking.id);
                                grouped.set(key, existing);
                            }
                            return [2 /*return*/, {
                                    roomCode: room.roomCode,
                                    slots: Array.from(grouped.values()).map(function (entry) { return ({
                                        bookingDate: entry.bookingDate,
                                        startTime: entry.startTime,
                                        endTime: entry.endTime,
                                        timeSlotIds: entry.timeSlotIds,
                                        requestCount: entry.requestIds.size,
                                    }); }),
                                }];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.getAdminSlotRequests = function (roomCode, dateKey, timeSlotId) {
            return __awaiter(this, void 0, void 0, function () {
                var bookingDate, room, timeSlot, bookings;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            bookingDate = parseBookingDate(dateKey);
                            return [4 /*yield*/, this.prisma.room.findFirst({
                                    where: { roomCode: normalizeRoomText(roomCode) },
                                    select: {
                                        id: true,
                                        roomCode: true,
                                    },
                                })];
                        case 1:
                            room = _a.sent();
                            if (!room) {
                                throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y phÃ²ng');
                            }
                            return [4 /*yield*/, this.prisma.timeSlot.findUnique({
                                    where: { id: timeSlotId },
                                    select: {
                                        id: true,
                                        startTime: true,
                                        endTime: true,
                                    },
                                })];
                        case 2:
                            timeSlot = _a.sent();
                            if (!timeSlot) {
                                throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y khung giá»');
                            }
                            return [4 /*yield*/, this.prisma.roomBooking.findMany({
                                    where: {
                                        roomId: room.id,
                                        bookingDate: bookingDate,
                                        status: 'pending',
                                        bookingSlots: {
                                            some: {
                                                timeSlotId: timeSlotId,
                                            },
                                        },
                                    },
                                    include: __assign(__assign({}, roomBookingInclude), { user: {
                                            select: {
                                                id: true,
                                                email: true,
                                                firstName: true,
                                                lastName: true,
                                            },
                                        } }),
                                    orderBy: { createdAt: 'asc' },
                                })];
                        case 3:
                            bookings = _a.sent();
                            return [2 /*return*/, {
                                    roomCode: room.roomCode,
                                    bookingDate: dateKey,
                                    timeSlot: timeSlot,
                                    requests: bookings.map(function (booking) { return (__assign(__assign({}, _this.mapBooking(booking)), { requester: {
                                            id: booking.user.id,
                                            email: booking.user.email,
                                            fullName: buildFullName(booking.user.firstName, booking.user.lastName),
                                        } })); }),
                                }];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.rejectSlotRequests = function (dto, approverId) {
            return __awaiter(this, void 0, void 0, function () {
                var room, bookingDate;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.room.findFirst({
                                where: { roomCode: normalizeRoomText(dto.roomCode) },
                                select: { id: true },
                            })];
                        case 1:
                            room = _b.sent();
                            if (!room) {
                                throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y phÃ²ng');
                            }
                            bookingDate = parseBookingDate(dto.bookingDate);
                            return [4 /*yield*/, this.prisma.roomBooking.updateMany({
                                    where: {
                                        roomId: room.id,
                                        bookingDate: bookingDate,
                                        status: 'pending',
                                        bookingSlots: {
                                            some: {
                                                timeSlotId: {
                                                    in: dto.timeSlotIds,
                                                },
                                            },
                                        },
                                    },
                                    data: {
                                        status: 'rejected',
                                        approvedById: approverId,
                                        approvedAt: new Date(),
                                        notes: ((_a = dto.reason) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                                    },
                                })];
                        case 2:
                            _b.sent();
                            return [2 /*return*/, this.getAdminRoomRequestSlots(dto.roomCode, 'pending')];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.createScheduleOverride = function (dto, adminId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, room, timeSlot, override;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.prisma.room.findFirst({
                                    where: { roomCode: normalizeRoomText(dto.roomCode), status: ACTIVE_ROOM_STATUS },
                                    select: { id: true, roomCode: true },
                                }),
                                this.prisma.timeSlot.findUnique({
                                    where: { id: dto.timeSlotId },
                                    select: { id: true, startTime: true, endTime: true },
                                }),
                            ])];
                        case 1:
                            _a = _c.sent(), room = _a[0], timeSlot = _a[1];
                            if (!room) {
                                throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y phÃ²ng');
                            }
                            if (!timeSlot) {
                                throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y khung giá»');
                            }
                            return [4 /*yield*/, this.prisma.roomScheduleOverride.create({
                                    data: {
                                        roomId: room.id,
                                        overrideDate: parseBookingDate(dto.overrideDate),
                                        timeSlotId: timeSlot.id,
                                        type: dto.type,
                                        title: dto.title.trim(),
                                        note: ((_b = dto.note) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                                        createdById: adminId,
                                    },
                                })];
                        case 2:
                            override = _c.sent();
                            if (!(dto.type === 'maintenance')) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.notifyAffectedClassMeetingsForRoomOverride({
                                    roomCode: room.roomCode,
                                    overrideDate: override.overrideDate,
                                    timeSlotId: override.timeSlotId,
                                    overrideType: override.type,
                                    roomLabel: room.roomCode,
                                    startTime: timeSlot.startTime,
                                    endTime: timeSlot.endTime,
                                    note: override.note,
                                })];
                        case 3:
                            _c.sent();
                            _c.label = 4;
                        case 4: return [2 /*return*/, this.mapScheduleOverride(override)];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.updateScheduleOverride = function (overrideId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.roomScheduleOverride.findUnique({
                                where: { id: overrideId },
                                select: {
                                    id: true,
                                    roomId: true,
                                    overrideDate: true,
                                    timeSlotId: true,
                                    type: true,
                                    sourceClassMeetingId: true,
                                    room: { select: { roomCode: true } },
                                    timeSlot: { select: { startTime: true, endTime: true } },
                                },
                            })];
                        case 1:
                            existing = _a.sent();
                            if (!existing) {
                                throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y lá»‹ch admin');
                            }
                            return [4 /*yield*/, this.prisma.roomScheduleOverride.update({
                                    where: { id: overrideId },
                                    data: __assign(__assign({}, (dto.title != null ? { title: dto.title.trim() } : {})), (dto.note != null ? { note: dto.note.trim() || null } : {})),
                                })];
                        case 2:
                            updated = _a.sent();
                            return [4 /*yield*/, this.notifyScheduleOverrideUpdate(existing, updated.note)];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, this.mapScheduleOverride(updated)];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.deleteScheduleOverride = function (overrideId) {
            return __awaiter(this, void 0, void 0, function () {
                var existing;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.roomScheduleOverride.findUnique({
                                where: { id: overrideId },
                                select: { id: true },
                            })];
                        case 1:
                            existing = _a.sent();
                            if (!existing) {
                                throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y lá»‹ch admin');
                            }
                            return [4 /*yield*/, this.prisma.roomScheduleOverride.delete({ where: { id: overrideId } })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { id: overrideId, deleted: true }];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.cancelClassMeetingOccurrence = function (classMeetingId, dto, adminId) {
            return __awaiter(this, void 0, void 0, function () {
                var meeting, overrideDate, dayOfWeek, timeSlot, room, override;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getClassMeetingForOverride(classMeetingId)];
                        case 1:
                            meeting = _b.sent();
                            overrideDate = parseBookingDate(dto.overrideDate);
                            dayOfWeek = getRoomBookingDayOfWeek(overrideDate);
                            if (dayOfWeek !== meeting.dayOfWeek) {
                                throw new common_1.BadRequestException('NgÃ y há»§y khÃ´ng khá»›p thá»© cá»§a lá»‹ch há»c');
                            }
                            return [4 /*yield*/, this.resolveClassMeetingFirstTimeSlot(meeting)];
                        case 2:
                            timeSlot = _b.sent();
                            return [4 /*yield*/, this.getRoomByCodeOrThrow(meeting.room)];
                        case 3:
                            room = _b.sent();
                            return [4 /*yield*/, this.prisma.roomScheduleOverride.create({
                                    data: {
                                        roomId: room.id,
                                        overrideDate: overrideDate,
                                        timeSlotId: timeSlot.id,
                                        type: 'cancel_class',
                                        title: meeting.classSection.classCode,
                                        note: ((_a = dto.note) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                                        sourceClassMeetingId: meeting.id,
                                        createdById: adminId,
                                    },
                                })];
                        case 4:
                            override = _b.sent();
                            return [4 /*yield*/, this.notifyClassScheduleOverride(meeting, {
                                    overrideDate: overrideDate,
                                    timeSlotId: timeSlot.id,
                                    overrideType: 'cancel_class',
                                    room: meeting.room,
                                    note: override.note,
                                })];
                        case 5:
                            _b.sent();
                            return [2 /*return*/, this.mapScheduleOverride(override)];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.moveClassMeetingOccurrence = function (classMeetingId, dto, adminId) {
            return __awaiter(this, void 0, void 0, function () {
                var meeting, overrideDate, dayOfWeek, _a, room, timeSlot, override;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getClassMeetingForOverride(classMeetingId)];
                        case 1:
                            meeting = _c.sent();
                            overrideDate = parseBookingDate(dto.overrideDate);
                            dayOfWeek = getRoomBookingDayOfWeek(overrideDate);
                            if (dayOfWeek !== meeting.dayOfWeek) {
                                throw new common_1.BadRequestException('NgÃ y Ä‘iá»u chá»‰nh khÃ´ng khá»›p thá»© cá»§a lá»‹ch há»c');
                            }
                            return [4 /*yield*/, Promise.all([
                                    this.getRoomByCodeOrThrow(dto.roomCode),
                                    this.prisma.timeSlot.findUnique({
                                        where: { id: dto.timeSlotId },
                                        select: { id: true },
                                    }),
                                ])];
                        case 2:
                            _a = _c.sent(), room = _a[0], timeSlot = _a[1];
                            if (!timeSlot) {
                                throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y khung giá»');
                            }
                            return [4 /*yield*/, this.prisma.roomScheduleOverride.create({
                                    data: {
                                        roomId: room.id,
                                        overrideDate: overrideDate,
                                        timeSlotId: timeSlot.id,
                                        type: 'move_class',
                                        title: meeting.classSection.classCode,
                                        note: ((_b = dto.note) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                                        sourceClassMeetingId: meeting.id,
                                        createdById: adminId,
                                    },
                                })];
                        case 3:
                            override = _c.sent();
                            return [4 /*yield*/, this.notifyClassScheduleOverride(meeting, {
                                    overrideDate: overrideDate,
                                    timeSlotId: timeSlot.id,
                                    overrideType: 'move_class',
                                    room: room.roomCode,
                                    note: override.note,
                                })];
                        case 4:
                            _c.sent();
                            return [2 /*return*/, this.mapScheduleOverride(override)];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.approveBookingLegacy = function (bookingId, approverId) {
            return __awaiter(this, void 0, void 0, function () {
                var booking, selectedTimeSlotIds, hasConflict;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.roomBooking.findUnique({
                                where: { id: bookingId },
                                include: roomBookingInclude,
                            })];
                        case 1:
                            booking = _b.sent();
                            if (!booking) {
                                throw new common_1.NotFoundException('Không tìm thấy yêu cầu đặt phòng');
                            }
                            if (booking.status !== 'pending') {
                                throw new common_1.BadRequestException('Chỉ có thể duyệt yêu cầu đang chờ');
                            }
                            selectedTimeSlotIds = booking.bookingSlots.map(function (slot) { return slot.timeSlotId; });
                            if (selectedTimeSlotIds.length === 0) {
                                throw new common_1.BadRequestException('Yêu cầu đặt phòng chưa có khung giờ hợp lệ');
                            }
                            return [4 /*yield*/, this.prisma.roomBookingSlot.findFirst({
                                    where: {
                                        bookingId: { not: booking.id },
                                        roomId: booking.roomId,
                                        bookingDate: booking.bookingDate,
                                        timeSlotId: { in: selectedTimeSlotIds },
                                        booking: {
                                            status: {
                                                in: OCCUPYING_BOOKING_STATUSES,
                                            },
                                        },
                                    },
                                    select: {
                                        timeSlot: {
                                            select: {
                                                label: true,
                                            },
                                        },
                                    },
                                })];
                        case 2:
                            hasConflict = _b.sent();
                            if (hasConflict) {
                                throw new common_1.ConflictException(((_a = hasConflict.timeSlot) === null || _a === void 0 ? void 0 : _a.label)
                                    ? "Khung gi\u1EDD ".concat(hasConflict.timeSlot.label, " \u0111\u00E3 \u0111\u01B0\u1EE3c s\u1EED d\u1EE5ng.")
                                    : 'Một hoặc nhiều khung giờ đã được sử dụng.');
                            }
                            return [4 /*yield*/, this.prisma.roomBooking.update({
                                    where: { id: booking.id },
                                    data: {
                                        status: 'approved',
                                        approvedById: approverId,
                                        approvedAt: new Date(),
                                    },
                                })];
                        case 3:
                            _b.sent();
                            return [2 /*return*/, this.getBookingById(booking.id)];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.approveBooking = function (bookingId, approverId) {
            return __awaiter(this, void 0, void 0, function () {
                var booking, selectedTimeSlotIds, roomCode, bookingDate, now;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.roomBooking.findUnique({
                                where: { id: bookingId },
                                include: roomBookingInclude,
                            })];
                        case 1:
                            booking = _a.sent();
                            if (!booking) {
                                throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y yÃªu cáº§u Ä‘áº·t phÃ²ng');
                            }
                            if (booking.status !== 'pending') {
                                throw new common_1.BadRequestException('Chá»‰ cÃ³ thá»ƒ duyá»‡t yÃªu cáº§u Ä‘ang chá»');
                            }
                            selectedTimeSlotIds = booking.bookingSlots.map(function (slot) { return slot.timeSlotId; });
                            if (selectedTimeSlotIds.length === 0) {
                                throw new common_1.BadRequestException('YÃªu cáº§u Ä‘áº·t phÃ²ng chÆ°a cÃ³ khung giá» há»£p lá»‡');
                            }
                            roomCode = booking.room.roomCode;
                            bookingDate = booking.bookingDate;
                            now = new Date();
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var latestBooking, latestTimeSlotIds, conflictingSlot, overlappingPendingBookings;
                                    var _a, _b, _c;
                                    return __generator(this, function (_d) {
                                        switch (_d.label) {
                                            case 0: return [4 /*yield*/, tx.roomBooking.findUnique({
                                                    where: { id: booking.id },
                                                    include: roomBookingInclude,
                                                })];
                                            case 1:
                                                latestBooking = _d.sent();
                                                if (!latestBooking) {
                                                    throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y yÃªu cáº§u Ä‘áº·t phÃ²ng');
                                                }
                                                if (latestBooking.status !== 'pending') {
                                                    throw new common_1.BadRequestException('YÃªu cáº§u nÃ y khÃ´ng cÃ²n á»Ÿ tráº¡ng thÃ¡i chá» duyá»‡t');
                                                }
                                                latestTimeSlotIds = latestBooking.bookingSlots.map(function (slot) { return slot.timeSlotId; });
                                                return [4 /*yield*/, this.findConflictingSlot(latestBooking.roomId, roomCode, bookingDate, latestTimeSlotIds, tx, latestBooking.id)];
                                            case 2:
                                                conflictingSlot = _d.sent();
                                                if (conflictingSlot) {
                                                    throw new common_1.ConflictException(this.buildApproveConflictMessage((_a = conflictingSlot.timeSlot) === null || _a === void 0 ? void 0 : _a.label));
                                                }
                                                return [4 /*yield*/, tx.roomBooking.update({
                                                        where: { id: latestBooking.id },
                                                        data: {
                                                            status: 'approved',
                                                            approvedById: approverId,
                                                            approvedAt: now,
                                                            timeSlotId: (_c = (_b = latestBooking.bookingSlots[0]) === null || _b === void 0 ? void 0 : _b.timeSlotId) !== null && _c !== void 0 ? _c : null,
                                                        },
                                                    })];
                                            case 3:
                                                _d.sent();
                                                return [4 /*yield*/, tx.roomBooking.findMany({
                                                        where: {
                                                            id: { not: latestBooking.id },
                                                            roomId: latestBooking.roomId,
                                                            bookingDate: bookingDate,
                                                            status: 'pending',
                                                            bookingSlots: {
                                                                some: {
                                                                    timeSlotId: {
                                                                        in: latestTimeSlotIds,
                                                                    },
                                                                },
                                                            },
                                                        },
                                                        select: {
                                                            id: true,
                                                        },
                                                    })];
                                            case 4:
                                                overlappingPendingBookings = _d.sent();
                                                if (!(overlappingPendingBookings.length > 0)) return [3 /*break*/, 6];
                                                return [4 /*yield*/, tx.roomBooking.updateMany({
                                                        where: {
                                                            id: {
                                                                in: overlappingPendingBookings.map(function (item) { return item.id; }),
                                                            },
                                                        },
                                                        data: {
                                                            status: 'rejected',
                                                            approvedById: approverId,
                                                            approvedAt: now,
                                                            notes: APPROVAL_REJECT_NOTE,
                                                        },
                                                    })];
                                            case 5:
                                                _d.sent();
                                                _d.label = 6;
                                            case 6: return [2 /*return*/];
                                        }
                                    });
                                }); })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, this.getBookingById(booking.id)];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.rejectBooking = function (bookingId, approverId) {
            return __awaiter(this, void 0, void 0, function () {
                var booking;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.roomBooking.findUnique({
                                where: { id: bookingId },
                                select: { id: true, status: true },
                            })];
                        case 1:
                            booking = _a.sent();
                            if (!booking) {
                                throw new common_1.NotFoundException('Không tìm thấy yêu cầu đặt phòng');
                            }
                            if (booking.status !== 'pending') {
                                throw new common_1.BadRequestException('Chỉ có thể từ chối yêu cầu đang chờ');
                            }
                            return [4 /*yield*/, this.prisma.roomBooking.update({
                                    where: { id: booking.id },
                                    data: {
                                        status: 'rejected',
                                        approvedById: approverId,
                                        approvedAt: new Date(),
                                    },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, this.getBookingById(booking.id)];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.cancelBooking = function (bookingId, userId, isAdmin) {
            return __awaiter(this, void 0, void 0, function () {
                var booking;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.roomBooking.findUnique({
                                where: { id: bookingId },
                                select: {
                                    id: true,
                                    userId: true,
                                    status: true,
                                },
                            })];
                        case 1:
                            booking = _a.sent();
                            if (!booking) {
                                throw new common_1.NotFoundException('Không tìm thấy yêu cầu đặt phòng');
                            }
                            if (!isAdmin && booking.userId !== userId) {
                                throw new common_1.ForbiddenException('Bạn không có quyền hủy yêu cầu này');
                            }
                            if (booking.status === 'cancelled' || booking.status === 'rejected') {
                                return [2 /*return*/, this.getBookingById(booking.id)];
                            }
                            return [4 /*yield*/, this.prisma.roomBooking.update({
                                    where: { id: booking.id },
                                    data: {
                                        status: 'cancelled',
                                    },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, this.getBookingById(booking.id)];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.deleteOwnBooking = function (bookingId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var booking;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.roomBooking.findUnique({
                                where: { id: bookingId },
                                select: {
                                    id: true,
                                    userId: true,
                                },
                            })];
                        case 1:
                            booking = _a.sent();
                            if (!booking) {
                                throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y yÃªu cáº§u Ä‘áº·t phÃ²ng');
                            }
                            if (booking.userId !== userId) {
                                throw new common_1.ForbiddenException('Báº¡n khÃ´ng cÃ³ quyá»n xÃ³a yÃªu cáº§u nÃ y');
                            }
                            return [4 /*yield*/, this.prisma.$transaction([
                                    this.prisma.roomBookingSlot.deleteMany({
                                        where: { bookingId: booking.id },
                                    }),
                                    this.prisma.roomBooking.delete({
                                        where: { id: booking.id },
                                    }),
                                ])];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, {
                                    id: booking.id,
                                    deleted: true,
                                }];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.getBookingById = function (bookingId) {
            return __awaiter(this, void 0, void 0, function () {
                var booking;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.roomBooking.findUnique({
                                where: { id: bookingId },
                                include: roomBookingInclude,
                            })];
                        case 1:
                            booking = _a.sent();
                            if (!booking) {
                                throw new common_1.NotFoundException('Không tìm thấy yêu cầu đặt phòng');
                            }
                            return [2 /*return*/, this.mapBooking(booking)];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.notifyClassScheduleOverride = function (meeting, override) {
            return __awaiter(this, void 0, void 0, function () {
                var isMove, dateKey, roomLabel;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!this.notificationsService) {
                                return [2 /*return*/];
                            }
                            isMove = override.overrideType === 'move_class';
                            dateKey = toDateKey(override.overrideDate);
                            roomLabel = (_b = (_a = override.room) !== null && _a !== void 0 ? _a : meeting.room) !== null && _b !== void 0 ? _b : '--';
                            return [4 /*yield*/, this.notificationsService.createNotificationsForClassSection({
                                    classSectionId: meeting.classSection.id,
                                    title: isMove
                                        ? "L\u1ECBch h\u1ECDc ".concat(meeting.classSection.course.code, " \u0111\u1ED5i ph\u00F2ng")
                                        : "L\u1ECBch h\u1ECDc ".concat(meeting.classSection.course.code, " \u0111\u01B0\u1EE3c c\u1EADp nh\u1EADt"),
                                    body: isMove
                                        ? "".concat(meeting.classSection.classCode, " chuy\u1EC3n sang ph\u00F2ng ").concat(roomLabel, " ng\u00E0y ").concat(dateKey, ".")
                                        : "".concat(meeting.classSection.classCode, " c\u00F3 thay \u0111\u1ED5i l\u1ECBch ng\u00E0y ").concat(dateKey, "."),
                                    type: 'schedule_update',
                                    data: {
                                        classSectionId: meeting.classSection.id,
                                        courseCode: meeting.classSection.course.code,
                                        courseName: meeting.classSection.course.name,
                                        classCode: meeting.classSection.classCode,
                                        room: roomLabel,
                                        date: dateKey,
                                        startTime: meeting.startTime,
                                        endTime: meeting.endTime,
                                        timeSlotId: override.timeSlotId,
                                        overrideType: override.overrideType,
                                        classMeetingId: meeting.id,
                                        note: override.note,
                                    },
                                })];
                        case 1:
                            _c.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.notifyAffectedClassMeetingsForRoomOverride = function (input) {
            return __awaiter(this, void 0, void 0, function () {
                var affectedMeetings;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!this.notificationsService) {
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, this.findAffectedClassMeetingsForRoomOverride(input.roomCode, input.overrideDate, input.timeSlotId)];
                        case 1:
                            affectedMeetings = _a.sent();
                            return [4 /*yield*/, Promise.all(affectedMeetings.map(function (meeting) {
                                    return _this.notifyClassScheduleOverride(meeting, {
                                        overrideDate: input.overrideDate,
                                        timeSlotId: input.timeSlotId,
                                        overrideType: input.overrideType,
                                        room: input.roomLabel,
                                        note: input.note,
                                    });
                                }))];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.notifyScheduleOverrideUpdate = function (existing, note) {
            return __awaiter(this, void 0, void 0, function () {
                var meeting;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!this.notificationsService) {
                                return [2 /*return*/];
                            }
                            if (!existing.sourceClassMeetingId) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.getClassMeetingForOverride(existing.sourceClassMeetingId)];
                        case 1:
                            meeting = _a.sent();
                            return [4 /*yield*/, this.notifyClassScheduleOverride(meeting, {
                                    overrideDate: existing.overrideDate,
                                    timeSlotId: existing.timeSlotId,
                                    overrideType: existing.type,
                                    room: existing.room.roomCode,
                                    note: note,
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                        case 3:
                            if (!(existing.type === 'maintenance')) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.notifyAffectedClassMeetingsForRoomOverride({
                                    roomCode: existing.room.roomCode,
                                    overrideDate: existing.overrideDate,
                                    timeSlotId: existing.timeSlotId,
                                    overrideType: existing.type,
                                    roomLabel: existing.room.roomCode,
                                    startTime: existing.timeSlot.startTime,
                                    endTime: existing.timeSlot.endTime,
                                    note: note,
                                })];
                        case 4:
                            _a.sent();
                            _a.label = 5;
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.findAffectedClassMeetingsForRoomOverride = function (roomCode, overrideDate, timeSlotId) {
            return __awaiter(this, void 0, void 0, function () {
                var timeSlot;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.timeSlot.findUnique({
                                where: { id: timeSlotId },
                                select: {
                                    slotNumber: true,
                                    startTime: true,
                                    endTime: true,
                                },
                            })];
                        case 1:
                            timeSlot = _a.sent();
                            if (!timeSlot) {
                                return [2 /*return*/, []];
                            }
                            return [2 /*return*/, this.prisma.classMeeting.findMany({
                                    where: {
                                        room: {
                                            equals: normalizeRoomText(roomCode),
                                            mode: 'insensitive',
                                        },
                                        dayOfWeek: getRoomBookingDayOfWeek(overrideDate),
                                        classSection: {
                                            semester: {
                                                startDate: { lte: overrideDate },
                                                endDate: { gte: overrideDate },
                                            },
                                        },
                                        OR: [
                                            {
                                                startPeriod: { not: null, lte: timeSlot.slotNumber },
                                                endPeriod: { not: null, gte: timeSlot.slotNumber },
                                            },
                                            {
                                                startPeriod: null,
                                                endPeriod: null,
                                                startTime: { lte: timeSlot.startTime },
                                                endTime: { gte: timeSlot.endTime },
                                            },
                                        ],
                                    },
                                    select: {
                                        id: true,
                                        room: true,
                                        startTime: true,
                                        endTime: true,
                                        classSection: {
                                            select: {
                                                id: true,
                                                classCode: true,
                                                course: {
                                                    select: {
                                                        code: true,
                                                        name: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                })];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.getRoomByCodeOrThrow = function (roomCode) {
            return __awaiter(this, void 0, void 0, function () {
                var normalizedRoomCode, room;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            normalizedRoomCode = normalizeRoomText(roomCode);
                            if (!normalizedRoomCode) {
                                throw new common_1.BadRequestException('Lá»‹ch há»c chÆ°a cÃ³ phÃ²ng há»£p lá»‡');
                            }
                            return [4 /*yield*/, this.prisma.room.findFirst({
                                    where: {
                                        roomCode: normalizedRoomCode,
                                        status: ACTIVE_ROOM_STATUS,
                                    },
                                    select: {
                                        id: true,
                                        roomCode: true,
                                    },
                                })];
                        case 1:
                            room = _a.sent();
                            if (!room) {
                                throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y phÃ²ng');
                            }
                            return [2 /*return*/, room];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.getClassMeetingForOverride = function (classMeetingId) {
            return __awaiter(this, void 0, void 0, function () {
                var meeting;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.classMeeting.findUnique({
                                where: { id: classMeetingId },
                                select: {
                                    id: true,
                                    dayOfWeek: true,
                                    room: true,
                                    startPeriod: true,
                                    endPeriod: true,
                                    startTime: true,
                                    endTime: true,
                                    classSection: {
                                        select: {
                                            id: true,
                                            classCode: true,
                                            course: {
                                                select: {
                                                    code: true,
                                                    name: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            })];
                        case 1:
                            meeting = _a.sent();
                            if (!meeting) {
                                throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y lá»‹ch há»c');
                            }
                            return [2 /*return*/, meeting];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.resolveClassMeetingFirstTimeSlot = function (meeting) {
            return __awaiter(this, void 0, void 0, function () {
                var timeSlot;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.timeSlot.findFirst({
                                where: meeting.startPeriod != null
                                    ? { slotNumber: meeting.startPeriod }
                                    : {
                                        startTime: {
                                            gte: meeting.startTime,
                                        },
                                        endTime: {
                                            lte: meeting.endTime,
                                        },
                                    },
                                orderBy: { slotNumber: 'asc' },
                                select: { id: true },
                            })];
                        case 1:
                            timeSlot = _a.sent();
                            if (!timeSlot) {
                                throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y khung giá» cá»§a lá»‹ch há»c');
                            }
                            return [2 /*return*/, timeSlot];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.getSelectedTimeSlots = function (timeSlotIds) {
            return __awaiter(this, void 0, void 0, function () {
                var requestedTimeSlotIds, timeSlots, orderedTimeSlotIds, isCorrectOrder, index, currentTimeSlot, previousTimeSlot;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            requestedTimeSlotIds = timeSlotIds
                                .map(function (timeSlotId) { return String(timeSlotId || '').trim(); })
                                .filter(Boolean);
                            if (requestedTimeSlotIds.length === 0) {
                                throw new common_1.BadRequestException('Vui lòng chọn ít nhất một khung giờ');
                            }
                            if (new Set(requestedTimeSlotIds).size !== requestedTimeSlotIds.length) {
                                throw new common_1.BadRequestException('Danh sách khung giờ không được trùng nhau');
                            }
                            return [4 /*yield*/, this.prisma.timeSlot.findMany({
                                    where: {
                                        id: {
                                            in: requestedTimeSlotIds,
                                        },
                                    },
                                    orderBy: {
                                        slotNumber: 'asc',
                                    },
                                    select: {
                                        id: true,
                                        slotNumber: true,
                                        label: true,
                                        startTime: true,
                                        endTime: true,
                                    },
                                })];
                        case 1:
                            timeSlots = _a.sent();
                            if (timeSlots.length !== requestedTimeSlotIds.length) {
                                throw new common_1.NotFoundException('Không tìm thấy một hoặc nhiều tiết học');
                            }
                            orderedTimeSlotIds = timeSlots.map(function (timeSlot) { return timeSlot.id; });
                            isCorrectOrder = requestedTimeSlotIds.every(function (timeSlotId, index) { return timeSlotId === orderedTimeSlotIds[index]; });
                            if (!isCorrectOrder) {
                                throw new common_1.BadRequestException('Các khung giờ phải được gửi theo đúng thứ tự liên tiếp');
                            }
                            for (index = 1; index < timeSlots.length; index += 1) {
                                currentTimeSlot = timeSlots[index];
                                previousTimeSlot = timeSlots[index - 1];
                                if (currentTimeSlot.slotNumber !== previousTimeSlot.slotNumber + 1) {
                                    throw new common_1.BadRequestException('Chỉ được chọn các khung giờ liền kề trong cùng một yêu cầu');
                                }
                            }
                            return [2 /*return*/, timeSlots];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.createPendingBooking = function (roomId, userId, bookingDate, selectedTimeSlots, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var firstTimeSlot, lastTimeSlot;
                var _this = this;
                return __generator(this, function (_a) {
                    firstTimeSlot = selectedTimeSlots[0];
                    lastTimeSlot = selectedTimeSlots[selectedTimeSlots.length - 1];
                    return [2 /*return*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var createdBooking, _i, _a, _b, index, timeSlot;
                            var _c, _d, _e, _f;
                            return __generator(this, function (_g) {
                                switch (_g.label) {
                                    case 0: return [4 /*yield*/, tx.roomBooking.create({
                                            data: {
                                                roomId: roomId,
                                                userId: userId,
                                                bookingDate: bookingDate,
                                                timeSlotId: null,
                                                startTime: firstTimeSlot.startTime,
                                                endTime: lastTimeSlot.endTime,
                                                title: ((_c = dto.title) === null || _c === void 0 ? void 0 : _c.trim()) || null,
                                                purpose: dto.purpose.trim(),
                                                attendeeCount: (_d = dto.attendeeCount) !== null && _d !== void 0 ? _d : null,
                                                contactName: dto.contactName.trim(),
                                                contactPhone: ((_e = dto.contactPhone) === null || _e === void 0 ? void 0 : _e.trim()) || null,
                                                departmentName: ((_f = dto.departmentName) === null || _f === void 0 ? void 0 : _f.trim()) || null,
                                                status: CREATED_BOOKING_STATUS,
                                            },
                                            select: {
                                                id: true,
                                            },
                                        })];
                                    case 1:
                                        createdBooking = _g.sent();
                                        _i = 0, _a = selectedTimeSlots.entries();
                                        _g.label = 2;
                                    case 2:
                                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                                        _b = _a[_i], index = _b[0], timeSlot = _b[1];
                                        return [4 /*yield*/, tx.roomBookingSlot.create({
                                                data: {
                                                    bookingId: createdBooking.id,
                                                    roomId: roomId,
                                                    bookingDate: bookingDate,
                                                    timeSlotId: timeSlot.id,
                                                    slotOrder: index + 1,
                                                },
                                            })];
                                    case 3:
                                        _g.sent();
                                        _g.label = 4;
                                    case 4:
                                        _i++;
                                        return [3 /*break*/, 2];
                                    case 5: return [2 /*return*/, createdBooking];
                                }
                            });
                        }); })];
                });
            });
        };
        RoomBookingsService_1.prototype.mapBooking = function (booking) {
            var _a, _b;
            var timeSlots = booking.bookingSlots
                .map(function (slot) { return slot.timeSlot; })
                .sort(function (left, right) { return left.slotNumber - right.slotNumber; });
            return {
                id: booking.id,
                roomCode: booking.room.roomCode,
                roomName: booking.room.name,
                buildingCode: booking.room.floor.building.code,
                buildingName: booking.room.floor.building.name,
                bookingDate: toDateKey(booking.bookingDate),
                timeSlotIds: timeSlots.map(function (timeSlot) { return timeSlot.id; }),
                timeSlots: timeSlots,
                slotCount: timeSlots.length,
                startTime: booking.startTime,
                endTime: booking.endTime,
                title: booking.title,
                purpose: booking.purpose,
                attendeeCount: booking.attendeeCount,
                contactName: booking.contactName,
                contactPhone: booking.contactPhone,
                departmentName: booking.departmentName,
                notes: booking.notes,
                status: booking.status,
                approvedAt: (_b = (_a = booking.approvedAt) === null || _a === void 0 ? void 0 : _a.toISOString()) !== null && _b !== void 0 ? _b : null,
                createdAt: booking.createdAt.toISOString(),
            };
        };
        RoomBookingsService_1.prototype.resolveRoomStatus = function (roomBookingSlots) {
            return roomBookingSlots && roomBookingSlots.length > 0
                ? ROOM_OCCUPIED_STATUS
                : ROOM_AVAILABLE_STATUS;
        };
        RoomBookingsService_1.prototype.buildCreateConflictMessage = function (timeSlotLabel) {
            return timeSlotLabel
                ? "Khung gi\u1EDD ".concat(timeSlotLabel, " \u0111\u00E3 c\u00F3 y\u00EAu c\u1EA7u \u0111\u1EB7t ph\u00F2ng.")
                : 'Một hoặc nhiều khung giờ đã có yêu cầu đặt phòng.';
        };
        RoomBookingsService_1.prototype.buildApproveConflictMessage = function (timeSlotLabel) {
            return timeSlotLabel
                ? "Khung gi\u00E1\u00BB\u009D ".concat(timeSlotLabel, " \u00C4\u2018\u00C3\u00A3 \u00C4\u2018\u00C6\u00B0\u00E1\u00BB\u00A3c s\u00E1\u00BB\u00AD d\u00E1\u00BB\u00A5ng.")
                : 'Má»™t hoáº·c nhiá»u khung giá» Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng.';
        };
        RoomBookingsService_1.prototype.mapScheduleOverride = function (override) {
            return {
                id: override.id,
                roomId: override.roomId,
                overrideDate: toDateKey(override.overrideDate),
                timeSlotId: override.timeSlotId,
                type: override.type,
                title: override.title,
                note: override.note,
                sourceClassMeetingId: override.sourceClassMeetingId,
                createdById: override.createdById,
                createdAt: override.createdAt.toISOString(),
                updatedAt: override.updatedAt.toISOString(),
            };
        };
        RoomBookingsService_1.prototype.findConflictingSlot = function (roomId_1, roomCode_1, bookingDate_1, timeSlotIds_1) {
            return __awaiter(this, arguments, void 0, function (roomId, roomCode, bookingDate, timeSlotIds, prismaClient, excludedBookingId) {
                var selectedTimeSlots, overrideConflict, fixedScheduleConflict, classOverride;
                if (prismaClient === void 0) { prismaClient = this.prisma; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, prismaClient.timeSlot.findMany({
                                where: {
                                    id: {
                                        in: timeSlotIds,
                                    },
                                },
                                select: {
                                    id: true,
                                    slotNumber: true,
                                    startTime: true,
                                    endTime: true,
                                },
                            })];
                        case 1:
                            selectedTimeSlots = _a.sent();
                            return [4 /*yield*/, prismaClient.roomScheduleOverride.findFirst({
                                    where: {
                                        roomId: roomId,
                                        overrideDate: bookingDate,
                                        timeSlotId: {
                                            in: timeSlotIds,
                                        },
                                        type: {
                                            in: ['manual', 'maintenance', 'move_class'],
                                        },
                                    },
                                    select: {
                                        title: true,
                                    },
                                })];
                        case 2:
                            overrideConflict = _a.sent();
                            if (overrideConflict) {
                                return [2 /*return*/, {
                                        timeSlot: {
                                            label: overrideConflict.title,
                                        },
                                    }];
                            }
                            return [4 /*yield*/, prismaClient.classMeeting.findFirst({
                                    where: {
                                        room: {
                                            equals: normalizeRoomText(roomCode),
                                            mode: 'insensitive',
                                        },
                                        dayOfWeek: getRoomBookingDayOfWeek(bookingDate),
                                        classSection: {
                                            semester: {
                                                startDate: { lte: bookingDate },
                                                endDate: { gte: bookingDate },
                                            },
                                        },
                                        OR: selectedTimeSlots.map(function (timeSlot) { return ({
                                            OR: [
                                                {
                                                    startPeriod: { not: null, lte: timeSlot.slotNumber },
                                                    endPeriod: { not: null, gte: timeSlot.slotNumber },
                                                },
                                                {
                                                    startPeriod: null,
                                                    endPeriod: null,
                                                    startTime: { lte: timeSlot.startTime },
                                                    endTime: { gte: timeSlot.endTime },
                                                },
                                            ],
                                        }); }),
                                    },
                                    select: {
                                        id: true,
                                        classSection: {
                                            select: {
                                                classCode: true,
                                            },
                                        },
                                    },
                                })];
                        case 3:
                            fixedScheduleConflict = _a.sent();
                            if (!fixedScheduleConflict) return [3 /*break*/, 5];
                            return [4 /*yield*/, prismaClient.roomScheduleOverride.findFirst({
                                    where: {
                                        sourceClassMeetingId: fixedScheduleConflict.id,
                                        overrideDate: bookingDate,
                                        type: {
                                            in: ['cancel_class', 'move_class'],
                                        },
                                    },
                                    select: {
                                        id: true,
                                    },
                                })];
                        case 4:
                            classOverride = _a.sent();
                            if (classOverride) {
                                return [2 /*return*/, null];
                            }
                            return [2 /*return*/, {
                                    timeSlot: {
                                        label: fixedScheduleConflict.classSection.classCode || 'Lá»‹ch cá»‘ Ä‘á»‹nh',
                                    },
                                }];
                        case 5: return [2 /*return*/, prismaClient.roomBookingSlot.findFirst({
                                where: {
                                    roomId: roomId,
                                    bookingDate: bookingDate,
                                    timeSlotId: {
                                        in: timeSlotIds,
                                    },
                                    booking: __assign(__assign({}, (excludedBookingId ? { id: { not: excludedBookingId } } : {})), { status: {
                                            in: OCCUPYING_BOOKING_STATUSES,
                                        } }),
                                },
                                select: {
                                    timeSlot: {
                                        select: {
                                            label: true,
                                        },
                                    },
                                },
                            })];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.findConflictingSlotLegacy = function (roomId, bookingDate, timeSlotIds) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.roomBookingSlot.findFirst({
                            where: {
                                roomId: roomId,
                                bookingDate: bookingDate,
                                timeSlotId: {
                                    in: timeSlotIds,
                                },
                                booking: {
                                    status: {
                                        in: OCCUPYING_BOOKING_STATUSES,
                                    },
                                },
                            },
                            select: {
                                timeSlot: {
                                    select: {
                                        label: true,
                                    },
                                },
                            },
                        })];
                });
            });
        };
        RoomBookingsService_1.prototype.releaseInactiveSlotConstraints = function (roomId, bookingDate, timeSlotIds) {
            return __awaiter(this, void 0, void 0, function () {
                var inactiveBookings, inactiveBookingIds;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.roomBooking.findMany({
                                where: {
                                    roomId: roomId,
                                    bookingDate: bookingDate,
                                    status: {
                                        in: INACTIVE_BOOKING_STATUSES,
                                    },
                                    OR: [
                                        {
                                            timeSlotId: {
                                                in: timeSlotIds,
                                            },
                                        },
                                        {
                                            bookingSlots: {
                                                some: {
                                                    timeSlotId: {
                                                        in: timeSlotIds,
                                                    },
                                                },
                                            },
                                        },
                                    ],
                                },
                                select: {
                                    id: true,
                                },
                            })];
                        case 1:
                            inactiveBookings = _a.sent();
                            if (inactiveBookings.length === 0) {
                                return [2 /*return*/, false];
                            }
                            inactiveBookingIds = inactiveBookings.map(function (booking) { return booking.id; });
                            return [4 /*yield*/, this.prisma.$transaction([
                                    this.prisma.roomBookingSlot.deleteMany({
                                        where: {
                                            bookingId: {
                                                in: inactiveBookingIds,
                                            },
                                            timeSlotId: {
                                                in: timeSlotIds,
                                            },
                                        },
                                    }),
                                    this.prisma.roomBooking.updateMany({
                                        where: {
                                            id: {
                                                in: inactiveBookingIds,
                                            },
                                            timeSlotId: {
                                                in: timeSlotIds,
                                            },
                                        },
                                        data: {
                                            timeSlotId: null,
                                        },
                                    }),
                                ])];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, true];
                    }
                });
            });
        };
        RoomBookingsService_1.prototype.isUniqueConstraintError = function (error) {
            return Boolean(error &&
                typeof error === 'object' &&
                'code' in error &&
                error.code === 'P2002');
        };
        return RoomBookingsService_1;
    }());
    __setFunctionName(_classThis, "RoomBookingsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RoomBookingsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RoomBookingsService = _classThis;
}();
exports.RoomBookingsService = RoomBookingsService;
