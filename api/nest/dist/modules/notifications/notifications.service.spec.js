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
var client_1 = require("@prisma/client");
var prisma_service_1 = require("../../database/prisma.service");
var expo_push_service_1 = require("./expo-push.service");
var notifications_service_1 = require("./notifications.service");
describe('NotificationsService', function () {
    var service;
    var prisma;
    var expoPushService;
    var mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        title: 'Doi phong hoc',
        body: 'Mon SE346 doi sang phong B201',
        type: 'schedule',
        isRead: false,
        data: null,
        createdAt: new Date(),
    };
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var module;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, testing_1.Test.createTestingModule({
                        providers: [
                            notifications_service_1.NotificationsService,
                            {
                                provide: prisma_service_1.PrismaService,
                                useValue: {
                                    notification: {
                                        findMany: jest.fn(),
                                        findFirst: jest.fn(),
                                        count: jest.fn(),
                                        update: jest.fn(),
                                        updateMany: jest.fn(),
                                        delete: jest.fn(),
                                        createMany: jest.fn(),
                                        create: jest.fn(),
                                        deleteMany: jest.fn(),
                                    },
                                    user: {
                                        findMany: jest.fn(),
                                    },
                                    classSection: {
                                        findUnique: jest.fn(),
                                    },
                                    classEnrollment: {
                                        findMany: jest.fn(),
                                    },
                                    userDevicePushToken: {
                                        upsert: jest.fn(),
                                        deleteMany: jest.fn(),
                                    },
                                },
                            },
                            {
                                provide: expo_push_service_1.ExpoPushService,
                                useValue: {
                                    sendToUsers: jest.fn(),
                                    sendNotifications: jest.fn(),
                                },
                            },
                        ],
                    }).compile()];
                case 1:
                    module = _a.sent();
                    service = module.get(notifications_service_1.NotificationsService);
                    prisma = module.get(prisma_service_1.PrismaService);
                    expoPushService = module.get(expo_push_service_1.ExpoPushService);
                    return [2 /*return*/];
            }
        });
    }); });
    describe('getNotifications', function () {
        it('should return paginated notifications', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.notification.findMany.mockResolvedValue([mockNotification]);
                        prisma.notification.count.mockResolvedValue(1);
                        return [4 /*yield*/, service.getNotifications('user-1', 1, 20)];
                    case 1:
                        result = _a.sent();
                        expect(result.items).toHaveLength(1);
                        expect(result.meta).toEqual({
                            total: 1,
                            page: 1,
                            limit: 20,
                            totalPages: 1,
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should calculate correct pagination offset', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.notification.findMany.mockResolvedValue([]);
                        prisma.notification.count.mockResolvedValue(50);
                        return [4 /*yield*/, service.getNotifications('user-1', 3, 10)];
                    case 1:
                        _a.sent();
                        expect(prisma.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, take: 10 }));
                        return [2 /*return*/];
                }
            });
        }); });
        it('should calculate totalPages correctly', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.notification.findMany.mockResolvedValue([]);
                        prisma.notification.count.mockResolvedValue(25);
                        return [4 /*yield*/, service.getNotifications('user-1', 1, 10)];
                    case 1:
                        result = _a.sent();
                        expect(result.meta.totalPages).toBe(3);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getUnreadCount', function () {
        it('should return count of unread notifications', function () { return __awaiter(void 0, void 0, void 0, function () {
            var count;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.notification.count.mockResolvedValue(5);
                        return [4 /*yield*/, service.getUnreadCount('user-1')];
                    case 1:
                        count = _a.sent();
                        expect(count).toBe(5);
                        expect(prisma.notification.count).toHaveBeenCalledWith({
                            where: { userId: 'user-1', isRead: false },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getNotification', function () {
        it('should return a notification owned by the current user', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.notification.findFirst.mockResolvedValue(mockNotification);
                        return [4 /*yield*/, service.getNotification('notif-1', 'user-1')];
                    case 1:
                        result = _a.sent();
                        expect(result).toEqual(mockNotification);
                        expect(prisma.notification.findFirst).toHaveBeenCalledWith({
                            where: { id: 'notif-1', userId: 'user-1' },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw NotFoundException for another user notification', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.notification.findFirst.mockResolvedValue(null);
                        return [4 /*yield*/, expect(service.getNotification('notif-1', 'user-2')).rejects.toThrow(common_1.NotFoundException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('markAsRead', function () {
        it('should mark a notification as read', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.notification.findFirst.mockResolvedValue(mockNotification);
                        prisma.notification.update.mockResolvedValue(__assign(__assign({}, mockNotification), { isRead: true }));
                        return [4 /*yield*/, service.markAsRead('notif-1', 'user-1')];
                    case 1:
                        result = _a.sent();
                        expect(result.isRead).toBe(true);
                        expect(prisma.notification.update).toHaveBeenCalledWith({
                            where: { id: 'notif-1' },
                            data: { isRead: true },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw NotFoundException when notification not found', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.notification.findFirst.mockResolvedValue(null);
                        return [4 /*yield*/, expect(service.markAsRead('nonexistent', 'user-1')).rejects.toThrow(common_1.NotFoundException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('markAllAsRead', function () {
        it('should mark all unread notifications as read', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.notification.updateMany.mockResolvedValue({ count: 3 });
                        return [4 /*yield*/, service.markAllAsRead('user-1')];
                    case 1:
                        result = _a.sent();
                        expect(result.count).toBe(3);
                        expect(prisma.notification.updateMany).toHaveBeenCalledWith({
                            where: { userId: 'user-1', isRead: false },
                            data: { isRead: true },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('deleteNotification', function () {
        it('should delete a notification owned by the current user', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.notification.findFirst.mockResolvedValue({ id: 'notif-1' });
                        prisma.notification.delete.mockResolvedValue({ id: 'notif-1' });
                        return [4 /*yield*/, service.deleteNotification('notif-1', 'user-1')];
                    case 1:
                        result = _a.sent();
                        expect(prisma.notification.delete).toHaveBeenCalledWith({
                            where: { id: 'notif-1' },
                        });
                        expect(result).toEqual({ deleted: true });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw NotFoundException when deleting another user notification', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.notification.findFirst.mockResolvedValue(null);
                        return [4 /*yield*/, expect(service.deleteNotification('notif-1', 'user-2')).rejects.toThrow(common_1.NotFoundException)];
                    case 1:
                        _a.sent();
                        expect(prisma.notification.delete).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('deleteNotifications', function () {
        it('should delete all notifications when no filter is provided', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.notification.deleteMany.mockResolvedValue({ count: 4 });
                        return [4 /*yield*/, service.deleteNotifications('user-1', {})];
                    case 1:
                        result = _a.sent();
                        expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
                            where: { userId: 'user-1' },
                        });
                        expect(result).toEqual({ count: 4 });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should delete only notifications matching a category filter', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.notification.findMany.mockResolvedValue([
                            { id: 'notif-1', type: 'academic' },
                            { id: 'notif-2', type: 'general' },
                            { id: 'notif-3', type: 'schedule_update' },
                        ]);
                        prisma.notification.deleteMany.mockResolvedValue({ count: 2 });
                        return [4 /*yield*/, service.deleteNotifications('user-1', { category: 'academic' })];
                    case 1:
                        result = _a.sent();
                        expect(prisma.notification.findMany).toHaveBeenCalledWith({
                            where: { userId: 'user-1' },
                            select: { id: true, type: true },
                        });
                        expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
                            where: {
                                userId: 'user-1',
                                id: { in: ['notif-1', 'notif-3'] },
                            },
                        });
                        expect(result).toEqual({ count: 2 });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should respect unreadOnly when deleting by filter', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.notification.findMany.mockResolvedValue([
                            { id: 'notif-1', type: 'payment' },
                        ]);
                        prisma.notification.deleteMany.mockResolvedValue({ count: 1 });
                        return [4 /*yield*/, service.deleteNotifications('user-1', {
                                category: 'payment',
                                unreadOnly: true,
                            })];
                    case 1:
                        _a.sent();
                        expect(prisma.notification.findMany).toHaveBeenCalledWith({
                            where: { userId: 'user-1', isRead: false },
                            select: { id: true, type: true },
                        });
                        expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
                            where: {
                                userId: 'user-1',
                                id: { in: ['notif-1'] },
                            },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('push token registration', function () {
        it('should upsert the current user push token as active', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.userDevicePushToken.upsert.mockResolvedValue({
                            id: 'token-1',
                            userId: 'user-1',
                            expoPushToken: 'ExponentPushToken[token]',
                            platform: 'android',
                            deviceId: null,
                            isActive: true,
                        });
                        return [4 /*yield*/, service.registerPushToken('user-1', {
                                expoPushToken: 'ExponentPushToken[token]',
                                platform: 'android',
                            })];
                    case 1:
                        _a.sent();
                        expect(prisma.userDevicePushToken.upsert).toHaveBeenCalledWith(expect.objectContaining({
                            create: expect.objectContaining({ isActive: true }),
                            update: expect.objectContaining({ isActive: true }),
                        }));
                        return [2 /*return*/];
                }
            });
        }); });
        it('should remove the current user push token', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.userDevicePushToken.deleteMany.mockResolvedValue({ count: 1 });
                        return [4 /*yield*/, service.removePushToken('user-1', 'ExponentPushToken[token]')];
                    case 1:
                        result = _a.sent();
                        expect(result).toEqual({ count: 1 });
                        expect(prisma.userDevicePushToken.deleteMany).toHaveBeenCalledWith({
                            where: { userId: 'user-1', expoPushToken: 'ExponentPushToken[token]' },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('createSystemNotifications', function () {
        it('should create notifications and send push to matching users', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findMany.mockResolvedValue([{ id: 'user-1' }, { id: 'user-2' }]);
                        prisma.notification.create
                            .mockResolvedValueOnce(__assign(__assign({}, mockNotification), { id: 'notif-1', userId: 'user-1', title: 'Campus alert', body: 'Main gate closes at 10 PM', type: 'system', data: { route: '/alerts' } }))
                            .mockResolvedValueOnce(__assign(__assign({}, mockNotification), { id: 'notif-2', userId: 'user-2', title: 'Campus alert', body: 'Main gate closes at 10 PM', type: 'system', data: { route: '/alerts' } }));
                        expoPushService.sendNotifications.mockResolvedValue({
                            targetTokens: 2,
                            sent: 2,
                            failed: 0,
                            deactivatedTokens: 0,
                        });
                        return [4 /*yield*/, service.createSystemNotifications('Campus alert', 'Main gate closes at 10 PM', 'system', { route: '/alerts' }, { scope: 'roles', roles: ['student'] }, { id: 'admin-1', role: client_1.Role.admin })];
                    case 1:
                        result = _a.sent();
                        expect(prisma.notification.create).toHaveBeenNthCalledWith(1, {
                            data: {
                                userId: 'user-1',
                                title: 'Campus alert',
                                body: 'Main gate closes at 10 PM',
                                type: 'system',
                                data: { route: '/alerts' },
                            },
                        });
                        expect(prisma.notification.create).toHaveBeenNthCalledWith(2, {
                            data: {
                                userId: 'user-2',
                                title: 'Campus alert',
                                body: 'Main gate closes at 10 PM',
                                type: 'system',
                                data: { route: '/alerts' },
                            },
                        });
                        expect(expoPushService.sendNotifications).toHaveBeenCalledWith([
                            expect.objectContaining({
                                id: 'notif-1',
                                userId: 'user-1',
                                type: 'system',
                                data: { route: '/alerts' },
                            }),
                            expect.objectContaining({
                                id: 'notif-2',
                                userId: 'user-2',
                                type: 'system',
                                data: { route: '/alerts' },
                            }),
                        ]);
                        expect(result).toEqual({
                            count: 2,
                            push: {
                                targetTokens: 2,
                                sent: 2,
                                failed: 0,
                                deactivatedTokens: 0,
                            },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should support the legacy roles audience argument', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findMany.mockResolvedValue([{ id: 'user-1' }]);
                        prisma.notification.create.mockResolvedValue(__assign(__assign({}, mockNotification), { id: 'notif-1', userId: 'user-1' }));
                        expoPushService.sendNotifications.mockResolvedValue({
                            targetTokens: 1,
                            sent: 1,
                            failed: 0,
                            deactivatedTokens: 0,
                        });
                        return [4 /*yield*/, service.createSystemNotifications('Title', 'Body', 'general', undefined, ['student'])];
                    case 1:
                        _a.sent();
                        expect(prisma.user.findMany).toHaveBeenCalledWith({
                            where: { isActive: true, role: { in: ['student'] } },
                            select: { id: true },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should allow admin to broadcast to all active users', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findMany.mockResolvedValue([{ id: 'user-1' }]);
                        prisma.notification.create.mockResolvedValue(__assign(__assign({}, mockNotification), { id: 'notif-1', userId: 'user-1' }));
                        expoPushService.sendNotifications.mockResolvedValue({
                            targetTokens: 0,
                            sent: 0,
                            failed: 0,
                            deactivatedTokens: 0,
                        });
                        return [4 /*yield*/, service.createSystemNotifications('Title', 'Body', 'system', undefined, { scope: 'all' }, { id: 'admin-1', role: client_1.Role.admin })];
                    case 1:
                        _a.sent();
                        expect(prisma.user.findMany).toHaveBeenCalledWith({
                            where: { isActive: true },
                            select: { id: true },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should send class section notifications to the lecturer and active enrolled students', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.classSection.findUnique.mockResolvedValue({
                            id: 'section-1',
                            lecturerId: 'lecturer-1',
                        });
                        prisma.classEnrollment.findMany.mockResolvedValue([
                            { studentId: 'student-1' },
                            { studentId: 'student-2' },
                        ]);
                        prisma.notification.create
                            .mockResolvedValueOnce(__assign(__assign({}, mockNotification), { id: 'notif-1', userId: 'lecturer-1', title: 'Class update', body: 'Bring your laptop tomorrow', type: 'academic', data: null }))
                            .mockResolvedValueOnce(__assign(__assign({}, mockNotification), { id: 'notif-2', userId: 'student-1', title: 'Class update', body: 'Bring your laptop tomorrow', type: 'academic', data: null }))
                            .mockResolvedValueOnce(__assign(__assign({}, mockNotification), { id: 'notif-3', userId: 'student-2', title: 'Class update', body: 'Bring your laptop tomorrow', type: 'academic', data: null }));
                        expoPushService.sendNotifications.mockResolvedValue({
                            targetTokens: 3,
                            sent: 3,
                            failed: 0,
                            deactivatedTokens: 0,
                        });
                        return [4 /*yield*/, service.createSystemNotifications('Class update', 'Bring your laptop tomorrow', 'academic', undefined, { scope: 'class_section', classSectionId: 'section-1' }, { id: 'lecturer-1', role: client_1.Role.lecturer })];
                    case 1:
                        result = _a.sent();
                        expect(prisma.classEnrollment.findMany).toHaveBeenCalledWith({
                            where: {
                                classSectionId: 'section-1',
                                status: 'active',
                                student: {
                                    isActive: true,
                                    role: 'student',
                                },
                            },
                            select: { studentId: true },
                        });
                        expect(prisma.notification.create).toHaveBeenNthCalledWith(1, {
                            data: {
                                userId: 'lecturer-1',
                                title: 'Class update',
                                body: 'Bring your laptop tomorrow',
                                type: 'academic',
                                data: undefined,
                            },
                        });
                        expect(prisma.notification.create).toHaveBeenNthCalledWith(2, {
                            data: {
                                userId: 'student-1',
                                title: 'Class update',
                                body: 'Bring your laptop tomorrow',
                                type: 'academic',
                                data: undefined,
                            },
                        });
                        expect(prisma.notification.create).toHaveBeenNthCalledWith(3, {
                            data: {
                                userId: 'student-2',
                                title: 'Class update',
                                body: 'Bring your laptop tomorrow',
                                type: 'academic',
                                data: undefined,
                            },
                        });
                        expect(result.count).toBe(3);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should reject lecturers broadcasting to classes they do not own', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.classSection.findUnique.mockResolvedValue({
                            id: 'section-1',
                            lecturerId: 'lecturer-2',
                        });
                        return [4 /*yield*/, expect(service.createSystemNotifications('Class update', 'Body', 'academic', undefined, { scope: 'class_section', classSectionId: 'section-1' }, { id: 'lecturer-1', role: client_1.Role.lecturer })).rejects.toThrow('You are not allowed to notify this class section')];
                    case 1:
                        _a.sent();
                        expect(prisma.notification.create).not.toHaveBeenCalled();
                        expect(expoPushService.sendNotifications).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should reject lecturers broadcasting to role audiences', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(service.createSystemNotifications('Title', 'Body', 'general', undefined, { scope: 'roles', roles: ['student'] }, { id: 'lecturer-1', role: client_1.Role.lecturer })).rejects.toThrow('You are not allowed to broadcast to this audience')];
                    case 1:
                        _a.sent();
                        expect(prisma.user.findMany).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return count only when no users match', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findMany.mockResolvedValue([]);
                        return [4 /*yield*/, service.createSystemNotifications('Title', 'Body')];
                    case 1:
                        result = _a.sent();
                        expect(result).toEqual({ count: 0 });
                        expect(prisma.notification.create).not.toHaveBeenCalled();
                        expect(expoPushService.sendNotifications).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should not throw when push delivery fails', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findMany.mockResolvedValue([{ id: 'user-1' }]);
                        prisma.notification.create.mockResolvedValue(__assign(__assign({}, mockNotification), { id: 'notif-1', userId: 'user-1' }));
                        expoPushService.sendNotifications.mockRejectedValue(new Error('Expo unavailable'));
                        return [4 /*yield*/, service.createSystemNotifications('Title', 'Body')];
                    case 1:
                        result = _a.sent();
                        expect(result).toEqual({
                            count: 1,
                            push: {
                                targetTokens: 0,
                                sent: 0,
                                failed: 0,
                                deactivatedTokens: 0,
                            },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
