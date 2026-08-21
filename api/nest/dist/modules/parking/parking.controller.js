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
exports.ParkingController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var ParkingController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Parking'), (0, common_1.Controller)('parking')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getStatus_decorators;
    var _getVehicles_decorators;
    var _createVehicle_decorators;
    var ParkingController = _classThis = /** @class */ (function () {
        function ParkingController_1(parkingService) {
            this.parkingService = (__runInitializers(this, _instanceExtraInitializers), parkingService);
        }
        ParkingController_1.prototype.getStatus = function (gateId) {
            return this.parkingService.getStatus(gateId);
        };
        ParkingController_1.prototype.getVehicles = function (userId) {
            return this.parkingService.listVehicles(userId);
        };
        ParkingController_1.prototype.createVehicle = function (userId, dto) {
            return this.parkingService.createVehicle(userId, dto);
        };
        return ParkingController_1;
    }());
    __setFunctionName(_classThis, "ParkingController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getStatus_decorators = [(0, common_1.Get)('status'), (0, swagger_1.ApiOperation)({ summary: 'Get current parking status' }), (0, swagger_1.ApiQuery)({ name: 'gateId', required: false, type: String })];
        _getVehicles_decorators = [(0, common_1.Get)('vehicles'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Get vehicles registered by current user' })];
        _createVehicle_decorators = [(0, common_1.Post)('vehicles'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Register a vehicle for parking access' })];
        __esDecorate(_classThis, null, _getStatus_decorators, { kind: "method", name: "getStatus", static: false, private: false, access: { has: function (obj) { return "getStatus" in obj; }, get: function (obj) { return obj.getStatus; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getVehicles_decorators, { kind: "method", name: "getVehicles", static: false, private: false, access: { has: function (obj) { return "getVehicles" in obj; }, get: function (obj) { return obj.getVehicles; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createVehicle_decorators, { kind: "method", name: "createVehicle", static: false, private: false, access: { has: function (obj) { return "createVehicle" in obj; }, get: function (obj) { return obj.createVehicle; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ParkingController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ParkingController = _classThis;
}();
exports.ParkingController = ParkingController;
