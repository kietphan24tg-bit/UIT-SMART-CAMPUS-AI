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
var testing_1 = require("@nestjs/testing");
var prisma_service_1 = require("../../database/prisma.service");
var notifications_service_1 = require("../notifications/notifications.service");
var parking_service_1 = require("../parking/parking.service");
var iot_service_1 = require("./iot.service");
var parking_realtime_gateway_1 = require("./parking-realtime.gateway");
describe('IotService', function () {
    var service;
    var prisma;
    var realtimeGateway;
    var notificationsService;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var module;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    notificationsService = {
                        createSystemNotifications: jest.fn(),
                    };
                    return [4 /*yield*/, testing_1.Test.createTestingModule({
                            providers: [
                                iot_service_1.IotService,
                                {
                                    provide: notifications_service_1.NotificationsService,
                                    useValue: notificationsService,
                                },
                                {
                                    provide: parking_service_1.ParkingService,
                                    useValue: {
                                        getStatus: jest.fn().mockResolvedValue({
                                            gateId: 'uit-gate-a',
                                            totalSlots: 2,
                                            occupiedSlots: 1,
                                            availableSlots: 1,
                                            activeSessions: 0,
                                            lastUpdated: '2026-04-14T10:00:00.000Z',
                                            sensors: {
                                                temperature: 30,
                                                humidity: 70,
                                                rainDetected: false,
                                                fireDetected: false,
                                                deviceIp: '192.168.1.10',
                                                reportedAt: '2026-04-14T10:00:00.000Z',
                                            },
                                            slots: [],
                                        }),
                                    },
                                },
                                {
                                    provide: parking_realtime_gateway_1.ParkingRealtimeGateway,
                                    useValue: {
                                        publishParkingStatus: jest.fn(),
                                        publishTelemetrySnapshot: jest.fn(),
                                    },
                                },
                                {
                                    provide: prisma_service_1.PrismaService,
                                    useValue: {
                                        telemetrySnapshot: {
                                            create: jest.fn(),
                                            findFirst: jest.fn(),
                                        },
                                        parkingSlot: {
                                            deleteMany: jest.fn(),
                                            upsert: jest.fn(),
                                            count: jest.fn(),
                                        },
                                        vehicle: {
                                            findUnique: jest.fn(),
                                        },
                                        parkingSession: {
                                            findFirst: jest.fn(),
                                            update: jest.fn(),
                                            create: jest.fn(),
                                        },
                                        fireAlert: {
                                            create: jest.fn(),
                                            findMany: jest.fn(),
                                            findUnique: jest.fn(),
                                            count: jest.fn(),
                                            update: jest.fn(),
                                            delete: jest.fn(),
                                            deleteMany: jest.fn(),
                                        },
                                    },
                                },
                            ],
                        }).compile()];
                case 1:
                    module = _a.sent();
                    service = module.get(iot_service_1.IotService);
                    prisma = module.get(prisma_service_1.PrismaService);
                    realtimeGateway = module.get(parking_realtime_gateway_1.ParkingRealtimeGateway);
                    return [2 /*return*/];
            }
        });
    }); });
    it('normalizes telemetry to A1-A2 and removes legacy slots', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.telemetrySnapshot.create.mockResolvedValue({
                        id: 'snapshot-1',
                    });
                    prisma.parkingSlot.deleteMany.mockResolvedValue({ count: 2 });
                    prisma.parkingSlot.upsert.mockResolvedValue({});
                    return [4 /*yield*/, service.recordTelemetry({
                            gateId: 'uit-gate-a',
                            deviceIp: '192.168.1.10',
                            slotBitmap: '0101',
                            slots: [
                                { slotNumber: 'A1', occupied: false },
                                { slotNumber: 'A2', occupied: true },
                                { slotNumber: 'A3', occupied: false },
                                { slotNumber: 'A4', occupied: true },
                            ],
                            temperature: 30,
                            humidity: 70,
                            rainDetected: false,
                            fireDetected: false,
                            reportedAt: '2026-04-14T10:00:00.000Z',
                        })];
                case 1:
                    _a.sent();
                    expect(prisma.telemetrySnapshot.create).toHaveBeenCalledWith(expect.objectContaining({
                        data: expect.objectContaining({
                            slotBitmap: '01',
                            slots: [
                                { slotNumber: 'A1', zone: 'Main', isOccupied: false, vehiclePlate: null },
                                { slotNumber: 'A2', zone: 'Main', isOccupied: true, vehiclePlate: null },
                            ],
                        }),
                    }));
                    expect(prisma.parkingSlot.deleteMany).toHaveBeenCalledWith({
                        where: {
                            gateId: 'uit-gate-a',
                            slotNumber: { notIn: ['A1', 'A2'] },
                        },
                    });
                    expect(prisma.parkingSlot.upsert).toHaveBeenCalledTimes(2);
                    expect(realtimeGateway.publishTelemetrySnapshot).toHaveBeenCalledWith('uit-gate-a', expect.objectContaining({
                        id: 'snapshot-1',
                    }));
                    expect(realtimeGateway.publishParkingStatus).toHaveBeenCalledWith('uit-gate-a', expect.objectContaining({
                        gateId: 'uit-gate-a',
                        totalSlots: 2,
                    }));
                    return [2 /*return*/];
            }
        });
    }); });
    it('creates a fire alert on MQTT fire edge', function () { return __awaiter(void 0, void 0, void 0, function () {
        var reportedAt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    reportedAt = new Date('2026-04-14T10:00:00.000Z');
                    prisma.telemetrySnapshot.findFirst.mockResolvedValue({
                        id: 'snapshot-prev',
                        gateId: 'uit-gate-a',
                        fireDetected: false,
                        reportedAt: new Date('2026-04-14T09:59:00.000Z'),
                    });
                    prisma.telemetrySnapshot.create.mockResolvedValue({
                        id: 'snapshot-next',
                        gateId: 'uit-gate-a',
                        fireDetected: true,
                        reportedAt: reportedAt,
                    });
                    prisma.parkingSlot.deleteMany.mockResolvedValue({ count: 0 });
                    prisma.parkingSlot.upsert.mockResolvedValue({});
                    prisma.fireAlert.create.mockResolvedValue({
                        id: 'fire-alert-1',
                        gateId: 'uit-gate-a',
                        reportedAt: reportedAt,
                        message: 'default',
                    });
                    return [4 /*yield*/, service.recordTelemetryFromMqtt({
                            gateId: 'uit-gate-a',
                            deviceIp: '192.168.1.10',
                            slotBitmap: '01',
                            slots: [
                                { slotNumber: 'A1', occupied: false },
                                { slotNumber: 'A2', occupied: true },
                            ],
                            temperature: 30,
                            humidity: 70,
                            rainDetected: false,
                            fireDetected: true,
                            reportedAt: reportedAt.toISOString(),
                        })];
                case 1:
                    _a.sent();
                    expect(prisma.fireAlert.create).toHaveBeenCalledWith(expect.objectContaining({
                        data: expect.objectContaining({
                            gateId: 'uit-gate-a',
                            reportedAt: reportedAt,
                        }),
                    }));
                    expect(notificationsService.createSystemNotifications).toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('creates a rain notification only when telemetry transitions from dry to rain', function () { return __awaiter(void 0, void 0, void 0, function () {
        var reportedAt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    reportedAt = new Date('2026-04-14T11:00:00.000Z');
                    prisma.telemetrySnapshot.findFirst.mockResolvedValue({
                        id: 'snapshot-prev',
                        gateId: 'uit-gate-a',
                        fireDetected: false,
                        rainDetected: false,
                        reportedAt: new Date('2026-04-14T10:59:00.000Z'),
                    });
                    prisma.telemetrySnapshot.create.mockResolvedValue({
                        id: 'snapshot-next',
                        gateId: 'uit-gate-a',
                        fireDetected: false,
                        rainDetected: true,
                        reportedAt: reportedAt,
                    });
                    prisma.parkingSlot.deleteMany.mockResolvedValue({ count: 0 });
                    prisma.parkingSlot.upsert.mockResolvedValue({});
                    return [4 /*yield*/, service.recordTelemetry({
                            gateId: 'uit-gate-a',
                            deviceIp: '192.168.1.10',
                            slotBitmap: '01',
                            slots: [
                                { slotNumber: 'A1', occupied: false },
                                { slotNumber: 'A2', occupied: true },
                            ],
                            temperature: 30,
                            humidity: 70,
                            rainDetected: true,
                            fireDetected: false,
                            reportedAt: reportedAt.toISOString(),
                        })];
                case 1:
                    _a.sent();
                    expect(notificationsService.createSystemNotifications).toHaveBeenCalledWith('Cảnh báo thời tiết tại bãi xe', 'Hệ thống vừa phát hiện mưa tại khu vực bãi xe UIT Campus.', 'rain_alert', {
                        gateId: 'uit-gate-a',
                        telemetrySnapshotId: 'snapshot-next',
                    }, { scope: 'all' });
                    return [2 /*return*/];
            }
        });
    }); });
    it('does not create duplicate rain notifications while rain state stays true', function () { return __awaiter(void 0, void 0, void 0, function () {
        var reportedAt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    reportedAt = new Date('2026-04-14T11:05:00.000Z');
                    prisma.telemetrySnapshot.findFirst.mockResolvedValue({
                        id: 'snapshot-prev',
                        gateId: 'uit-gate-a',
                        fireDetected: false,
                        rainDetected: true,
                        reportedAt: new Date('2026-04-14T11:04:00.000Z'),
                    });
                    prisma.telemetrySnapshot.create.mockResolvedValue({
                        id: 'snapshot-next',
                        gateId: 'uit-gate-a',
                        fireDetected: false,
                        rainDetected: true,
                        reportedAt: reportedAt,
                    });
                    prisma.parkingSlot.deleteMany.mockResolvedValue({ count: 0 });
                    prisma.parkingSlot.upsert.mockResolvedValue({});
                    return [4 /*yield*/, service.recordTelemetry({
                            gateId: 'uit-gate-a',
                            deviceIp: '192.168.1.10',
                            slotBitmap: '01',
                            slots: [
                                { slotNumber: 'A1', occupied: false },
                                { slotNumber: 'A2', occupied: true },
                            ],
                            temperature: 30,
                            humidity: 70,
                            rainDetected: true,
                            fireDetected: false,
                            reportedAt: reportedAt.toISOString(),
                        })];
                case 1:
                    _a.sent();
                    expect(notificationsService.createSystemNotifications).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('returns unresolved fire alert totals alongside the paginated list', function () { return __awaiter(void 0, void 0, void 0, function () {
        var reportedAt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    reportedAt = new Date('2026-08-10T16:00:00.000Z');
                    prisma.fireAlert.findMany.mockResolvedValue([
                        {
                            id: 'fire-alert-1',
                            gateId: 'uit-gate-a',
                            message: 'Phat hien khoi',
                            isResolved: false,
                            reportedAt: reportedAt,
                            resolvedAt: null,
                            telemetrySnapshot: null,
                        },
                    ]);
                    prisma.fireAlert.count
                        .mockResolvedValueOnce(7)
                        .mockResolvedValueOnce(3);
                    return [4 /*yield*/, expect(service.listFireAlerts(1, 10)).resolves.toEqual({
                            items: [
                                expect.objectContaining({
                                    id: 'fire-alert-1',
                                    isResolved: false,
                                }),
                            ],
                            meta: {
                                page: 1,
                                limit: 10,
                                total: 7,
                                unresolvedTotal: 3,
                                totalPages: 1,
                            },
                        })];
                case 1:
                    _a.sent();
                    expect(prisma.fireAlert.count).toHaveBeenNthCalledWith(1);
                    expect(prisma.fireAlert.count).toHaveBeenNthCalledWith(2, {
                        where: { isResolved: false },
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('marks an unread fire alert as read without touching telemetry snapshots', function () { return __awaiter(void 0, void 0, void 0, function () {
        var reportedAt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    reportedAt = new Date('2026-08-10T16:00:00.000Z');
                    prisma.fireAlert.findUnique.mockResolvedValue({
                        id: 'fire-alert-1',
                        gateId: 'uit-gate-a',
                        message: 'Phat hien khoi',
                        isResolved: false,
                        reportedAt: reportedAt,
                        resolvedAt: null,
                        telemetrySnapshot: null,
                    });
                    prisma.fireAlert.update.mockResolvedValue({
                        id: 'fire-alert-1',
                        gateId: 'uit-gate-a',
                        message: 'Phat hien khoi',
                        isResolved: true,
                        reportedAt: reportedAt,
                        resolvedAt: new Date('2026-08-10T16:01:00.000Z'),
                        telemetrySnapshot: null,
                    });
                    return [4 /*yield*/, expect(service.markFireAlertAsRead('fire-alert-1')).resolves.toEqual(expect.objectContaining({
                            id: 'fire-alert-1',
                            isResolved: true,
                        }))];
                case 1:
                    _a.sent();
                    expect(prisma.fireAlert.findUnique).toHaveBeenCalledWith({
                        where: { id: 'fire-alert-1' },
                        include: { telemetrySnapshot: true },
                    });
                    expect(prisma.fireAlert.update).toHaveBeenCalledWith({
                        where: { id: 'fire-alert-1' },
                        data: {
                            isResolved: true,
                            resolvedAt: expect.any(Date),
                        },
                        include: { telemetrySnapshot: true },
                    });
                    expect(prisma.telemetrySnapshot.create).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('deletes a fire alert without touching telemetry snapshots', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.fireAlert.findUnique.mockResolvedValue({ id: 'fire-alert-1' });
                    prisma.fireAlert.delete.mockResolvedValue({ id: 'fire-alert-1' });
                    return [4 /*yield*/, expect(service.deleteFireAlert('fire-alert-1')).resolves.toEqual({ deleted: true })];
                case 1:
                    _a.sent();
                    expect(prisma.fireAlert.findUnique).toHaveBeenCalledWith({
                        where: { id: 'fire-alert-1' },
                        select: { id: true },
                    });
                    expect(prisma.fireAlert.delete).toHaveBeenCalledWith({
                        where: { id: 'fire-alert-1' },
                    });
                    expect(prisma.telemetrySnapshot.create).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects deleting a missing fire alert', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.fireAlert.findUnique.mockResolvedValue(null);
                    return [4 /*yield*/, expect(service.deleteFireAlert('missing-alert')).rejects.toBeInstanceOf(common_1.NotFoundException)];
                case 1:
                    _a.sent();
                    expect(prisma.fireAlert.delete).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('deletes all fire alerts through the fireAlert model only', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.fireAlert.deleteMany.mockResolvedValue({ count: 3 });
                    return [4 /*yield*/, expect(service.deleteFireAlerts()).resolves.toEqual({ count: 3 })];
                case 1:
                    _a.sent();
                    expect(prisma.fireAlert.deleteMany).toHaveBeenCalledWith();
                    expect(prisma.telemetrySnapshot.create).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
});
