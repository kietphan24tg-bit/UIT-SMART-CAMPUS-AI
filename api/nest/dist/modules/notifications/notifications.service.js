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
exports.NotificationsService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var shared_1 = require("@smart-campus/shared");
var EMPTY_PUSH_STATS = {
    targetTokens: 0,
    sent: 0,
    failed: 0,
    deactivatedTokens: 0,
};
var NotificationsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var NotificationsService = _classThis = /** @class */ (function () {
        function NotificationsService_1(prisma, expoPushService) {
            this.prisma = prisma;
            this.expoPushService = expoPushService;
            this.logger = new common_1.Logger(NotificationsService.name);
        }
        NotificationsService_1.prototype.getNotifications = function (userId_1) {
            return __awaiter(this, arguments, void 0, function (userId, page, limit) {
                var skip, _a, notifications, total;
                if (page === void 0) { page = 1; }
                if (limit === void 0) { limit = 20; }
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            skip = (page - 1) * limit;
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.notification.findMany({
                                        where: { userId: userId },
                                        orderBy: { createdAt: 'desc' },
                                        skip: skip,
                                        take: limit,
                                    }),
                                    this.prisma.notification.count({ where: { userId: userId } }),
                                ])];
                        case 1:
                            _a = _b.sent(), notifications = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    items: notifications,
                                    meta: {
                                        total: total,
                                        page: page,
                                        limit: limit,
                                        totalPages: Math.ceil(total / limit),
                                    },
                                }];
                    }
                });
            });
        };
        NotificationsService_1.prototype.getUnreadCount = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.notification.count({
                            where: { userId: userId, isRead: false },
                        })];
                });
            });
        };
        NotificationsService_1.prototype.getNotification = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var notification;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.notification.findFirst({
                                where: { id: id, userId: userId },
                            })];
                        case 1:
                            notification = _a.sent();
                            if (!notification) {
                                throw new common_1.NotFoundException('Notification not found');
                            }
                            return [2 /*return*/, notification];
                    }
                });
            });
        };
        NotificationsService_1.prototype.markAsRead = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var notification;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.notification.findFirst({
                                where: { id: id, userId: userId },
                            })];
                        case 1:
                            notification = _a.sent();
                            if (!notification) {
                                throw new common_1.NotFoundException('Notification not found');
                            }
                            return [2 /*return*/, this.prisma.notification.update({
                                    where: { id: id },
                                    data: { isRead: true },
                                })];
                    }
                });
            });
        };
        NotificationsService_1.prototype.markAllAsRead = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.notification.updateMany({
                            where: { userId: userId, isRead: false },
                            data: { isRead: true },
                        })];
                });
            });
        };
        NotificationsService_1.prototype.deleteNotification = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var notification;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.notification.findFirst({
                                where: { id: id, userId: userId },
                                select: { id: true },
                            })];
                        case 1:
                            notification = _a.sent();
                            if (!notification) {
                                throw new common_1.NotFoundException('Notification not found');
                            }
                            return [4 /*yield*/, this.prisma.notification.delete({
                                    where: { id: notification.id },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { deleted: true }];
                    }
                });
            });
        };
        NotificationsService_1.prototype.deleteNotifications = function (userId_1) {
            return __awaiter(this, arguments, void 0, function (userId, query) {
                var where, result_1, notifications, matchingIds, result;
                var _this = this;
                if (query === void 0) { query = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            where = __assign({ userId: userId }, (query.unreadOnly === true ? { isRead: false } : {}));
                            if (!!query.category) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.prisma.notification.deleteMany({ where: where })];
                        case 1:
                            result_1 = _a.sent();
                            return [2 /*return*/, { count: result_1.count }];
                        case 2: return [4 /*yield*/, this.prisma.notification.findMany({
                                where: where,
                                select: {
                                    id: true,
                                    type: true,
                                },
                            })];
                        case 3:
                            notifications = _a.sent();
                            matchingIds = notifications
                                .filter(function (notification) {
                                return _this.matchesAlertCategory(notification.type, query.category);
                            })
                                .map(function (notification) { return notification.id; });
                            if (matchingIds.length === 0) {
                                return [2 /*return*/, { count: 0 }];
                            }
                            return [4 /*yield*/, this.prisma.notification.deleteMany({
                                    where: {
                                        userId: userId,
                                        id: { in: matchingIds },
                                    },
                                })];
                        case 4:
                            result = _a.sent();
                            return [2 /*return*/, { count: result.count }];
                    }
                });
            });
        };
        NotificationsService_1.prototype.registerPushToken = function (userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.userDevicePushToken.upsert({
                            where: {
                                userId_expoPushToken: {
                                    userId: userId,
                                    expoPushToken: dto.expoPushToken,
                                },
                            },
                            create: {
                                userId: userId,
                                expoPushToken: dto.expoPushToken,
                                platform: dto.platform,
                                deviceId: dto.deviceId,
                                isActive: true,
                                lastSeenAt: new Date(),
                            },
                            update: {
                                platform: dto.platform,
                                deviceId: dto.deviceId,
                                isActive: true,
                                lastSeenAt: new Date(),
                            },
                        })];
                });
            });
        };
        NotificationsService_1.prototype.removePushToken = function (userId, expoPushToken) {
            return __awaiter(this, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.userDevicePushToken.deleteMany({
                                where: { userId: userId, expoPushToken: expoPushToken },
                            })];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, { count: result.count }];
                    }
                });
            });
        };
        NotificationsService_1.prototype.createSystemNotifications = function (title_1, body_1) {
            return __awaiter(this, arguments, void 0, function (title, body, type, data, audienceInput, actor) {
                var audience, users, notifications, push;
                var _this = this;
                if (type === void 0) { type = 'general'; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            audience = this.normalizeAudience(audienceInput);
                            return [4 /*yield*/, this.resolveAudienceUserIds(audience, actor)];
                        case 1:
                            users = _a.sent();
                            if (users.length === 0) {
                                return [2 /*return*/, { count: 0 }];
                            }
                            return [4 /*yield*/, Promise.all(users.map(function (user) {
                                    return _this.prisma.notification.create({
                                        data: {
                                            userId: user.id,
                                            title: title,
                                            body: body,
                                            type: type,
                                            data: data,
                                        },
                                    });
                                }))];
                        case 2:
                            notifications = _a.sent();
                            return [4 /*yield*/, this.sendPushBestEffort(notifications)];
                        case 3:
                            push = _a.sent();
                            return [2 /*return*/, {
                                    count: notifications.length,
                                    push: push,
                                }];
                    }
                });
            });
        };
        NotificationsService_1.prototype.createNotificationsForUsers = function (input) {
            return __awaiter(this, void 0, void 0, function () {
                var userIds, notifications, push;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            userIds = __spreadArray([], new Set(input.userIds.filter(Boolean)), true);
                            if (userIds.length === 0) {
                                return [2 /*return*/, { count: 0 }];
                            }
                            return [4 /*yield*/, Promise.all(userIds.map(function (userId) {
                                    var _a;
                                    return _this.prisma.notification.create({
                                        data: {
                                            userId: userId,
                                            title: input.title,
                                            body: input.body,
                                            type: (_a = input.type) !== null && _a !== void 0 ? _a : 'general',
                                            data: input.data,
                                        },
                                    });
                                }))];
                        case 1:
                            notifications = _a.sent();
                            return [4 /*yield*/, this.sendPushBestEffort(notifications)];
                        case 2:
                            push = _a.sent();
                            return [2 /*return*/, {
                                    count: notifications.length,
                                    push: push,
                                }];
                    }
                });
            });
        };
        NotificationsService_1.prototype.createNotificationsForClassSection = function (input) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.createSystemNotifications(input.title, input.body, input.type, input.data, { scope: 'class_section', classSectionId: input.classSectionId }, input.actor)];
                });
            });
        };
        NotificationsService_1.prototype.sendPushBestEffort = function (notifications) {
            return __awaiter(this, void 0, void 0, function () {
                var error_1;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.expoPushService.sendNotifications(notifications.map(function (notification) { return ({
                                    id: notification.id,
                                    userId: notification.userId,
                                    title: notification.title,
                                    body: notification.body,
                                    type: notification.type,
                                    data: _this.toPushData(notification.data),
                                }); }))];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            error_1 = _a.sent();
                            this.logger.warn("Push delivery failed after notifications were created: ".concat(this.getErrorMessage(error_1)));
                            return [2 /*return*/, EMPTY_PUSH_STATS];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        NotificationsService_1.prototype.toPushData = function (data) {
            return data && typeof data === 'object' && !Array.isArray(data)
                ? data
                : null;
        };
        NotificationsService_1.prototype.getErrorMessage = function (error) {
            return error instanceof Error ? error.message : 'Unknown error';
        };
        NotificationsService_1.prototype.matchesAlertCategory = function (type, category) {
            return (0, shared_1.getNotificationAlertCategory)(type) === category;
        };
        NotificationsService_1.prototype.normalizeAudience = function (input) {
            var _a, _b;
            if (Array.isArray(input)) {
                return input.length ? { scope: 'roles', roles: input } : { scope: 'all' };
            }
            if (!input) {
                return { scope: 'all' };
            }
            if (input.scope === 'roles') {
                return { scope: 'roles', roles: (_a = input.roles) !== null && _a !== void 0 ? _a : [] };
            }
            if (input.scope === 'class_section') {
                return { scope: 'class_section', classSectionId: (_b = input.classSectionId) !== null && _b !== void 0 ? _b : '' };
            }
            return { scope: 'all' };
        };
        NotificationsService_1.prototype.resolveAudienceUserIds = function (audience, actor) {
            return __awaiter(this, void 0, void 0, function () {
                var users;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.assertAudienceShape(audience);
                            this.assertAudiencePermission(audience, actor);
                            if (audience.scope === 'class_section') {
                                return [2 /*return*/, this.resolveClassSectionAudience(audience.classSectionId, actor)];
                            }
                            return [4 /*yield*/, this.prisma.user.findMany({
                                    where: __assign({ isActive: true }, (audience.scope === 'roles' && audience.roles.length
                                        ? { role: { in: audience.roles } }
                                        : {})),
                                    select: { id: true },
                                })];
                        case 1:
                            users = _a.sent();
                            return [2 /*return*/, users];
                    }
                });
            });
        };
        NotificationsService_1.prototype.assertAudiencePermission = function (audience, actor) {
            if (!actor || this.canBroadcastToAnyAudience(actor.role)) {
                return;
            }
            if (actor.role === client_1.Role.lecturer && audience.scope === 'class_section') {
                return;
            }
            throw new common_1.ForbiddenException('You are not allowed to broadcast to this audience');
        };
        NotificationsService_1.prototype.canBroadcastToAnyAudience = function (role) {
            return role === client_1.Role.admin || role === client_1.Role.super_admin;
        };
        NotificationsService_1.prototype.assertAudienceShape = function (audience) {
            if (audience.scope === 'roles' && audience.roles.length === 0) {
                throw new common_1.BadRequestException('roles must contain at least one role');
            }
            if (audience.scope === 'class_section' && !audience.classSectionId) {
                throw new common_1.BadRequestException('classSectionId is required');
            }
        };
        NotificationsService_1.prototype.resolveClassSectionAudience = function (classSectionId, actor) {
            return __awaiter(this, void 0, void 0, function () {
                var classSection, enrollments, userIds;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.classSection.findUnique({
                                where: { id: classSectionId },
                                select: { id: true, lecturerId: true },
                            })];
                        case 1:
                            classSection = _a.sent();
                            if (!classSection) {
                                throw new common_1.NotFoundException('Class section not found');
                            }
                            if ((actor === null || actor === void 0 ? void 0 : actor.role) === client_1.Role.lecturer && classSection.lecturerId !== actor.id) {
                                throw new common_1.ForbiddenException('You are not allowed to notify this class section');
                            }
                            return [4 /*yield*/, this.prisma.classEnrollment.findMany({
                                    where: {
                                        classSectionId: classSectionId,
                                        status: client_1.EnrollmentStatus.active,
                                        student: {
                                            isActive: true,
                                            role: client_1.Role.student,
                                        },
                                    },
                                    select: {
                                        studentId: true,
                                    },
                                })];
                        case 2:
                            enrollments = _a.sent();
                            userIds = new Set();
                            if (classSection.lecturerId) {
                                userIds.add(classSection.lecturerId);
                            }
                            enrollments.forEach(function (enrollment) { return userIds.add(enrollment.studentId); });
                            return [2 /*return*/, __spreadArray([], userIds, true).map(function (id) { return ({ id: id }); })];
                    }
                });
            });
        };
        return NotificationsService_1;
    }());
    __setFunctionName(_classThis, "NotificationsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        NotificationsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return NotificationsService = _classThis;
}();
exports.NotificationsService = NotificationsService;
