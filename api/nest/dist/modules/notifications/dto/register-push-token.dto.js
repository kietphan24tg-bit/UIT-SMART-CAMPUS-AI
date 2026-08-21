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
exports.RegisterPushTokenDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var PUSH_PLATFORMS = ['ios', 'android'];
var RegisterPushTokenDto = function () {
    var _a;
    var _expoPushToken_decorators;
    var _expoPushToken_initializers = [];
    var _expoPushToken_extraInitializers = [];
    var _platform_decorators;
    var _platform_initializers = [];
    var _platform_extraInitializers = [];
    var _deviceId_decorators;
    var _deviceId_initializers = [];
    var _deviceId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function RegisterPushTokenDto() {
                this.expoPushToken = __runInitializers(this, _expoPushToken_initializers, void 0);
                this.platform = (__runInitializers(this, _expoPushToken_extraInitializers), __runInitializers(this, _platform_initializers, void 0));
                this.deviceId = (__runInitializers(this, _platform_extraInitializers), __runInitializers(this, _deviceId_initializers, void 0));
                __runInitializers(this, _deviceId_extraInitializers);
            }
            return RegisterPushTokenDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _expoPushToken_decorators = [(0, swagger_1.ApiProperty)({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' }), (0, class_validator_1.IsString)()];
            _platform_decorators = [(0, swagger_1.ApiProperty)({ enum: PUSH_PLATFORMS, example: 'android' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsIn)(PUSH_PLATFORMS)];
            _deviceId_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'f2f01ea8-e4eb-4b8d-8c2f-df9e6e74f806' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _expoPushToken_decorators, { kind: "field", name: "expoPushToken", static: false, private: false, access: { has: function (obj) { return "expoPushToken" in obj; }, get: function (obj) { return obj.expoPushToken; }, set: function (obj, value) { obj.expoPushToken = value; } }, metadata: _metadata }, _expoPushToken_initializers, _expoPushToken_extraInitializers);
            __esDecorate(null, null, _platform_decorators, { kind: "field", name: "platform", static: false, private: false, access: { has: function (obj) { return "platform" in obj; }, get: function (obj) { return obj.platform; }, set: function (obj, value) { obj.platform = value; } }, metadata: _metadata }, _platform_initializers, _platform_extraInitializers);
            __esDecorate(null, null, _deviceId_decorators, { kind: "field", name: "deviceId", static: false, private: false, access: { has: function (obj) { return "deviceId" in obj; }, get: function (obj) { return obj.deviceId; }, set: function (obj, value) { obj.deviceId = value; } }, metadata: _metadata }, _deviceId_initializers, _deviceId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.RegisterPushTokenDto = RegisterPushTokenDto;
