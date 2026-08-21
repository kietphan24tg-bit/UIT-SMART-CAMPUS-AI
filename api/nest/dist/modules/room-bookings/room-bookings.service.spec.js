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
var room_bookings_service_1 = require("./room-bookings.service");
var slot1 = {
    id: 'slot-1',
    slotNumber: 1,
    label: 'Tiết 1',
    startTime: '07:30',
    endTime: '08:15',
};
var slot2 = {
    id: 'slot-2',
    slotNumber: 2,
    label: 'Tiết 2',
    startTime: '08:15',
    endTime: '09:00',
};
var slot4 = {
    id: 'slot-4',
    slotNumber: 4,
    label: 'Tiết 4',
    startTime: '10:00',
    endTime: '10:45',
};
describe('RoomBookingsService', function () {
    var service;
    var prisma;
    var notificationsService;
    beforeEach(function () {
        jest.useFakeTimers();
        prisma = {
            timeSlot: {
                findMany: jest.fn(),
                findUnique: jest.fn(),
                findFirst: jest.fn(),
            },
            room: {
                findFirst: jest.fn(),
                findMany: jest.fn(),
            },
            roomBooking: {
                findMany: jest.fn(),
                findUnique: jest.fn(),
                delete: jest.fn(),
                deleteMany: jest.fn(),
                update: jest.fn(),
                updateMany: jest.fn(),
            },
            roomBookingSlot: {
                findFirst: jest.fn(),
                findMany: jest.fn(),
                create: jest.fn(),
                deleteMany: jest.fn(),
            },
            classMeeting: {
                findFirst: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
            },
            roomScheduleOverride: {
                findFirst: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            building: {
                findMany: jest.fn(),
            },
            $transaction: jest.fn(),
        };
        prisma.roomScheduleOverride.findFirst.mockResolvedValue(null);
        prisma.roomScheduleOverride.findMany.mockResolvedValue([]);
        notificationsService = {
            createNotificationsForClassSection: jest.fn(),
        };
        service = new room_bookings_service_1.RoomBookingsService(prisma, notificationsService);
    });
    afterEach(function () {
        jest.useRealTimers();
    });
    describe('createRoomBooking', function () {
        beforeEach(function () {
            jest.setSystemTime(new Date('2026-04-22T10:00:00.000Z'));
        });
        it('creates a multi-slot booking and returns the mapped booking payload', function () { return __awaiter(void 0, void 0, void 0, function () {
            var tx, expectedBooking, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tx = {
                            roomBooking: {
                                create: jest.fn().mockResolvedValue({ id: 'booking-1' }),
                            },
                            roomBookingSlot: {
                                create: jest.fn().mockResolvedValue(undefined),
                            },
                        };
                        expectedBooking = {
                            id: 'booking-1',
                            roomCode: 'B1.02',
                            roomName: null,
                            buildingCode: 'B',
                            buildingName: 'Tòa B',
                            bookingDate: '2026-04-29',
                            timeSlotIds: ['slot-1', 'slot-2'],
                            timeSlots: [slot1, slot2],
                            slotCount: 2,
                            startTime: '07:30',
                            endTime: '09:00',
                            title: 'SE346 Team Meeting',
                            purpose: 'Học nhóm',
                            attendeeCount: 5,
                            contactName: 'Nguyen Van A',
                            contactPhone: '0901234567',
                            departmentName: 'Khoa Công nghệ phần mềm',
                            notes: null,
                            approvedAt: null,
                            status: 'pending',
                            createdAt: '2026-04-23T10:00:00.000Z',
                        };
                        prisma.room.findFirst.mockResolvedValue({ id: 'room-1', roomCode: 'B1.02' });
                        prisma.timeSlot.findMany.mockResolvedValue([slot1, slot2]);
                        prisma.roomBookingSlot.findFirst.mockResolvedValue(null);
                        prisma.$transaction.mockImplementation(function (callback) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, callback(tx)];
                        }); }); });
                        jest
                            .spyOn(service, 'getBookingById')
                            .mockResolvedValue(expectedBooking);
                        return [4 /*yield*/, service.createRoomBooking('user-1', {
                                roomCode: 'b1.02',
                                bookingDate: '2026-04-29',
                                timeSlotIds: ['slot-1', 'slot-2'],
                                title: 'SE346 Team Meeting',
                                purpose: 'Học nhóm',
                                contactName: 'Nguyen Van A',
                                attendeeCount: 5,
                                contactPhone: '0901234567',
                                departmentName: 'Khoa Công nghệ phần mềm',
                            })];
                    case 1:
                        result = _a.sent();
                        expect(tx.roomBooking.create).toHaveBeenCalledWith({
                            data: {
                                roomId: 'room-1',
                                userId: 'user-1',
                                bookingDate: new Date('2026-04-29T00:00:00.000Z'),
                                timeSlotId: null,
                                startTime: '07:30',
                                endTime: '09:00',
                                title: 'SE346 Team Meeting',
                                purpose: 'Học nhóm',
                                attendeeCount: 5,
                                contactName: 'Nguyen Van A',
                                contactPhone: '0901234567',
                                departmentName: 'Khoa Công nghệ phần mềm',
                                status: 'pending',
                            },
                            select: { id: true },
                        });
                        expect(tx.roomBookingSlot.create).toHaveBeenNthCalledWith(1, {
                            data: {
                                bookingId: 'booking-1',
                                roomId: 'room-1',
                                bookingDate: new Date('2026-04-29T00:00:00.000Z'),
                                timeSlotId: 'slot-1',
                                slotOrder: 1,
                            },
                        });
                        expect(tx.roomBookingSlot.create).toHaveBeenNthCalledWith(2, {
                            data: {
                                bookingId: 'booking-1',
                                roomId: 'room-1',
                                bookingDate: new Date('2026-04-29T00:00:00.000Z'),
                                timeSlotId: 'slot-2',
                                slotOrder: 2,
                            },
                        });
                        expect(result).toEqual(expectedBooking);
                        return [2 /*return*/];
                }
            });
        }); });
        it('rejects invalid bookingDate format', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(service.createRoomBooking('user-1', {
                            roomCode: 'B1.02',
                            bookingDate: '2026-04-24T00:00:00.000Z',
                            timeSlotIds: ['slot-1'],
                            purpose: 'Học nhóm',
                            contactName: 'Nguyen Van A',
                        })).rejects.toThrow(common_1.BadRequestException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('rejects booking dates before the first bookable week', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.room.findFirst.mockResolvedValue({ id: 'room-1', roomCode: 'B1.02' });
                        prisma.timeSlot.findMany.mockResolvedValue([slot1]);
                        return [4 /*yield*/, expect(service.createRoomBooking('user-1', {
                                roomCode: 'B1.02',
                                bookingDate: '2026-04-24',
                                timeSlotIds: ['slot-1'],
                                purpose: 'Học nhóm',
                                contactName: 'Nguyen Van A',
                            })).rejects.toThrow(common_1.BadRequestException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('rejects time slots submitted out of order', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.room.findFirst.mockResolvedValue({ id: 'room-1', roomCode: 'B1.02' });
                        prisma.timeSlot.findMany.mockResolvedValue([slot1, slot2]);
                        return [4 /*yield*/, expect(service.createRoomBooking('user-1', {
                                roomCode: 'B1.02',
                                bookingDate: '2026-04-29',
                                timeSlotIds: ['slot-2', 'slot-1'],
                                purpose: 'Học nhóm',
                                contactName: 'Nguyen Van A',
                            })).rejects.toThrow(common_1.BadRequestException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('rejects non-contiguous time slots', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.room.findFirst.mockResolvedValue({ id: 'room-1', roomCode: 'B1.02' });
                        prisma.timeSlot.findMany.mockResolvedValue([slot1, slot4]);
                        return [4 /*yield*/, expect(service.createRoomBooking('user-1', {
                                roomCode: 'B1.02',
                                bookingDate: '2026-04-29',
                                timeSlotIds: ['slot-1', 'slot-4'],
                                purpose: 'Học nhóm',
                                contactName: 'Nguyen Van A',
                            })).rejects.toThrow(common_1.BadRequestException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('rejects when one of the selected slots is already booked', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.room.findFirst.mockResolvedValue({ id: 'room-1', roomCode: 'B1.02' });
                        prisma.timeSlot.findMany.mockResolvedValue([slot1, slot2]);
                        prisma.roomBookingSlot.findFirst.mockResolvedValue({
                            timeSlot: { label: 'Tiết 2' },
                        });
                        return [4 /*yield*/, expect(service.createRoomBooking('user-1', {
                                roomCode: 'B1.02',
                                bookingDate: '2026-04-29',
                                timeSlotIds: ['slot-1', 'slot-2'],
                                purpose: 'Học nhóm',
                                contactName: 'Nguyen Van A',
                            })).rejects.toThrow(new common_1.ConflictException('Khung giờ Tiết 2 đã có yêu cầu đặt phòng.'))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('maps unique-constraint races to ConflictException', function () { return __awaiter(void 0, void 0, void 0, function () {
            var tx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tx = {
                            roomBooking: {
                                create: jest.fn().mockResolvedValue({ id: 'booking-1' }),
                            },
                            roomBookingSlot: {
                                create: jest.fn(),
                            },
                        };
                        prisma.room.findFirst.mockResolvedValue({ id: 'room-1', roomCode: 'B1.02' });
                        prisma.timeSlot.findMany.mockResolvedValue([slot1, slot2]);
                        prisma.roomBooking.findMany.mockResolvedValue([]);
                        prisma.roomBookingSlot.findFirst
                            .mockResolvedValueOnce(null)
                            .mockResolvedValueOnce({
                            timeSlot: { label: 'Tiết 1' },
                        });
                        prisma.$transaction.mockImplementation(function (callback) { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, callback(tx)];
                                    case 1:
                                        _a.sent();
                                        throw { code: 'P2002' };
                                }
                            });
                        }); });
                        return [4 /*yield*/, expect(service.createRoomBooking('user-1', {
                                roomCode: 'B1.02',
                                bookingDate: '2026-04-29',
                                timeSlotIds: ['slot-1', 'slot-2'],
                                purpose: 'Học nhóm',
                                contactName: 'Nguyen Van A',
                            })).rejects.toThrow(new common_1.ConflictException('Khung giờ Tiết 1 đã có yêu cầu đặt phòng.'))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getBuildingRooms', function () {
        it('uses roomBookingSlots for the current time slot and sorts room codes naturally', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        jest.setSystemTime(new Date('2026-04-22T01:00:00.000Z'));
                        prisma.timeSlot.findMany.mockResolvedValue([slot1, slot2]);
                        prisma.room.findMany.mockResolvedValue([
                            { roomCode: 'B1.10', capacity: 70, roomBookingSlots: [] },
                            { roomCode: 'B1.02', capacity: 60, roomBookingSlots: [{ id: 'booking-slot-1' }] },
                            { roomCode: 'B1.01', capacity: 60, roomBookingSlots: [] },
                        ]);
                        return [4 /*yield*/, service.getBuildingRooms('b')];
                    case 1:
                        result = _a.sent();
                        expect(prisma.room.findMany).toHaveBeenCalledWith({
                            where: {
                                status: 'active',
                                floor: {
                                    building: {
                                        code: 'B',
                                    },
                                },
                            },
                            select: {
                                roomCode: true,
                                capacity: true,
                                roomBookingSlots: {
                                    where: {
                                        bookingDate: new Date('2026-04-22T00:00:00.000Z'),
                                        timeSlotId: 'slot-1',
                                        booking: {
                                            status: { in: ['approved', 'booked', 'maintenance'] },
                                        },
                                    },
                                    select: { id: true },
                                },
                            },
                        });
                        expect(result).toEqual([
                            { roomCode: 'B1.01', capacity: 60, status: 'Trống hiện tại' },
                            { roomCode: 'B1.02', capacity: 60, status: 'Đang được sử dụng' },
                            { roomCode: 'B1.10', capacity: 70, status: 'Trống hiện tại' },
                        ]);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getRoomSchedule', function () {
        it('returns schedule data with fixed schedule taking priority over approved bookings', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        jest.setSystemTime(new Date('2026-04-22T01:00:00.000Z'));
                        prisma.room.findFirst.mockResolvedValue({
                            id: 'room-1',
                            roomCode: 'B1.02',
                            name: null,
                            capacity: 60,
                            floor: {
                                building: {
                                    code: 'B',
                                    name: 'Tòa B',
                                },
                            },
                        });
                        prisma.timeSlot.findMany.mockResolvedValue([slot1, slot2]);
                        prisma.roomBookingSlot.findMany.mockResolvedValue([
                            {
                                bookingId: 'booking-1',
                                bookingDate: new Date('2026-05-04T00:00:00.000Z'),
                                timeSlotId: 'slot-1',
                                booking: {
                                    title: 'SE346.Q22',
                                    purpose: 'Học nhóm',
                                    contactName: 'Nguyen Van A',
                                },
                            },
                            {
                                bookingId: 'booking-2',
                                bookingDate: new Date('2026-05-05T00:00:00.000Z'),
                                timeSlotId: 'slot-2',
                                booking: {
                                    title: null,
                                    purpose: 'Workshop',
                                    contactName: 'Tran Thi B',
                                },
                            },
                        ]);
                        prisma.classMeeting.findMany.mockResolvedValue([
                            {
                                dayOfWeek: 2,
                                startPeriod: 1,
                                endPeriod: 1,
                                startTime: '07:30',
                                endTime: '08:15',
                                classSection: {
                                    id: 'section-1',
                                    classCode: 'SE346.Q22',
                                    course: {
                                        code: 'SE346',
                                        name: 'Software Engineering',
                                    },
                                    semester: {
                                        startDate: new Date('2026-01-01T00:00:00.000Z'),
                                        endDate: new Date('2026-12-31T00:00:00.000Z'),
                                    },
                                },
                            },
                        ]);
                        return [4 /*yield*/, service.getRoomSchedule('b1.02', '2026-05-04')];
                    case 1:
                        result = _c.sent();
                        expect(prisma.roomBookingSlot.findMany).toHaveBeenCalledWith({
                            where: {
                                roomId: 'room-1',
                                bookingDate: {
                                    gte: new Date('2026-05-04T00:00:00.000Z'),
                                    lte: new Date('2026-05-09T00:00:00.000Z'),
                                },
                                booking: {
                                    status: { in: ['approved', 'booked', 'maintenance'] },
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
                        });
                        expect(result).toMatchObject({
                            roomCode: 'B1.02',
                            capacity: 60,
                            name: null,
                            buildingCode: 'B',
                            buildingName: 'Tòa B',
                            weekStart: '2026-05-04',
                        });
                        expect((_a = result.days[0]) === null || _a === void 0 ? void 0 : _a.slots[0]).toMatchObject({
                            timeSlotId: 'slot-1',
                            slotNumber: 1,
                            label: 'Tiết 1',
                            startTime: '07:30',
                            endTime: '08:15',
                            status: 'occupied',
                            source: 'semester',
                            title: 'SE346.Q22',
                            subtitle: 'Software Engineering',
                            bookingId: null,
                            classSectionId: 'section-1',
                            bookable: false,
                        });
                        expect((_b = result.days[1]) === null || _b === void 0 ? void 0 : _b.slots[1]).toMatchObject({
                            status: 'occupied',
                            source: 'booking',
                            title: 'Tran Thi B',
                            subtitle: 'Workshop',
                            bookingId: 'booking-2',
                            classSectionId: null,
                            bookable: false,
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('throws NotFoundException when room does not exist', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.room.findFirst.mockResolvedValue(null);
                        return [4 /*yield*/, expect(service.getRoomSchedule('missing-room')).rejects.toThrow(common_1.NotFoundException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('approveBooking', function () {
        it('rechecks all selected slots before approving a booking and rejects overlaps', function () { return __awaiter(void 0, void 0, void 0, function () {
            var tx, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tx = {
                            roomBooking: {
                                findUnique: jest.fn().mockResolvedValue({
                                    id: 'booking-1',
                                    roomId: 'room-1',
                                    bookingDate: new Date('2026-04-29T00:00:00.000Z'),
                                    status: 'pending',
                                    bookingSlots: [{ timeSlotId: 'slot-1' }, { timeSlotId: 'slot-2' }],
                                }),
                                findMany: jest.fn().mockResolvedValue([{ id: 'booking-2' }]),
                                update: jest.fn().mockResolvedValue(undefined),
                                updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                            },
                            roomBookingSlot: {
                                findFirst: jest.fn().mockResolvedValue(null),
                            },
                            classMeeting: {
                                findFirst: jest.fn().mockResolvedValue(null),
                            },
                            timeSlot: {
                                findMany: jest.fn().mockResolvedValue([slot1, slot2]),
                            },
                            roomScheduleOverride: {
                                findFirst: jest.fn().mockResolvedValue(null),
                            },
                        };
                        prisma.roomBooking.findUnique.mockResolvedValue({
                            id: 'booking-1',
                            roomId: 'room-1',
                            bookingDate: new Date('2026-04-29T00:00:00.000Z'),
                            status: 'pending',
                            room: {
                                roomCode: 'B1.02',
                            },
                            bookingSlots: [{ timeSlotId: 'slot-1' }, { timeSlotId: 'slot-2' }],
                        });
                        prisma.$transaction.mockImplementation(function (callback) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, callback(tx)];
                        }); }); });
                        jest
                            .spyOn(service, 'getBookingById')
                            .mockResolvedValue({ id: 'booking-1', status: 'approved' });
                        return [4 /*yield*/, service.approveBooking('booking-1', 'admin-1')];
                    case 1:
                        result = _a.sent();
                        expect(tx.roomBookingSlot.findFirst).toHaveBeenCalledWith({
                            where: {
                                roomId: 'room-1',
                                bookingDate: new Date('2026-04-29T00:00:00.000Z'),
                                timeSlotId: { in: ['slot-1', 'slot-2'] },
                                booking: {
                                    id: { not: 'booking-1' },
                                    status: {
                                        in: ['approved', 'booked', 'maintenance'],
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
                        });
                        expect(tx.roomBooking.update).toHaveBeenCalledWith({
                            where: { id: 'booking-1' },
                            data: {
                                status: 'approved',
                                approvedById: 'admin-1',
                                approvedAt: expect.any(Date),
                                timeSlotId: 'slot-1',
                            },
                        });
                        expect(tx.roomBooking.updateMany).toHaveBeenCalledWith({
                            where: {
                                id: {
                                    in: ['booking-2'],
                                },
                            },
                            data: {
                                status: 'rejected',
                                approvedById: 'admin-1',
                                approvedAt: expect.any(Date),
                                notes: 'Slot đã được duyệt cho yêu cầu khác',
                            },
                        });
                        expect(result).toEqual({ id: 'booking-1', status: 'approved' });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('deleteOwnBooking', function () {
        it('deletes the current user booking and its room booking slots', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.roomBooking.findUnique.mockResolvedValue({
                            id: 'booking-1',
                            userId: 'user-1',
                        });
                        prisma.roomBookingSlot.deleteMany.mockResolvedValue({ count: 2 });
                        prisma.roomBooking.delete.mockResolvedValue({ id: 'booking-1' });
                        prisma.$transaction.mockImplementation(function (operations) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, operations];
                        }); }); });
                        return [4 /*yield*/, service.deleteOwnBooking('booking-1', 'user-1')];
                    case 1:
                        result = _a.sent();
                        expect(prisma.roomBookingSlot.deleteMany).toHaveBeenCalledWith({
                            where: { bookingId: 'booking-1' },
                        });
                        expect(prisma.roomBooking.delete).toHaveBeenCalledWith({
                            where: { id: 'booking-1' },
                        });
                        expect(prisma.$transaction).toHaveBeenCalledWith([
                            expect.any(Promise),
                            expect.any(Promise),
                        ]);
                        expect(result).toEqual({ id: 'booking-1', deleted: true });
                        return [2 /*return*/];
                }
            });
        }); });
        it('rejects deleting another user booking', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.roomBooking.findUnique.mockResolvedValue({
                            id: 'booking-1',
                            userId: 'user-2',
                        });
                        return [4 /*yield*/, expect(service.deleteOwnBooking('booking-1', 'user-1')).rejects.toThrow(common_1.ForbiddenException)];
                    case 1:
                        _a.sent();
                        expect(prisma.roomBooking.delete).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('class schedule overrides', function () {
        it('notifies enrolled students when an admin cancels a class meeting occurrence', function () { return __awaiter(void 0, void 0, void 0, function () {
            var meeting;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        meeting = {
                            id: 'meeting-1',
                            dayOfWeek: 2,
                            room: 'B1.02',
                            startPeriod: 1,
                            endPeriod: 2,
                            startTime: '07:30',
                            endTime: '09:00',
                            classSection: {
                                id: 'section-1',
                                classCode: 'SE346.Q21',
                                course: {
                                    code: 'SE346',
                                    name: 'Mobile',
                                },
                            },
                        };
                        prisma.classMeeting.findUnique.mockResolvedValue(meeting);
                        prisma.timeSlot.findFirst.mockResolvedValue({ id: 'slot-1' });
                        prisma.room.findFirst.mockResolvedValue({ id: 'room-1', roomCode: 'B1.02' });
                        prisma.roomScheduleOverride.create.mockResolvedValue({
                            id: 'override-1',
                            roomId: 'room-1',
                            overrideDate: new Date('2026-05-04T00:00:00.000Z'),
                            timeSlotId: 'slot-1',
                            type: 'cancel_class',
                            title: 'SE346.Q21',
                            note: 'Phòng bảo trì',
                            sourceClassMeetingId: 'meeting-1',
                            createdById: 'admin-1',
                            createdAt: new Date('2026-04-30T00:00:00.000Z'),
                            updatedAt: new Date('2026-04-30T00:00:00.000Z'),
                        });
                        notificationsService.createNotificationsForClassSection.mockResolvedValue({
                            count: 2,
                        });
                        return [4 /*yield*/, service.cancelClassMeetingOccurrence('meeting-1', { overrideDate: '2026-05-04', note: 'Phòng bảo trì' }, 'admin-1')];
                    case 1:
                        _a.sent();
                        expect(notificationsService.createNotificationsForClassSection).toHaveBeenCalledWith(expect.objectContaining({
                            classSectionId: 'section-1',
                            type: 'schedule_update',
                            data: expect.objectContaining({
                                classSectionId: 'section-1',
                                courseCode: 'SE346',
                                courseName: 'Mobile',
                                classCode: 'SE346.Q21',
                                date: '2026-05-04',
                                overrideType: 'cancel_class',
                                classMeetingId: 'meeting-1',
                            }),
                        }));
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
