"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.MoveClassMeetingDto = exports.ClassMeetingOverrideDto = exports.UpdateRoomScheduleOverrideDto = exports.CreateRoomScheduleOverrideDto = exports.RejectRoomBookingSlotDto = exports.ApproveOneRoomBookingDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var ApproveOneRoomBookingDto = function () {
    var _a;
    var _bookingId_decorators;
    var _bookingId_initializers = [];
    var _bookingId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ApproveOneRoomBookingDto() {
                this.bookingId = __runInitializers(this, _bookingId_initializers, void 0);
                __runInitializers(this, _bookingId_extraInitializers);
            }
            return ApproveOneRoomBookingDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _bookingId_decorators = [(0, swagger_1.ApiProperty)({ example: 'booking-1' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            __esDecorate(null, null, _bookingId_decorators, { kind: "field", name: "bookingId", static: false, private: false, access: { has: function (obj) { return "bookingId" in obj; }, get: function (obj) { return obj.bookingId; }, set: function (obj, value) { obj.bookingId = value; } }, metadata: _metadata }, _bookingId_initializers, _bookingId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ApproveOneRoomBookingDto = ApproveOneRoomBookingDto;
var RejectRoomBookingSlotDto = function () {
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
    var _reason_decorators;
    var _reason_initializers = [];
    var _reason_extraInitializers = [];
    return _a = /** @class */ (function () {
            function RejectRoomBookingSlotDto() {
                this.roomCode = __runInitializers(this, _roomCode_initializers, void 0);
                this.bookingDate = (__runInitializers(this, _roomCode_extraInitializers), __runInitializers(this, _bookingDate_initializers, void 0));
                this.timeSlotIds = (__runInitializers(this, _bookingDate_extraInitializers), __runInitializers(this, _timeSlotIds_initializers, void 0));
                this.reason = (__runInitializers(this, _timeSlotIds_extraInitializers), __runInitializers(this, _reason_initializers, void 0));
                __runInitializers(this, _reason_extraInitializers);
            }
            return RejectRoomBookingSlotDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _roomCode_decorators = [(0, swagger_1.ApiProperty)({ example: 'B1.14' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MaxLength)(20)];
            _bookingDate_decorators = [(0, swagger_1.ApiProperty)({ example: '2026-05-04' }), (0, class_validator_1.IsDateString)()];
            _timeSlotIds_decorators = [(0, swagger_1.ApiProperty)({ example: ['slot-2'] }), (0, class_validator_1.ArrayMinSize)(1), (0, class_validator_1.ArrayUnique)(), (0, class_validator_1.IsString)({ each: true })];
            _reason_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Khong duoc phe duyet' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(255)];
            __esDecorate(null, null, _roomCode_decorators, { kind: "field", name: "roomCode", static: false, private: false, access: { has: function (obj) { return "roomCode" in obj; }, get: function (obj) { return obj.roomCode; }, set: function (obj, value) { obj.roomCode = value; } }, metadata: _metadata }, _roomCode_initializers, _roomCode_extraInitializers);
            __esDecorate(null, null, _bookingDate_decorators, { kind: "field", name: "bookingDate", static: false, private: false, access: { has: function (obj) { return "bookingDate" in obj; }, get: function (obj) { return obj.bookingDate; }, set: function (obj, value) { obj.bookingDate = value; } }, metadata: _metadata }, _bookingDate_initializers, _bookingDate_extraInitializers);
            __esDecorate(null, null, _timeSlotIds_decorators, { kind: "field", name: "timeSlotIds", static: false, private: false, access: { has: function (obj) { return "timeSlotIds" in obj; }, get: function (obj) { return obj.timeSlotIds; }, set: function (obj, value) { obj.timeSlotIds = value; } }, metadata: _metadata }, _timeSlotIds_initializers, _timeSlotIds_extraInitializers);
            __esDecorate(null, null, _reason_decorators, { kind: "field", name: "reason", static: false, private: false, access: { has: function (obj) { return "reason" in obj; }, get: function (obj) { return obj.reason; }, set: function (obj, value) { obj.reason = value; } }, metadata: _metadata }, _reason_initializers, _reason_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.RejectRoomBookingSlotDto = RejectRoomBookingSlotDto;
var CreateRoomScheduleOverrideDto = function () {
    var _a;
    var _roomCode_decorators;
    var _roomCode_initializers = [];
    var _roomCode_extraInitializers = [];
    var _overrideDate_decorators;
    var _overrideDate_initializers = [];
    var _overrideDate_extraInitializers = [];
    var _timeSlotId_decorators;
    var _timeSlotId_initializers = [];
    var _timeSlotId_extraInitializers = [];
    var _type_decorators;
    var _type_initializers = [];
    var _type_extraInitializers = [];
    var _title_decorators;
    var _title_initializers = [];
    var _title_extraInitializers = [];
    var _note_decorators;
    var _note_initializers = [];
    var _note_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateRoomScheduleOverrideDto() {
                this.roomCode = __runInitializers(this, _roomCode_initializers, void 0);
                this.overrideDate = (__runInitializers(this, _roomCode_extraInitializers), __runInitializers(this, _overrideDate_initializers, void 0));
                this.timeSlotId = (__runInitializers(this, _overrideDate_extraInitializers), __runInitializers(this, _timeSlotId_initializers, void 0));
                this.type = (__runInitializers(this, _timeSlotId_extraInitializers), __runInitializers(this, _type_initializers, void 0));
                this.title = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _title_initializers, void 0));
                this.note = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _note_initializers, void 0));
                __runInitializers(this, _note_extraInitializers);
            }
            return CreateRoomScheduleOverrideDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _roomCode_decorators = [(0, swagger_1.ApiProperty)({ example: 'B1.14' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MaxLength)(20)];
            _overrideDate_decorators = [(0, swagger_1.ApiProperty)({ example: '2026-05-04' }), (0, class_validator_1.IsDateString)()];
            _timeSlotId_decorators = [(0, swagger_1.ApiProperty)({ example: 'slot-2' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _type_decorators = [(0, swagger_1.ApiProperty)({ enum: ['manual', 'maintenance'], example: 'manual' }), (0, class_validator_1.IsIn)(['manual', 'maintenance'])];
            _title_decorators = [(0, swagger_1.ApiProperty)({ example: 'Hoc bu SE346' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MaxLength)(255)];
            _note_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Muc dich: Hoc bu\nSo nguoi: 45' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(500)];
            __esDecorate(null, null, _roomCode_decorators, { kind: "field", name: "roomCode", static: false, private: false, access: { has: function (obj) { return "roomCode" in obj; }, get: function (obj) { return obj.roomCode; }, set: function (obj, value) { obj.roomCode = value; } }, metadata: _metadata }, _roomCode_initializers, _roomCode_extraInitializers);
            __esDecorate(null, null, _overrideDate_decorators, { kind: "field", name: "overrideDate", static: false, private: false, access: { has: function (obj) { return "overrideDate" in obj; }, get: function (obj) { return obj.overrideDate; }, set: function (obj, value) { obj.overrideDate = value; } }, metadata: _metadata }, _overrideDate_initializers, _overrideDate_extraInitializers);
            __esDecorate(null, null, _timeSlotId_decorators, { kind: "field", name: "timeSlotId", static: false, private: false, access: { has: function (obj) { return "timeSlotId" in obj; }, get: function (obj) { return obj.timeSlotId; }, set: function (obj, value) { obj.timeSlotId = value; } }, metadata: _metadata }, _timeSlotId_initializers, _timeSlotId_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: function (obj) { return "type" in obj; }, get: function (obj) { return obj.type; }, set: function (obj, value) { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _note_decorators, { kind: "field", name: "note", static: false, private: false, access: { has: function (obj) { return "note" in obj; }, get: function (obj) { return obj.note; }, set: function (obj, value) { obj.note = value; } }, metadata: _metadata }, _note_initializers, _note_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateRoomScheduleOverrideDto = CreateRoomScheduleOverrideDto;
var UpdateRoomScheduleOverrideDto = function () {
    var _a;
    var _title_decorators;
    var _title_initializers = [];
    var _title_extraInitializers = [];
    var _note_decorators;
    var _note_initializers = [];
    var _note_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpdateRoomScheduleOverrideDto() {
                this.title = __runInitializers(this, _title_initializers, void 0);
                this.note = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _note_initializers, void 0));
                __runInitializers(this, _note_extraInitializers);
            }
            return UpdateRoomScheduleOverrideDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _title_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Bao tri phong' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(255)];
            _note_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Cap nhat ghi chu' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(500)];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _note_decorators, { kind: "field", name: "note", static: false, private: false, access: { has: function (obj) { return "note" in obj; }, get: function (obj) { return obj.note; }, set: function (obj, value) { obj.note = value; } }, metadata: _metadata }, _note_initializers, _note_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateRoomScheduleOverrideDto = UpdateRoomScheduleOverrideDto;
var ClassMeetingOverrideDto = function () {
    var _a;
    var _overrideDate_decorators;
    var _overrideDate_initializers = [];
    var _overrideDate_extraInitializers = [];
    var _note_decorators;
    var _note_initializers = [];
    var _note_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ClassMeetingOverrideDto() {
                this.overrideDate = __runInitializers(this, _overrideDate_initializers, void 0);
                this.note = (__runInitializers(this, _overrideDate_extraInitializers), __runInitializers(this, _note_initializers, void 0));
                __runInitializers(this, _note_extraInitializers);
            }
            return ClassMeetingOverrideDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _overrideDate_decorators = [(0, swagger_1.ApiProperty)({ example: '2026-05-04' }), (0, class_validator_1.IsDateString)()];
            _note_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Phong bao tri' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(500)];
            __esDecorate(null, null, _overrideDate_decorators, { kind: "field", name: "overrideDate", static: false, private: false, access: { has: function (obj) { return "overrideDate" in obj; }, get: function (obj) { return obj.overrideDate; }, set: function (obj, value) { obj.overrideDate = value; } }, metadata: _metadata }, _overrideDate_initializers, _overrideDate_extraInitializers);
            __esDecorate(null, null, _note_decorators, { kind: "field", name: "note", static: false, private: false, access: { has: function (obj) { return "note" in obj; }, get: function (obj) { return obj.note; }, set: function (obj, value) { obj.note = value; } }, metadata: _metadata }, _note_initializers, _note_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ClassMeetingOverrideDto = ClassMeetingOverrideDto;
var MoveClassMeetingDto = function () {
    var _a;
    var _classSuper = ClassMeetingOverrideDto;
    var _roomCode_decorators;
    var _roomCode_initializers = [];
    var _roomCode_extraInitializers = [];
    var _timeSlotId_decorators;
    var _timeSlotId_initializers = [];
    var _timeSlotId_extraInitializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(MoveClassMeetingDto, _super);
            function MoveClassMeetingDto() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.roomCode = __runInitializers(_this, _roomCode_initializers, void 0);
                _this.timeSlotId = (__runInitializers(_this, _roomCode_extraInitializers), __runInitializers(_this, _timeSlotId_initializers, void 0));
                __runInitializers(_this, _timeSlotId_extraInitializers);
                return _this;
            }
            return MoveClassMeetingDto;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _roomCode_decorators = [(0, swagger_1.ApiProperty)({ example: 'B1.14' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MaxLength)(20)];
            _timeSlotId_decorators = [(0, swagger_1.ApiProperty)({ example: 'slot-3' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            __esDecorate(null, null, _roomCode_decorators, { kind: "field", name: "roomCode", static: false, private: false, access: { has: function (obj) { return "roomCode" in obj; }, get: function (obj) { return obj.roomCode; }, set: function (obj, value) { obj.roomCode = value; } }, metadata: _metadata }, _roomCode_initializers, _roomCode_extraInitializers);
            __esDecorate(null, null, _timeSlotId_decorators, { kind: "field", name: "timeSlotId", static: false, private: false, access: { has: function (obj) { return "timeSlotId" in obj; }, get: function (obj) { return obj.timeSlotId; }, set: function (obj, value) { obj.timeSlotId = value; } }, metadata: _metadata }, _timeSlotId_initializers, _timeSlotId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.MoveClassMeetingDto = MoveClassMeetingDto;
