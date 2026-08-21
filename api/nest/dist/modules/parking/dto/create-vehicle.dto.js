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
exports.CreateVehicleDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var CreateVehicleDto = function () {
    var _a;
    var _plateNumber_decorators;
    var _plateNumber_initializers = [];
    var _plateNumber_extraInitializers = [];
    var _rfidTag_decorators;
    var _rfidTag_initializers = [];
    var _rfidTag_extraInitializers = [];
    var _label_decorators;
    var _label_initializers = [];
    var _label_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateVehicleDto() {
                this.plateNumber = __runInitializers(this, _plateNumber_initializers, void 0);
                this.rfidTag = (__runInitializers(this, _plateNumber_extraInitializers), __runInitializers(this, _rfidTag_initializers, void 0));
                this.label = (__runInitializers(this, _rfidTag_extraInitializers), __runInitializers(this, _label_initializers, void 0));
                __runInitializers(this, _label_extraInitializers);
            }
            return CreateVehicleDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _plateNumber_decorators = [(0, swagger_1.ApiProperty)({ example: '51F-446.14' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MaxLength)(20)];
            _rfidTag_decorators = [(0, swagger_1.ApiProperty)({ example: 'DEMO-RFID-0001' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MaxLength)(64)];
            _label_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Xe may sinh vien' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(100)];
            __esDecorate(null, null, _plateNumber_decorators, { kind: "field", name: "plateNumber", static: false, private: false, access: { has: function (obj) { return "plateNumber" in obj; }, get: function (obj) { return obj.plateNumber; }, set: function (obj, value) { obj.plateNumber = value; } }, metadata: _metadata }, _plateNumber_initializers, _plateNumber_extraInitializers);
            __esDecorate(null, null, _rfidTag_decorators, { kind: "field", name: "rfidTag", static: false, private: false, access: { has: function (obj) { return "rfidTag" in obj; }, get: function (obj) { return obj.rfidTag; }, set: function (obj, value) { obj.rfidTag = value; } }, metadata: _metadata }, _rfidTag_initializers, _rfidTag_extraInitializers);
            __esDecorate(null, null, _label_decorators, { kind: "field", name: "label", static: false, private: false, access: { has: function (obj) { return "label" in obj; }, get: function (obj) { return obj.label; }, set: function (obj, value) { obj.label = value; } }, metadata: _metadata }, _label_initializers, _label_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateVehicleDto = CreateVehicleDto;
