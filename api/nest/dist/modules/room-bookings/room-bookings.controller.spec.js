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
var testing_1 = require("@nestjs/testing");
var room_bookings_controller_1 = require("./room-bookings.controller");
var room_bookings_service_1 = require("./room-bookings.service");
describe('RoomBookingsController', function () {
    var controller;
    var service;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var module;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, testing_1.Test.createTestingModule({
                        controllers: [room_bookings_controller_1.RoomBookingsController],
                        providers: [
                            {
                                provide: room_bookings_service_1.RoomBookingsService,
                                useValue: {
                                    createRoomBooking: jest.fn().mockResolvedValue({
                                        id: 'booking-1',
                                        roomCode: 'B1.02',
                                        roomName: null,
                                        buildingCode: 'B',
                                        buildingName: 'Tòa B',
                                        bookingDate: '2026-04-24',
                                        timeSlotIds: ['slot-1', 'slot-2'],
                                        timeSlots: [
                                            {
                                                id: 'slot-1',
                                                slotNumber: 1,
                                                label: 'Tiết 1',
                                                startTime: '07:30',
                                                endTime: '08:15',
                                            },
                                            {
                                                id: 'slot-2',
                                                slotNumber: 2,
                                                label: 'Tiết 2',
                                                startTime: '08:15',
                                                endTime: '09:00',
                                            },
                                        ],
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
                                    }),
                                    getRoomSchedule: jest.fn().mockResolvedValue({
                                        roomCode: 'B1.02',
                                        buildingCode: 'B',
                                        buildingName: 'Tòa B',
                                        capacity: 60,
                                        name: null,
                                        weekStart: '2026-04-27',
                                        days: [],
                                    }),
                                    getBuildingRooms: jest.fn().mockResolvedValue([
                                        {
                                            roomCode: 'B1.02',
                                            capacity: 60,
                                            status: 'Trống hiện tại',
                                        },
                                    ]),
                                    deleteOwnBooking: jest.fn().mockResolvedValue({
                                        id: 'booking-1',
                                        deleted: true,
                                    }),
                                },
                            },
                        ],
                    }).compile()];
                case 1:
                    module = _a.sent();
                    controller = module.get(room_bookings_controller_1.RoomBookingsController);
                    service = module.get(room_bookings_service_1.RoomBookingsService);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should create a room booking with pending status', function () { return __awaiter(void 0, void 0, void 0, function () {
        var dto, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dto = {
                        roomCode: 'B1.02',
                        bookingDate: '2026-04-24',
                        timeSlotIds: ['slot-1', 'slot-2'],
                        title: 'SE346 Team Meeting',
                        purpose: 'Học nhóm',
                        contactName: 'Nguyen Van A',
                        attendeeCount: 5,
                        contactPhone: '0901234567',
                        departmentName: 'Khoa Công nghệ phần mềm',
                        status: 'booked',
                    };
                    return [4 /*yield*/, controller.createRoomBooking('user-1', dto)];
                case 1:
                    result = _a.sent();
                    expect(service.createRoomBooking).toHaveBeenCalledWith('user-1', dto);
                    expect(result).toMatchObject({
                        id: 'booking-1',
                        roomCode: 'B1.02',
                        timeSlotIds: ['slot-1', 'slot-2'],
                        status: 'pending',
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('should return the fixed weekly schedule for a room', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, controller.getRoomSchedule('B1.02', undefined)];
                case 1:
                    result = _a.sent();
                    expect(service.getRoomSchedule).toHaveBeenCalledWith('B1.02', undefined);
                    expect(result).toEqual({
                        roomCode: 'B1.02',
                        buildingCode: 'B',
                        buildingName: 'Tòa B',
                        capacity: 60,
                        name: null,
                        weekStart: '2026-04-27',
                        days: [],
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('should return rooms for the requested building code', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, controller.getBuildingRooms('B')];
                case 1:
                    result = _a.sent();
                    expect(service.getBuildingRooms).toHaveBeenCalledWith('B', {
                        floorNumber: undefined,
                        minCapacity: undefined,
                    });
                    expect(result).toEqual([
                        {
                            roomCode: 'B1.02',
                            capacity: 60,
                            status: 'Trống hiện tại',
                        },
                    ]);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should parse and forward floor and capacity filters', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, controller.getBuildingRooms('B', '3', '80')];
                case 1:
                    _a.sent();
                    expect(service.getBuildingRooms).toHaveBeenCalledWith('B', {
                        floorNumber: 3,
                        minCapacity: 80,
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('should ignore invalid filter values', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, controller.getBuildingRooms('B', 'abc', '0')];
                case 1:
                    _a.sent();
                    expect(service.getBuildingRooms).toHaveBeenCalledWith('B', {
                        floorNumber: undefined,
                        minCapacity: undefined,
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('should delete a room booking request for the current user', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, controller.deleteOwnBooking('booking-1', 'user-1')];
                case 1:
                    result = _a.sent();
                    expect(service.deleteOwnBooking).toHaveBeenCalledWith('booking-1', 'user-1');
                    expect(result).toEqual({
                        id: 'booking-1',
                        deleted: true,
                    });
                    return [2 /*return*/];
            }
        });
    }); });
});
