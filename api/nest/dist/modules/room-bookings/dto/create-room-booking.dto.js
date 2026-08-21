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
exports.CreateRoomBookingDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var CreateRoomBookingDto = function () {
    var _a;
    var _roomCode_decorators;
    var _roomCode_initializers = [];
    var _roomCode_extraInitializers = [];
    var _bookingDate_decorators;
    var _bookingDate_initializers = [];
    var _bookingDate_extraInitializers = [];
    var _timeSlotIds_decorators;
    var _timeSlotIds_initializers = [];
    var _timeSlotIds_extraInitializers = [];
    var _purpose_decorators;
    var _purpose_initializers = [];
    var _purpose_extraInitializers = [];
    var _contactName_decorators;
    var _contactName_initializers = [];
    var _contactName_extraInitializers = [];
    var _title_decorators;
    var _title_initializers = [];
    var _title_extraInitializers = [];
    var _attendeeCount_decorators;
    var _attendeeCount_initializers = [];
    var _attendeeCount_extraInitializers = [];
    var _contactPhone_decorators;
    var _contactPhone_initializers = [];
    var _contactPhone_extraInitializers = [];
    var _departmentName_decorators;
    var _departmentName_initializers = [];
    var _departmentName_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateRoomBookingDto() {
                this.roomCode = __runInitializers(this, _roomCode_initializers, void 0);
                this.bookingDate = (__runInitializers(this, _roomCode_extraInitializers), __runInitializers(this, _bookingDate_initializers, void 0));
                this.timeSlotIds = (__runInitializers(this, _bookingDate_extraInitializers), __runInitializers(this, _timeSlotIds_initializers, void 0));
                this.purpose = (__runInitializers(this, _timeSlotIds_extraInitializers), __runInitializers(this, _purpose_initializers, void 0));
                this.contactName = (__runInitializers(this, _purpose_extraInitializers), __runInitializers(this, _contactName_initializers, void 0));
                this.title = (__runInitializers(this, _contactName_extraInitializers), __runInitializers(this, _title_initializers, void 0));
                this.attendeeCount = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _attendeeCount_initializers, void 0));
                this.contactPhone = (__runInitializers(this, _attendeeCount_extraInitializers), __runInitializers(this, _contactPhone_initializers, void 0));
                this.departmentName = (__runInitializers(this, _contactPhone_extraInitializers), __runInitializers(this, _departmentName_initializers, void 0));
                __runInitializers(this, _departmentName_extraInitializers);
            }
            return CreateRoomBookingDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _roomCode_decorators = [(0, swagger_1.ApiProperty)({ example: 'B1.02' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MaxLength)(20)];
            _bookingDate_decorators = [(0, swagger_1.ApiProperty)({ example: '2026-04-24' }), (0, class_validator_1.IsDateString)()];
            _timeSlotIds_decorators = [(0, swagger_1.ApiProperty)({ example: ['slot-1', 'slot-2'] }), (0, class_validator_1.IsArray)(), (0, class_validator_1.ArrayMinSize)(1), (0, class_validator_1.ArrayUnique)(), (0, class_validator_1.IsString)({ each: true }), (0, class_validator_1.IsNotEmpty)({ each: true })];
            _purpose_decorators = [(0, swagger_1.ApiProperty)({ example: 'Học nhóm' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MaxLength)(255)];
            _contactName_decorators = [(0, swagger_1.ApiProperty)({ example: 'Nguyen Van A' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MaxLength)(100)];
            _title_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'SE346 Team Meeting' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(255)];
            _attendeeCount_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 5 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1)];
            _contactPhone_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: '0901234567' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(20)];
            _departmentName_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Khoa Công nghệ phần mềm' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(150)];
            __esDecorate(null, null, _roomCode_decorators, { kind: "field", name: "roomCode", static: false, private: false, access: { has: function (obj) { return "roomCode" in obj; }, get: function (obj) { return obj.roomCode; }, set: function (obj, value) { obj.roomCode = value; } }, metadata: _metadata }, _roomCode_initializers, _roomCode_extraInitializers);
            __esDecorate(null, null, _bookingDate_decorators, { kind: "field", name: "bookingDate", static: false, private: false, access: { has: function (obj) { return "bookingDate" in obj; }, get: function (obj) { return obj.bookingDate; }, set: function (obj, value) { obj.bookingDate = value; } }, metadata: _metadata }, _bookingDate_initializers, _bookingDate_extraInitializers);
            __esDecorate(null, null, _timeSlotIds_decorators, { kind: "field", name: "timeSlotIds", static: false, private: false, access: { has: function (obj) { return "timeSlotIds" in obj; }, get: function (obj) { return obj.timeSlotIds; }, set: function (obj, value) { obj.timeSlotIds = value; } }, metadata: _metadata }, _timeSlotIds_initializers, _timeSlotIds_extraInitializers);
            __esDecorate(null, null, _purpose_decorators, { kind: "field", name: "purpose", static: false, private: false, access: { has: function (obj) { return "purpose" in obj; }, get: function (obj) { return obj.purpose; }, set: function (obj, value) { obj.purpose = value; } }, metadata: _metadata }, _purpose_initializers, _purpose_extraInitializers);
            __esDecorate(null, null, _contactName_decorators, { kind: "field", name: "contactName", static: false, private: false, access: { has: function (obj) { return "contactName" in obj; }, get: function (obj) { return obj.contactName; }, set: function (obj, value) { obj.contactName = value; } }, metadata: _metadata }, _contactName_initializers, _contactName_extraInitializers);
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _attendeeCount_decorators, { kind: "field", name: "attendeeCount", static: false, private: false, access: { has: function (obj) { return "attendeeCount" in obj; }, get: function (obj) { return obj.attendeeCount; }, set: function (obj, value) { obj.attendeeCount = value; } }, metadata: _metadata }, _attendeeCount_initializers, _attendeeCount_extraInitializers);
            __esDecorate(null, null, _contactPhone_decorators, { kind: "field", name: "contactPhone", static: false, private: false, access: { has: function (obj) { return "contactPhone" in obj; }, get: function (obj) { return obj.contactPhone; }, set: function (obj, value) { obj.contactPhone = value; } }, metadata: _metadata }, _contactPhone_initializers, _contactPhone_extraInitializers);
            __esDecorate(null, null, _departmentName_decorators, { kind: "field", name: "departmentName", static: false, private: false, access: { has: function (obj) { return "departmentName" in obj; }, get: function (obj) { return obj.departmentName; }, set: function (obj, value) { obj.departmentName = value; } }, metadata: _metadata }, _departmentName_initializers, _departmentName_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateRoomBookingDto = CreateRoomBookingDto;
