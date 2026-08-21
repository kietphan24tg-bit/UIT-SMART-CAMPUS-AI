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
exports.SosRouteQueryDto = exports.CreateSosRequestDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_transformer_1 = require("class-transformer");
var class_validator_1 = require("class-validator");
var CreateSosRequestDto = function () {
    var _a;
    var _lat_decorators;
    var _lat_initializers = [];
    var _lat_extraInitializers = [];
    var _lng_decorators;
    var _lng_initializers = [];
    var _lng_extraInitializers = [];
    var _accuracyMeters_decorators;
    var _accuracyMeters_initializers = [];
    var _accuracyMeters_extraInitializers = [];
    var _note_decorators;
    var _note_initializers = [];
    var _note_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateSosRequestDto() {
                this.lat = __runInitializers(this, _lat_initializers, void 0);
                this.lng = (__runInitializers(this, _lat_extraInitializers), __runInitializers(this, _lng_initializers, void 0));
                this.accuracyMeters = (__runInitializers(this, _lng_extraInitializers), __runInitializers(this, _accuracyMeters_initializers, void 0));
                this.note = (__runInitializers(this, _accuracyMeters_extraInitializers), __runInitializers(this, _note_initializers, void 0));
                __runInitializers(this, _note_extraInitializers);
            }
            return CreateSosRequestDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _lat_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(-90), (0, class_validator_1.Max)(90)];
            _lng_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(-180), (0, class_validator_1.Max)(180)];
            _accuracyMeters_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0)];
            _note_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _lat_decorators, { kind: "field", name: "lat", static: false, private: false, access: { has: function (obj) { return "lat" in obj; }, get: function (obj) { return obj.lat; }, set: function (obj, value) { obj.lat = value; } }, metadata: _metadata }, _lat_initializers, _lat_extraInitializers);
            __esDecorate(null, null, _lng_decorators, { kind: "field", name: "lng", static: false, private: false, access: { has: function (obj) { return "lng" in obj; }, get: function (obj) { return obj.lng; }, set: function (obj, value) { obj.lng = value; } }, metadata: _metadata }, _lng_initializers, _lng_extraInitializers);
            __esDecorate(null, null, _accuracyMeters_decorators, { kind: "field", name: "accuracyMeters", static: false, private: false, access: { has: function (obj) { return "accuracyMeters" in obj; }, get: function (obj) { return obj.accuracyMeters; }, set: function (obj, value) { obj.accuracyMeters = value; } }, metadata: _metadata }, _accuracyMeters_initializers, _accuracyMeters_extraInitializers);
            __esDecorate(null, null, _note_decorators, { kind: "field", name: "note", static: false, private: false, access: { has: function (obj) { return "note" in obj; }, get: function (obj) { return obj.note; }, set: function (obj, value) { obj.note = value; } }, metadata: _metadata }, _note_initializers, _note_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateSosRequestDto = CreateSosRequestDto;
var SosRouteQueryDto = function () {
    var _a;
    var _fromLat_decorators;
    var _fromLat_initializers = [];
    var _fromLat_extraInitializers = [];
    var _fromLng_decorators;
    var _fromLng_initializers = [];
    var _fromLng_extraInitializers = [];
    return _a = /** @class */ (function () {
            function SosRouteQueryDto() {
                this.fromLat = __runInitializers(this, _fromLat_initializers, void 0);
                this.fromLng = (__runInitializers(this, _fromLat_extraInitializers), __runInitializers(this, _fromLng_initializers, void 0));
                __runInitializers(this, _fromLng_extraInitializers);
            }
            return SosRouteQueryDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _fromLat_decorators = [(0, swagger_1.ApiProperty)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(-90), (0, class_validator_1.Max)(90)];
            _fromLng_decorators = [(0, swagger_1.ApiProperty)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(-180), (0, class_validator_1.Max)(180)];
            __esDecorate(null, null, _fromLat_decorators, { kind: "field", name: "fromLat", static: false, private: false, access: { has: function (obj) { return "fromLat" in obj; }, get: function (obj) { return obj.fromLat; }, set: function (obj, value) { obj.fromLat = value; } }, metadata: _metadata }, _fromLat_initializers, _fromLat_extraInitializers);
            __esDecorate(null, null, _fromLng_decorators, { kind: "field", name: "fromLng", static: false, private: false, access: { has: function (obj) { return "fromLng" in obj; }, get: function (obj) { return obj.fromLng; }, set: function (obj, value) { obj.fromLng = value; } }, metadata: _metadata }, _fromLng_initializers, _fromLng_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.SosRouteQueryDto = SosRouteQueryDto;
