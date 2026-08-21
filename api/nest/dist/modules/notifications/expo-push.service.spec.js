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
var axios_1 = require("axios");
var testing_1 = require("@nestjs/testing");
var prisma_service_1 = require("../../database/prisma.service");
var expo_push_service_1 = require("./expo-push.service");
jest.mock('axios');
describe('ExpoPushService', function () {
    var service;
    var prisma;
    var mockedAxios = axios_1.default;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var module;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, testing_1.Test.createTestingModule({
                        providers: [
                            expo_push_service_1.ExpoPushService,
                            {
                                provide: prisma_service_1.PrismaService,
                                useValue: {
                                    userDevicePushToken: {
                                        findMany: jest.fn(),
                                        updateMany: jest.fn(),
                                    },
                                },
                            },
                        ],
                    }).compile()];
                case 1:
                    module = _a.sent();
                    service = module.get(expo_push_service_1.ExpoPushService);
                    prisma = module.get(prisma_service_1.PrismaService);
                    jest.clearAllMocks();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should not send a request when no active tokens exist', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.userDevicePushToken.findMany.mockResolvedValue([]);
                    return [4 /*yield*/, service.sendToUsers({
                            userIds: ['user-1'],
                            title: 'Title',
                            body: 'Body',
                            type: 'general',
                        })];
                case 1:
                    result = _a.sent();
                    expect(result).toEqual({
                        targetTokens: 0,
                        sent: 0,
                        failed: 0,
                        deactivatedTokens: 0,
                    });
                    expect(mockedAxios.post).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should chunk Expo push requests by 100 messages', function () { return __awaiter(void 0, void 0, void 0, function () {
        var tokens, result;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    tokens = Array.from({ length: 101 }, function (_, index) { return ({
                        expoPushToken: "ExponentPushToken[token-".concat(index, "]"),
                    }); });
                    prisma.userDevicePushToken.findMany.mockResolvedValue(tokens);
                    mockedAxios.post.mockResolvedValue({
                        data: {
                            data: Array.from({ length: 100 }, function () { return ({ status: 'ok' }); }),
                        },
                    });
                    return [4 /*yield*/, service.sendToUsers({
                            userIds: ['user-1'],
                            title: 'Title',
                            body: 'Body',
                            type: 'system',
                            data: { route: '/alerts' },
                        })];
                case 1:
                    result = _c.sent();
                    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
                    expect((_a = mockedAxios.post.mock.calls[0]) === null || _a === void 0 ? void 0 : _a[1]).toHaveLength(100);
                    expect((_b = mockedAxios.post.mock.calls[1]) === null || _b === void 0 ? void 0 : _b[1]).toHaveLength(1);
                    expect(result).toEqual({
                        targetTokens: 101,
                        sent: 101,
                        failed: 0,
                        deactivatedTokens: 0,
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('should map Expo tickets and deactivate unregistered devices', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.userDevicePushToken.findMany.mockResolvedValue([
                        { expoPushToken: 'ExponentPushToken[ok]' },
                        { expoPushToken: 'ExponentPushToken[expired]' },
                        { expoPushToken: 'ExponentPushToken[other-error]' },
                    ]);
                    prisma.userDevicePushToken.updateMany.mockResolvedValue({ count: 1 });
                    mockedAxios.post.mockResolvedValue({
                        data: {
                            data: [
                                { status: 'ok', id: 'ticket-1' },
                                {
                                    status: 'error',
                                    message: 'Device not registered',
                                    details: { error: 'DeviceNotRegistered' },
                                },
                                {
                                    status: 'error',
                                    message: 'Message too big',
                                    details: { error: 'MessageTooBig' },
                                },
                            ],
                        },
                    });
                    return [4 /*yield*/, service.sendToUsers({
                            userIds: ['user-1'],
                            title: 'Title',
                            body: 'Body',
                            type: 'general',
                        })];
                case 1:
                    result = _a.sent();
                    expect(result).toEqual({
                        targetTokens: 3,
                        sent: 1,
                        failed: 2,
                        deactivatedTokens: 1,
                    });
                    expect(prisma.userDevicePushToken.updateMany).toHaveBeenCalledWith({
                        where: { expoPushToken: { in: ['ExponentPushToken[expired]'] } },
                        data: { isActive: false },
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('should send notification records with notification id in push data', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.userDevicePushToken.findMany.mockResolvedValue([
                        { userId: 'user-1', expoPushToken: 'ExponentPushToken[token]' },
                    ]);
                    mockedAxios.post.mockResolvedValue({
                        data: {
                            data: [{ status: 'ok', id: 'ticket-1' }],
                        },
                    });
                    return [4 /*yield*/, service.sendNotifications([
                            {
                                id: 'notif-1',
                                userId: 'user-1',
                                title: 'Class update',
                                body: 'Bring your laptop',
                                type: 'academic',
                                data: { route: '/alerts' },
                            },
                        ])];
                case 1:
                    result = _a.sent();
                    expect(mockedAxios.post).toHaveBeenCalledWith(expect.any(String), [
                        expect.objectContaining({
                            to: 'ExponentPushToken[token]',
                            title: 'Class update',
                            body: 'Bring your laptop',
                            data: {
                                route: '/alerts',
                                notificationId: 'notif-1',
                                kind: 'notification',
                                type: 'academic',
                            },
                        }),
                    ], expect.any(Object));
                    expect(result.sent).toBe(1);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should report all chunk messages as failed when Expo request fails', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.userDevicePushToken.findMany.mockResolvedValue([
                        { expoPushToken: 'ExponentPushToken[token]' },
                    ]);
                    mockedAxios.post.mockRejectedValue(new Error('network down'));
                    return [4 /*yield*/, service.sendToUsers({
                            userIds: ['user-1'],
                            title: 'Title',
                            body: 'Body',
                            type: 'general',
                        })];
                case 1:
                    result = _a.sent();
                    expect(result).toEqual({
                        targetTokens: 1,
                        sent: 0,
                        failed: 1,
                        deactivatedTokens: 0,
                    });
                    return [2 /*return*/];
            }
        });
    }); });
});
