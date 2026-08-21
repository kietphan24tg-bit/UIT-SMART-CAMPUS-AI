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
exports.ReplaceClassMeetingsDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_transformer_1 = require("class-transformer");
var class_validator_1 = require("class-validator");
var scheduleSessionTypeValues = ['daytime', 'evening'];
var ClassMeetingInputDto = function () {
    var _a;
    var _dayOfWeek_decorators;
    var _dayOfWeek_initializers = [];
    var _dayOfWeek_extraInitializers = [];
    var _startTime_decorators;
    var _startTime_initializers = [];
    var _startTime_extraInitializers = [];
    var _endTime_decorators;
    var _endTime_initializers = [];
    var _endTime_extraInitializers = [];
    var _startPeriod_decorators;
    var _startPeriod_initializers = [];
    var _startPeriod_extraInitializers = [];
    var _endPeriod_decorators;
    var _endPeriod_initializers = [];
    var _endPeriod_extraInitializers = [];
    var _room_decorators;
    var _room_initializers = [];
    var _room_extraInitializers = [];
    var _sessionType_decorators;
    var _sessionType_initializers = [];
    var _sessionType_extraInitializers = [];
    var _note_decorators;
    var _note_initializers = [];
    var _note_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ClassMeetingInputDto() {
                this.dayOfWeek = __runInitializers(this, _dayOfWeek_initializers, void 0);
                this.startTime = (__runInitializers(this, _dayOfWeek_extraInitializers), __runInitializers(this, _startTime_initializers, void 0));
                this.endTime = (__runInitializers(this, _startTime_extraInitializers), __runInitializers(this, _endTime_initializers, void 0));
                this.startPeriod = (__runInitializers(this, _endTime_extraInitializers), __runInitializers(this, _startPeriod_initializers, void 0));
                this.endPeriod = (__runInitializers(this, _startPeriod_extraInitializers), __runInitializers(this, _endPeriod_initializers, void 0));
                this.room = (__runInitializers(this, _endPeriod_extraInitializers), __runInitializers(this, _room_initializers, void 0));
                this.sessionType = (__runInitializers(this, _room_extraInitializers), __runInitializers(this, _sessionType_initializers, void 0));
                this.note = (__runInitializers(this, _sessionType_extraInitializers), __runInitializers(this, _note_initializers, void 0));
                __runInitializers(this, _note_extraInitializers);
            }
            return ClassMeetingInputDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _dayOfWeek_decorators = [(0, swagger_1.ApiProperty)({ example: 2, description: '2 = Monday, 7 = Saturday' }), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(7)];
            _startTime_decorators = [(0, swagger_1.ApiProperty)({ example: '07:30' }), (0, class_validator_1.IsString)()];
            _endTime_decorators = [(0, swagger_1.ApiProperty)({ example: '10:00' }), (0, class_validator_1.IsString)()];
            _startPeriod_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 1 }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsInt)()];
            _endPeriod_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 4 }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsInt)()];
            _room_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'B1.02' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _sessionType_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: scheduleSessionTypeValues, default: 'daytime' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(scheduleSessionTypeValues)];
            _note_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Thuc hanh phong lab' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _dayOfWeek_decorators, { kind: "field", name: "dayOfWeek", static: false, private: false, access: { has: function (obj) { return "dayOfWeek" in obj; }, get: function (obj) { return obj.dayOfWeek; }, set: function (obj, value) { obj.dayOfWeek = value; } }, metadata: _metadata }, _dayOfWeek_initializers, _dayOfWeek_extraInitializers);
            __esDecorate(null, null, _startTime_decorators, { kind: "field", name: "startTime", static: false, private: false, access: { has: function (obj) { return "startTime" in obj; }, get: function (obj) { return obj.startTime; }, set: function (obj, value) { obj.startTime = value; } }, metadata: _metadata }, _startTime_initializers, _startTime_extraInitializers);
            __esDecorate(null, null, _endTime_decorators, { kind: "field", name: "endTime", static: false, private: false, access: { has: function (obj) { return "endTime" in obj; }, get: function (obj) { return obj.endTime; }, set: function (obj, value) { obj.endTime = value; } }, metadata: _metadata }, _endTime_initializers, _endTime_extraInitializers);
            __esDecorate(null, null, _startPeriod_decorators, { kind: "field", name: "startPeriod", static: false, private: false, access: { has: function (obj) { return "startPeriod" in obj; }, get: function (obj) { return obj.startPeriod; }, set: function (obj, value) { obj.startPeriod = value; } }, metadata: _metadata }, _startPeriod_initializers, _startPeriod_extraInitializers);
            __esDecorate(null, null, _endPeriod_decorators, { kind: "field", name: "endPeriod", static: false, private: false, access: { has: function (obj) { return "endPeriod" in obj; }, get: function (obj) { return obj.endPeriod; }, set: function (obj, value) { obj.endPeriod = value; } }, metadata: _metadata }, _endPeriod_initializers, _endPeriod_extraInitializers);
            __esDecorate(null, null, _room_decorators, { kind: "field", name: "room", static: false, private: false, access: { has: function (obj) { return "room" in obj; }, get: function (obj) { return obj.room; }, set: function (obj, value) { obj.room = value; } }, metadata: _metadata }, _room_initializers, _room_extraInitializers);
            __esDecorate(null, null, _sessionType_decorators, { kind: "field", name: "sessionType", static: false, private: false, access: { has: function (obj) { return "sessionType" in obj; }, get: function (obj) { return obj.sessionType; }, set: function (obj, value) { obj.sessionType = value; } }, metadata: _metadata }, _sessionType_initializers, _sessionType_extraInitializers);
            __esDecorate(null, null, _note_decorators, { kind: "field", name: "note", static: false, private: false, access: { has: function (obj) { return "note" in obj; }, get: function (obj) { return obj.note; }, set: function (obj, value) { obj.note = value; } }, metadata: _metadata }, _note_initializers, _note_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var ReplaceClassMeetingsDto = function () {
    var _a;
    var _meetings_decorators;
    var _meetings_initializers = [];
    var _meetings_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ReplaceClassMeetingsDto() {
                this.meetings = __runInitializers(this, _meetings_initializers, void 0);
                __runInitializers(this, _meetings_extraInitializers);
            }
            return ReplaceClassMeetingsDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _meetings_decorators = [(0, swagger_1.ApiProperty)({ type: function () { return [ClassMeetingInputDto]; } }), (0, class_validator_1.IsArray)(), (0, class_validator_1.ValidateNested)({ each: true }), (0, class_transformer_1.Type)(function () { return ClassMeetingInputDto; })];
            __esDecorate(null, null, _meetings_decorators, { kind: "field", name: "meetings", static: false, private: false, access: { has: function (obj) { return "meetings" in obj; }, get: function (obj) { return obj.meetings; }, set: function (obj, value) { obj.meetings = value; } }, metadata: _metadata }, _meetings_initializers, _meetings_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ReplaceClassMeetingsDto = ReplaceClassMeetingsDto;
