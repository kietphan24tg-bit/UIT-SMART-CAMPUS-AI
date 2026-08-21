"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_transformer_1 = require("class-transformer");
var class_validator_1 = require("class-validator");
var TelemetrySlotDto = function () {
    var _a;
    var _slotNumber_decorators;
    var _slotNumber_initializers = [];
    var _slotNumber_extraInitializers = [];
    var _zone_decorators;
    var _zone_initializers = [];
    var _zone_extraInitializers = [];
    var _occupied_decorators;
    var _occupied_initializers = [];
    var _occupied_extraInitializers = [];
    var _isOccupied_decorators;
    var _isOccupied_initializers = [];
    var _isOccupied_extraInitializers = [];
    return _a = /** @class */ (function () {
            function TelemetrySlotDto() {
                this.slotNumber = __runInitializers(this, _slotNumber_initializers, void 0);
                this.zone = (__runInitializers(this, _slotNumber_extraInitializers), __runInitializers(this, _zone_initializers, void 0));
                this.occupied = (__runInitializers(this, _zone_extraInitializers), __runInitializers(this, _occupied_initializers, void 0));
                this.isOccupied = (__runInitializers(this, _occupied_extraInitializers), __runInitializers(this, _isOccupied_initializers, void 0));
                __runInitializers(this, _isOccupied_extraInitializers);
            }
            return TelemetrySlotDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _slotNumber_decorators = [(0, swagger_1.ApiProperty)({ example: 'A1' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MaxLength)(16)];
            _zone_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Main' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(32)];
            _occupied_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: true }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _isOccupied_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: true }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            __esDecorate(null, null, _slotNumber_decorators, { kind: "field", name: "slotNumber", static: false, private: false, access: { has: function (obj) { return "slotNumber" in obj; }, get: function (obj) { return obj.slotNumber; }, set: function (obj, value) { obj.slotNumber = value; } }, metadata: _metadata }, _slotNumber_initializers, _slotNumber_extraInitializers);
            __esDecorate(null, null, _zone_decorators, { kind: "field", name: "zone", static: false, private: false, access: { has: function (obj) { return "zone" in obj; }, get: function (obj) { return obj.zone; }, set: function (obj, value) { obj.zone = value; } }, metadata: _metadata }, _zone_initializers, _zone_extraInitializers);
            __esDecorate(null, null, _occupied_decorators, { kind: "field", name: "occupied", static: false, private: false, access: { has: function (obj) { return "occupied" in obj; }, get: function (obj) { return obj.occupied; }, set: function (obj, value) { obj.occupied = value; } }, metadata: _metadata }, _occupied_initializers, _occupied_extraInitializers);
            __esDecorate(null, null, _isOccupied_decorators, { kind: "field", name: "isOccupied", static: false, private: false, access: { has: function (obj) { return "isOccupied" in obj; }, get: function (obj) { return obj.isOccupied; }, set: function (obj, value) { obj.isOccupied = value; } }, metadata: _metadata }, _isOccupied_initializers, _isOccupied_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var TelemetryDto = function () {
    var _a;
    var _gateId_decorators;
    var _gateId_initializers = [];
    var _gateId_extraInitializers = [];
    var _deviceIp_decorators;
    var _deviceIp_initializers = [];
    var _deviceIp_extraInitializers = [];
    var _slotBitmap_decorators;
    var _slotBitmap_initializers = [];
    var _slotBitmap_extraInitializers = [];
    var _slots_decorators;
    var _slots_initializers = [];
    var _slots_extraInitializers = [];
    var _temperature_decorators;
    var _temperature_initializers = [];
    var _temperature_extraInitializers = [];
    var _humidity_decorators;
    var _humidity_initializers = [];
    var _humidity_extraInitializers = [];
    var _rainDetected_decorators;
    var _rainDetected_initializers = [];
    var _rainDetected_extraInitializers = [];
    var _fireDetected_decorators;
    var _fireDetected_initializers = [];
    var _fireDetected_extraInitializers = [];
    var _reportedAt_decorators;
    var _reportedAt_initializers = [];
    var _reportedAt_extraInitializers = [];
    return _a = /** @class */ (function () {
            function TelemetryDto() {
                this.gateId = __runInitializers(this, _gateId_initializers, void 0);
                this.deviceIp = (__runInitializers(this, _gateId_extraInitializers), __runInitializers(this, _deviceIp_initializers, void 0));
                this.slotBitmap = (__runInitializers(this, _deviceIp_extraInitializers), __runInitializers(this, _slotBitmap_initializers, void 0));
                this.slots = (__runInitializers(this, _slotBitmap_extraInitializers), __runInitializers(this, _slots_initializers, void 0));
                this.temperature = (__runInitializers(this, _slots_extraInitializers), __runInitializers(this, _temperature_initializers, void 0));
                this.humidity = (__runInitializers(this, _temperature_extraInitializers), __runInitializers(this, _humidity_initializers, void 0));
                this.rainDetected = (__runInitializers(this, _humidity_extraInitializers), __runInitializers(this, _rainDetected_initializers, void 0));
                this.fireDetected = (__runInitializers(this, _rainDetected_extraInitializers), __runInitializers(this, _fireDetected_initializers, void 0));
                this.reportedAt = (__runInitializers(this, _fireDetected_extraInitializers), __runInitializers(this, _reportedAt_initializers, void 0));
                __runInitializers(this, _reportedAt_extraInitializers);
            }
            return TelemetryDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _gateId_decorators = [(0, swagger_1.ApiProperty)({ example: 'uit-gate-a' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MaxLength)(64)];
            _deviceIp_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: '192.168.1.55' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(64)];
            _slotBitmap_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: '01' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(64)];
            _slots_decorators = [(0, swagger_1.ApiProperty)({ type: [TelemetrySlotDto] }), (0, class_validator_1.IsArray)(), (0, class_validator_1.ValidateNested)({ each: true }), (0, class_transformer_1.Type)(function () { return TelemetrySlotDto; })];
            _temperature_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 32.5 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)()];
            _humidity_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 72.4 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)()];
            _rainDetected_decorators = [(0, swagger_1.ApiProperty)({ example: false }), (0, class_validator_1.IsBoolean)()];
            _fireDetected_decorators = [(0, swagger_1.ApiProperty)({ example: false }), (0, class_validator_1.IsBoolean)()];
            _reportedAt_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: '2026-04-06T12:15:00.000Z' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsDateString)()];
            __esDecorate(null, null, _gateId_decorators, { kind: "field", name: "gateId", static: false, private: false, access: { has: function (obj) { return "gateId" in obj; }, get: function (obj) { return obj.gateId; }, set: function (obj, value) { obj.gateId = value; } }, metadata: _metadata }, _gateId_initializers, _gateId_extraInitializers);
            __esDecorate(null, null, _deviceIp_decorators, { kind: "field", name: "deviceIp", static: false, private: false, access: { has: function (obj) { return "deviceIp" in obj; }, get: function (obj) { return obj.deviceIp; }, set: function (obj, value) { obj.deviceIp = value; } }, metadata: _metadata }, _deviceIp_initializers, _deviceIp_extraInitializers);
            __esDecorate(null, null, _slotBitmap_decorators, { kind: "field", name: "slotBitmap", static: false, private: false, access: { has: function (obj) { return "slotBitmap" in obj; }, get: function (obj) { return obj.slotBitmap; }, set: function (obj, value) { obj.slotBitmap = value; } }, metadata: _metadata }, _slotBitmap_initializers, _slotBitmap_extraInitializers);
            __esDecorate(null, null, _slots_decorators, { kind: "field", name: "slots", static: false, private: false, access: { has: function (obj) { return "slots" in obj; }, get: function (obj) { return obj.slots; }, set: function (obj, value) { obj.slots = value; } }, metadata: _metadata }, _slots_initializers, _slots_extraInitializers);
            __esDecorate(null, null, _temperature_decorators, { kind: "field", name: "temperature", static: false, private: false, access: { has: function (obj) { return "temperature" in obj; }, get: function (obj) { return obj.temperature; }, set: function (obj, value) { obj.temperature = value; } }, metadata: _metadata }, _temperature_initializers, _temperature_extraInitializers);
            __esDecorate(null, null, _humidity_decorators, { kind: "field", name: "humidity", static: false, private: false, access: { has: function (obj) { return "humidity" in obj; }, get: function (obj) { return obj.humidity; }, set: function (obj, value) { obj.humidity = value; } }, metadata: _metadata }, _humidity_initializers, _humidity_extraInitializers);
            __esDecorate(null, null, _rainDetected_decorators, { kind: "field", name: "rainDetected", static: false, private: false, access: { has: function (obj) { return "rainDetected" in obj; }, get: function (obj) { return obj.rainDetected; }, set: function (obj, value) { obj.rainDetected = value; } }, metadata: _metadata }, _rainDetected_initializers, _rainDetected_extraInitializers);
            __esDecorate(null, null, _fireDetected_decorators, { kind: "field", name: "fireDetected", static: false, private: false, access: { has: function (obj) { return "fireDetected" in obj; }, get: function (obj) { return obj.fireDetected; }, set: function (obj, value) { obj.fireDetected = value; } }, metadata: _metadata }, _fireDetected_initializers, _fireDetected_extraInitializers);
            __esDecorate(null, null, _reportedAt_decorators, { kind: "field", name: "reportedAt", static: false, private: false, access: { has: function (obj) { return "reportedAt" in obj; }, get: function (obj) { return obj.reportedAt; }, set: function (obj, value) { obj.reportedAt = value; } }, metadata: _metadata }, _reportedAt_initializers, _reportedAt_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.TelemetryDto = TelemetryDto;
