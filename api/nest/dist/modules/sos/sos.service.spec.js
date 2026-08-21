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
var sos_service_1 = require("./sos.service");
describe('SosService', function () {
    var prisma = {
        sosRequest: {
            updateMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        notification: {
            createMany: jest.fn(),
        },
    };
    var configService = {
        get: jest.fn(),
    };
    var realtimeGateway = {
        publish: jest.fn(),
    };
    var service;
    beforeEach(function () {
        jest.clearAllMocks();
        service = new sos_service_1.SosService(prisma, configService, realtimeGateway);
    });
    it('rejects creating a new SOS when user already has one active request', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.sosRequest.findMany.mockResolvedValue([]);
                    prisma.sosRequest.findFirst.mockResolvedValue({
                        id: 'sos-1',
                    });
                    return [4 /*yield*/, expect(service.createRequest('student-1', {
                            lat: 10.8,
                            lng: 106.8,
                        })).rejects.toBeInstanceOf(common_1.BadRequestException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('forbids resolving SOS from unrelated user role', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.sosRequest.findUnique.mockResolvedValue({
                        id: 'sos-1',
                        requesterId: 'student-2',
                        status: client_1.SosRequestStatus.active,
                    });
                    return [4 /*yield*/, expect(service.resolveRequest('student-1', client_1.Role.lecturer, 'sos-1')).rejects.toBeInstanceOf(common_1.ForbiddenException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects route request when TrackAsia key is missing', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.sosRequest.findUnique.mockResolvedValue({
                        id: 'sos-1',
                        latitude: 10.8,
                        longitude: 106.8,
                        status: client_1.SosRequestStatus.active,
                    });
                    configService.get.mockReturnValue(undefined);
                    return [4 /*yield*/, expect(service.getRoute('sos-1', 10.9, 106.9)).rejects.toBeInstanceOf(common_1.BadRequestException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('uses fallback TrackAsia map key for directions when server key is missing', function () { return __awaiter(void 0, void 0, void 0, function () {
        var fetchMock, originalFetch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.sosRequest.findUnique.mockResolvedValue({
                        id: 'sos-1',
                        latitude: 10.8,
                        longitude: 106.8,
                        status: client_1.SosRequestStatus.active,
                    });
                    configService.get.mockImplementation(function (key) {
                        if (key === 'TRACK_ASIA_SERVER_KEY') {
                            return '';
                        }
                        if (key === 'EXPO_PUBLIC_TRACK_ASIA_MAP_KEY') {
                            return 'public-demo-key';
                        }
                        return undefined;
                    });
                    fetchMock = jest.fn().mockResolvedValue({
                        ok: true,
                        json: function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, ({
                                        routes: [
                                            {
                                                overview_polyline: { points: 'encoded' },
                                            },
                                        ],
                                    })];
                            });
                        }); },
                    });
                    originalFetch = global.fetch;
                    global.fetch = fetchMock;
                    return [4 /*yield*/, expect(service.getRoute('sos-1', 10.9, 106.9)).resolves.toEqual({
                            sosId: 'sos-1',
                            route: {
                                routes: [
                                    {
                                        overview_polyline: { points: 'encoded' },
                                    },
                                ],
                            },
                        })];
                case 1:
                    _a.sent();
                    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('key=public-demo-key'));
                    global.fetch = originalFetch;
                    return [2 /*return*/];
            }
        });
    }); });
    it('publishes realtime event when SOS is cancelled', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.sosRequest.findUnique.mockResolvedValue({
                        id: 'sos-1',
                        requesterId: 'student-1',
                        status: client_1.SosRequestStatus.active,
                    });
                    prisma.sosRequest.update.mockResolvedValue({
                        id: 'sos-1',
                        requesterId: 'student-1',
                        resolverId: null,
                        status: client_1.SosRequestStatus.cancelled,
                        latitude: 10.8,
                        longitude: 106.8,
                        accuracyMeters: null,
                        addressSnapshot: null,
                        contactSnapshot: null,
                        note: null,
                        createdAt: new Date('2026-05-08T00:00:00.000Z'),
                        updatedAt: new Date('2026-05-08T00:01:00.000Z'),
                        resolvedAt: new Date('2026-05-08T00:01:00.000Z'),
                        expiresAt: new Date('2026-05-08T06:00:00.000Z'),
                    });
                    return [4 /*yield*/, service.cancelRequest('student-1', 'sos-1')];
                case 1:
                    _a.sent();
                    expect(realtimeGateway.publish).toHaveBeenCalledWith('sos:cancelled', expect.objectContaining({
                        sosId: 'sos-1',
                        request: expect.objectContaining({
                            id: 'sos-1',
                            status: 'cancelled',
                        }),
                    }));
                    return [2 /*return*/];
            }
        });
    }); });
    it('publishes realtime event when SOS is resolved', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.sosRequest.findUnique.mockResolvedValue({
                        id: 'sos-1',
                        requesterId: 'student-2',
                        status: client_1.SosRequestStatus.active,
                    });
                    prisma.sosRequest.update.mockResolvedValue({
                        id: 'sos-1',
                        requesterId: 'student-2',
                        resolverId: 'admin-1',
                        status: client_1.SosRequestStatus.resolved,
                        latitude: 10.8,
                        longitude: 106.8,
                        accuracyMeters: null,
                        addressSnapshot: null,
                        contactSnapshot: null,
                        note: null,
                        createdAt: new Date('2026-05-08T00:00:00.000Z'),
                        updatedAt: new Date('2026-05-08T00:01:00.000Z'),
                        resolvedAt: new Date('2026-05-08T00:01:00.000Z'),
                        expiresAt: new Date('2026-05-08T06:00:00.000Z'),
                    });
                    return [4 /*yield*/, service.resolveRequest('admin-1', client_1.Role.admin, 'sos-1')];
                case 1:
                    _a.sent();
                    expect(realtimeGateway.publish).toHaveBeenCalledWith('sos:resolved', expect.objectContaining({
                        sosId: 'sos-1',
                        request: expect.objectContaining({
                            id: 'sos-1',
                            status: 'resolved',
                        }),
                    }));
                    return [2 /*return*/];
            }
        });
    }); });
    it('publishes realtime events when stale SOS requests expire', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.sosRequest.findMany
                        .mockResolvedValueOnce([
                        {
                            id: 'sos-expired',
                            requesterId: 'student-1',
                            resolverId: null,
                            status: client_1.SosRequestStatus.active,
                            latitude: 10.8,
                            longitude: 106.8,
                            accuracyMeters: null,
                            addressSnapshot: null,
                            contactSnapshot: null,
                            note: null,
                            createdAt: new Date('2026-05-08T00:00:00.000Z'),
                            updatedAt: new Date('2026-05-08T00:00:00.000Z'),
                            resolvedAt: null,
                            expiresAt: new Date('2026-05-07T00:00:00.000Z'),
                        },
                    ])
                        .mockResolvedValueOnce([
                        {
                            id: 'sos-expired',
                            requesterId: 'student-1',
                            resolverId: null,
                            status: client_1.SosRequestStatus.expired,
                            latitude: 10.8,
                            longitude: 106.8,
                            accuracyMeters: null,
                            addressSnapshot: null,
                            contactSnapshot: null,
                            note: null,
                            createdAt: new Date('2026-05-08T00:00:00.000Z'),
                            updatedAt: new Date('2026-05-08T00:01:00.000Z'),
                            resolvedAt: null,
                            expiresAt: new Date('2026-05-07T00:00:00.000Z'),
                        },
                    ]);
                    prisma.sosRequest.findFirst.mockResolvedValue(null);
                    prisma.user.findUnique.mockResolvedValue({
                        id: 'student-1',
                        firstName: 'A',
                        lastName: 'B',
                        email: 'a@example.com',
                        phone: null,
                    });
                    prisma.user.findMany.mockResolvedValue([]);
                    prisma.sosRequest.create.mockResolvedValue({
                        id: 'sos-new',
                        requesterId: 'student-1',
                        resolverId: null,
                        status: client_1.SosRequestStatus.active,
                        latitude: 10.8,
                        longitude: 106.8,
                        accuracyMeters: null,
                        addressSnapshot: null,
                        contactSnapshot: null,
                        note: null,
                        createdAt: new Date('2026-05-08T00:02:00.000Z'),
                        updatedAt: new Date('2026-05-08T00:02:00.000Z'),
                        resolvedAt: null,
                        expiresAt: new Date('2026-05-08T06:00:00.000Z'),
                    });
                    jest
                        .spyOn(service, 'reverseGeocode')
                        .mockResolvedValue(null);
                    return [4 /*yield*/, service.createRequest('student-1', {
                            lat: 10.8,
                            lng: 106.8,
                        })];
                case 1:
                    _a.sent();
                    expect(realtimeGateway.publish).toHaveBeenCalledWith('sos:expired', expect.objectContaining({
                        sosId: 'sos-expired',
                        request: expect.objectContaining({
                            id: 'sos-expired',
                            status: 'expired',
                        }),
                    }));
                    return [2 /*return*/];
            }
        });
    }); });
});
