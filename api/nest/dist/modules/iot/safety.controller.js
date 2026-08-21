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
exports.SafetyController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var shared_1 = require("@smart-campus/shared");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var iot_secret_guard_1 = require("../../common/guards/iot-secret.guard");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var roles_guard_1 = require("../../common/guards/roles.guard");
var SafetyController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Safety'), (0, common_1.Controller)('safety')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _createFireAlert_decorators;
    var _getFireAlerts_decorators;
    var _deleteFireAlerts_decorators;
    var _deleteFireAlert_decorators;
    var _markFireAlertAsRead_decorators;
    var SafetyController = _classThis = /** @class */ (function () {
        function SafetyController_1(iotService) {
            this.iotService = (__runInitializers(this, _instanceExtraInitializers), iotService);
        }
        SafetyController_1.prototype.createFireAlert = function (dto) {
            return this.iotService.createFireAlert(dto);
        };
        SafetyController_1.prototype.getFireAlerts = function (page, limit) {
            return this.iotService.listFireAlerts(page, limit);
        };
        SafetyController_1.prototype.deleteFireAlerts = function () {
            return this.iotService.deleteFireAlerts();
        };
        SafetyController_1.prototype.deleteFireAlert = function (id) {
            return this.iotService.deleteFireAlert(id);
        };
        SafetyController_1.prototype.markFireAlertAsRead = function (id) {
            return this.iotService.markFireAlertAsRead(id);
        };
        return SafetyController_1;
    }());
    __setFunctionName(_classThis, "SafetyController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createFireAlert_decorators = [(0, common_1.Post)('fire-alerts'), (0, common_1.UseGuards)(iot_secret_guard_1.IotSecretGuard), (0, swagger_1.ApiOperation)({ summary: 'Create a fire alert from gateway telemetry' })];
        _getFireAlerts_decorators = [(0, common_1.Get)('fire-alerts'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'List fire alerts for administrators' }), (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number })];
        _deleteFireAlerts_decorators = [(0, common_1.Delete)('fire-alerts'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Delete all fire alerts for administrators' })];
        _deleteFireAlert_decorators = [(0, common_1.Delete)('fire-alerts/:id'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Delete a fire alert for administrators' })];
        _markFireAlertAsRead_decorators = [(0, common_1.Patch)('fire-alerts/:id/read'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Mark a fire alert as read for administrators' })];
        __esDecorate(_classThis, null, _createFireAlert_decorators, { kind: "method", name: "createFireAlert", static: false, private: false, access: { has: function (obj) { return "createFireAlert" in obj; }, get: function (obj) { return obj.createFireAlert; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getFireAlerts_decorators, { kind: "method", name: "getFireAlerts", static: false, private: false, access: { has: function (obj) { return "getFireAlerts" in obj; }, get: function (obj) { return obj.getFireAlerts; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteFireAlerts_decorators, { kind: "method", name: "deleteFireAlerts", static: false, private: false, access: { has: function (obj) { return "deleteFireAlerts" in obj; }, get: function (obj) { return obj.deleteFireAlerts; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteFireAlert_decorators, { kind: "method", name: "deleteFireAlert", static: false, private: false, access: { has: function (obj) { return "deleteFireAlert" in obj; }, get: function (obj) { return obj.deleteFireAlert; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _markFireAlertAsRead_decorators, { kind: "method", name: "markFireAlertAsRead", static: false, private: false, access: { has: function (obj) { return "markFireAlertAsRead" in obj; }, get: function (obj) { return obj.markFireAlertAsRead; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SafetyController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SafetyController = _classThis;
}();
exports.SafetyController = SafetyController;
