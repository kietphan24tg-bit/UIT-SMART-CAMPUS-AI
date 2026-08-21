"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var shared_1 = require("@smart-campus/shared");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var roles_guard_1 = require("../../common/guards/roles.guard");
var NotificationsController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Notifications'), (0, common_1.Controller)('notifications'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, swagger_1.ApiBearerAuth)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _createNotification_decorators;
    var _getNotifications_decorators;
    var _getUnreadCount_decorators;
    var _getNotification_decorators;
    var _markAsRead_decorators;
    var _markAllAsRead_decorators;
    var _registerPushToken_decorators;
    var _removePushToken_decorators;
    var _deleteNotifications_decorators;
    var _deleteNotification_decorators;
    var NotificationsController = _classThis = /** @class */ (function () {
        function NotificationsController_1(notificationsService) {
            this.notificationsService = (__runInitializers(this, _instanceExtraInitializers), notificationsService);
        }
        NotificationsController_1.prototype.createNotification = function (dto, actorId, actorRole) {
            var _a;
            return this.notificationsService.createSystemNotifications(dto.title, dto.body, dto.type, dto.data, (_a = dto.audience) !== null && _a !== void 0 ? _a : dto.roles, { id: actorId, role: actorRole });
        };
        NotificationsController_1.prototype.getNotifications = function (userId, page, limit) {
            return this.notificationsService.getNotifications(userId, page, limit);
        };
        NotificationsController_1.prototype.getUnreadCount = function (userId) {
            return this.notificationsService.getUnreadCount(userId);
        };
        NotificationsController_1.prototype.getNotification = function (id, userId) {
            return this.notificationsService.getNotification(id, userId);
        };
        NotificationsController_1.prototype.markAsRead = function (id, userId) {
            return this.notificationsService.markAsRead(id, userId);
        };
        NotificationsController_1.prototype.markAllAsRead = function (userId) {
            return this.notificationsService.markAllAsRead(userId);
        };
        NotificationsController_1.prototype.registerPushToken = function (userId, dto) {
            return this.notificationsService.registerPushToken(userId, dto);
        };
        NotificationsController_1.prototype.removePushToken = function (userId, dto) {
            return this.notificationsService.removePushToken(userId, dto.expoPushToken);
        };
        NotificationsController_1.prototype.deleteNotifications = function (userId, query) {
            return this.notificationsService.deleteNotifications(userId, query);
        };
        NotificationsController_1.prototype.deleteNotification = function (id, userId) {
            return this.notificationsService.deleteNotification(id, userId);
        };
        return NotificationsController_1;
    }());
    __setFunctionName(_classThis, "NotificationsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createNotification_decorators = [(0, common_1.Post)(), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.LECTURER, shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Broadcast a system notification' })];
        _getNotifications_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Get notifications' }), (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number })];
        _getUnreadCount_decorators = [(0, common_1.Get)('unread-count'), (0, swagger_1.ApiOperation)({ summary: 'Get unread notification count' })];
        _getNotification_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Get notification detail' })];
        _markAsRead_decorators = [(0, common_1.Patch)(':id/read'), (0, swagger_1.ApiOperation)({ summary: 'Mark notification as read' })];
        _markAllAsRead_decorators = [(0, common_1.Patch)('read-all'), (0, swagger_1.ApiOperation)({ summary: 'Mark all notifications as read' })];
        _registerPushToken_decorators = [(0, common_1.Post)('push-token'), (0, swagger_1.ApiOperation)({ summary: 'Register Expo push token for current user' })];
        _removePushToken_decorators = [(0, common_1.Delete)('push-token'), (0, swagger_1.ApiOperation)({ summary: 'Remove Expo push token for current user (e.g. on logout)' })];
        _deleteNotifications_decorators = [(0, common_1.Delete)(), (0, swagger_1.ApiOperation)({ summary: 'Delete notifications for current user' })];
        _deleteNotification_decorators = [(0, common_1.Delete)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Delete a notification for current user' })];
        __esDecorate(_classThis, null, _createNotification_decorators, { kind: "method", name: "createNotification", static: false, private: false, access: { has: function (obj) { return "createNotification" in obj; }, get: function (obj) { return obj.createNotification; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getNotifications_decorators, { kind: "method", name: "getNotifications", static: false, private: false, access: { has: function (obj) { return "getNotifications" in obj; }, get: function (obj) { return obj.getNotifications; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUnreadCount_decorators, { kind: "method", name: "getUnreadCount", static: false, private: false, access: { has: function (obj) { return "getUnreadCount" in obj; }, get: function (obj) { return obj.getUnreadCount; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getNotification_decorators, { kind: "method", name: "getNotification", static: false, private: false, access: { has: function (obj) { return "getNotification" in obj; }, get: function (obj) { return obj.getNotification; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _markAsRead_decorators, { kind: "method", name: "markAsRead", static: false, private: false, access: { has: function (obj) { return "markAsRead" in obj; }, get: function (obj) { return obj.markAsRead; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _markAllAsRead_decorators, { kind: "method", name: "markAllAsRead", static: false, private: false, access: { has: function (obj) { return "markAllAsRead" in obj; }, get: function (obj) { return obj.markAllAsRead; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _registerPushToken_decorators, { kind: "method", name: "registerPushToken", static: false, private: false, access: { has: function (obj) { return "registerPushToken" in obj; }, get: function (obj) { return obj.registerPushToken; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _removePushToken_decorators, { kind: "method", name: "removePushToken", static: false, private: false, access: { has: function (obj) { return "removePushToken" in obj; }, get: function (obj) { return obj.removePushToken; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteNotifications_decorators, { kind: "method", name: "deleteNotifications", static: false, private: false, access: { has: function (obj) { return "deleteNotifications" in obj; }, get: function (obj) { return obj.deleteNotifications; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteNotification_decorators, { kind: "method", name: "deleteNotification", static: false, private: false, access: { has: function (obj) { return "deleteNotification" in obj; }, get: function (obj) { return obj.deleteNotification; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        NotificationsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return NotificationsController = _classThis;
}();
exports.NotificationsController = NotificationsController;
