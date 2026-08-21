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
exports.RoomAvailabilityDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var RoomAvailabilityDto = function () {
    var _a;
    var _roomCode_decorators;
    var _roomCode_initializers = [];
    var _roomCode_extraInitializers = [];
    var _capacity_decorators;
    var _capacity_initializers = [];
    var _capacity_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    return _a = /** @class */ (function () {
            function RoomAvailabilityDto() {
                this.roomCode = __runInitializers(this, _roomCode_initializers, void 0);
                this.capacity = (__runInitializers(this, _roomCode_extraInitializers), __runInitializers(this, _capacity_initializers, void 0));
                this.status = (__runInitializers(this, _capacity_extraInitializers), __runInitializers(this, _status_initializers, void 0));
                __runInitializers(this, _status_extraInitializers);
            }
            return RoomAvailabilityDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _roomCode_decorators = [(0, swagger_1.ApiProperty)({ example: 'B1.02' })];
            _capacity_decorators = [(0, swagger_1.ApiProperty)({ example: 60 })];
            _status_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'Trống hiện tại',
                    enum: ['Trống hiện tại', 'Đang được sử dụng'],
                })];
            __esDecorate(null, null, _roomCode_decorators, { kind: "field", name: "roomCode", static: false, private: false, access: { has: function (obj) { return "roomCode" in obj; }, get: function (obj) { return obj.roomCode; }, set: function (obj, value) { obj.roomCode = value; } }, metadata: _metadata }, _roomCode_initializers, _roomCode_extraInitializers);
            __esDecorate(null, null, _capacity_decorators, { kind: "field", name: "capacity", static: false, private: false, access: { has: function (obj) { return "capacity" in obj; }, get: function (obj) { return obj.capacity; }, set: function (obj, value) { obj.capacity = value; } }, metadata: _metadata }, _capacity_initializers, _capacity_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.RoomAvailabilityDto = RoomAvailabilityDto;
