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
exports.IotController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var shared_1 = require("@smart-campus/shared");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var iot_secret_guard_1 = require("../../common/guards/iot-secret.guard");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var roles_guard_1 = require("../../common/guards/roles.guard");
var IotController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('IoT'), (0, common_1.Controller)('iot')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _processParkingScan_decorators;
    var _recordTelemetry_decorators;
    var _getLatestTelemetry_decorators;
    var IotController = _classThis = /** @class */ (function () {
        function IotController_1(iotService) {
            this.iotService = (__runInitializers(this, _instanceExtraInitializers), iotService);
        }
        IotController_1.prototype.processParkingScan = function (dto) {
            return this.iotService.processParkingScan(dto);
        };
        IotController_1.prototype.recordTelemetry = function (dto) {
            return this.iotService.recordTelemetry(dto);
        };
        IotController_1.prototype.getLatestTelemetry = function (gateId) {
            return this.iotService.getLatestTelemetry(gateId);
        };
        return IotController_1;
    }());
    __setFunctionName(_classThis, "IotController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _processParkingScan_decorators = [(0, common_1.Post)('parking/scan'), (0, common_1.UseGuards)(iot_secret_guard_1.IotSecretGuard), (0, swagger_1.ApiOperation)({ summary: 'Process RFID + license plate parking scan' })];
        _recordTelemetry_decorators = [(0, common_1.Post)('telemetry'), (0, common_1.UseGuards)(iot_secret_guard_1.IotSecretGuard), (0, swagger_1.ApiOperation)({ summary: 'Receive telemetry from the local gateway' })];
        _getLatestTelemetry_decorators = [(0, common_1.Get)('telemetry/latest'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Get latest telemetry snapshot' }), (0, swagger_1.ApiQuery)({ name: 'gateId', required: false, type: String })];
        __esDecorate(_classThis, null, _processParkingScan_decorators, { kind: "method", name: "processParkingScan", static: false, private: false, access: { has: function (obj) { return "processParkingScan" in obj; }, get: function (obj) { return obj.processParkingScan; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _recordTelemetry_decorators, { kind: "method", name: "recordTelemetry", static: false, private: false, access: { has: function (obj) { return "recordTelemetry" in obj; }, get: function (obj) { return obj.recordTelemetry; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getLatestTelemetry_decorators, { kind: "method", name: "getLatestTelemetry", static: false, private: false, access: { has: function (obj) { return "getLatestTelemetry" in obj; }, get: function (obj) { return obj.getLatestTelemetry; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        IotController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return IotController = _classThis;
}();
exports.IotController = IotController;
