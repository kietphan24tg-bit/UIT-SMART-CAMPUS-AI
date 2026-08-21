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
exports.RoomScheduleResponseDto = exports.RoomScheduleDayDto = exports.RoomScheduleSlotDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var RoomScheduleSlotDto = function () {
    var _a;
    var _timeSlotId_decorators;
    var _timeSlotId_initializers = [];
    var _timeSlotId_extraInitializers = [];
    var _slotNumber_decorators;
    var _slotNumber_initializers = [];
    var _slotNumber_extraInitializers = [];
    var _label_decorators;
    var _label_initializers = [];
    var _label_extraInitializers = [];
    var _startTime_decorators;
    var _startTime_initializers = [];
    var _startTime_extraInitializers = [];
    var _endTime_decorators;
    var _endTime_initializers = [];
    var _endTime_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _source_decorators;
    var _source_initializers = [];
    var _source_extraInitializers = [];
    var _title_decorators;
    var _title_initializers = [];
    var _title_extraInitializers = [];
    var _subtitle_decorators;
    var _subtitle_initializers = [];
    var _subtitle_extraInitializers = [];
    var _bookingId_decorators;
    var _bookingId_initializers = [];
    var _bookingId_extraInitializers = [];
    var _classSectionId_decorators;
    var _classSectionId_initializers = [];
    var _classSectionId_extraInitializers = [];
    var _overrideId_decorators;
    var _overrideId_initializers = [];
    var _overrideId_extraInitializers = [];
    var _classMeetingId_decorators;
    var _classMeetingId_initializers = [];
    var _classMeetingId_extraInitializers = [];
    var _editable_decorators;
    var _editable_initializers = [];
    var _editable_extraInitializers = [];
    var _bookable_decorators;
    var _bookable_initializers = [];
    var _bookable_extraInitializers = [];
    return _a = /** @class */ (function () {
            function RoomScheduleSlotDto() {
                this.timeSlotId = __runInitializers(this, _timeSlotId_initializers, void 0);
                this.slotNumber = (__runInitializers(this, _timeSlotId_extraInitializers), __runInitializers(this, _slotNumber_initializers, void 0));
                this.label = (__runInitializers(this, _slotNumber_extraInitializers), __runInitializers(this, _label_initializers, void 0));
                this.startTime = (__runInitializers(this, _label_extraInitializers), __runInitializers(this, _startTime_initializers, void 0));
                this.endTime = (__runInitializers(this, _startTime_extraInitializers), __runInitializers(this, _endTime_initializers, void 0));
                this.status = (__runInitializers(this, _endTime_extraInitializers), __runInitializers(this, _status_initializers, void 0));
                this.source = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _source_initializers, void 0));
                this.title = (__runInitializers(this, _source_extraInitializers), __runInitializers(this, _title_initializers, void 0));
                this.subtitle = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _subtitle_initializers, void 0));
                this.bookingId = (__runInitializers(this, _subtitle_extraInitializers), __runInitializers(this, _bookingId_initializers, void 0));
                this.classSectionId = (__runInitializers(this, _bookingId_extraInitializers), __runInitializers(this, _classSectionId_initializers, void 0));
                this.overrideId = (__runInitializers(this, _classSectionId_extraInitializers), __runInitializers(this, _overrideId_initializers, void 0));
                this.classMeetingId = (__runInitializers(this, _overrideId_extraInitializers), __runInitializers(this, _classMeetingId_initializers, void 0));
                this.editable = (__runInitializers(this, _classMeetingId_extraInitializers), __runInitializers(this, _editable_initializers, void 0));
                this.bookable = (__runInitializers(this, _editable_extraInitializers), __runInitializers(this, _bookable_initializers, void 0));
                __runInitializers(this, _bookable_extraInitializers);
            }
            return RoomScheduleSlotDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _timeSlotId_decorators = [(0, swagger_1.ApiProperty)({ example: 'slot-1' })];
            _slotNumber_decorators = [(0, swagger_1.ApiProperty)({ example: 1 })];
            _label_decorators = [(0, swagger_1.ApiProperty)({ example: 'Tiet 1' })];
            _startTime_decorators = [(0, swagger_1.ApiProperty)({ example: '07:30' })];
            _endTime_decorators = [(0, swagger_1.ApiProperty)({ example: '08:15' })];
            _status_decorators = [(0, swagger_1.ApiProperty)({ enum: ['free', 'occupied', 'available_later'], example: 'occupied' })];
            _source_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: ['semester', 'booking', 'override'], nullable: true, example: 'semester' })];
            _title_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'SE346.Q22', nullable: true })];
            _subtitle_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Software Engineering', nullable: true })];
            _bookingId_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'booking-1', nullable: true })];
            _classSectionId_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'section-1', nullable: true })];
            _overrideId_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'override-1', nullable: true })];
            _classMeetingId_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'meeting-1', nullable: true })];
            _editable_decorators = [(0, swagger_1.ApiProperty)({ example: true })];
            _bookable_decorators = [(0, swagger_1.ApiProperty)({ example: false })];
            __esDecorate(null, null, _timeSlotId_decorators, { kind: "field", name: "timeSlotId", static: false, private: false, access: { has: function (obj) { return "timeSlotId" in obj; }, get: function (obj) { return obj.timeSlotId; }, set: function (obj, value) { obj.timeSlotId = value; } }, metadata: _metadata }, _timeSlotId_initializers, _timeSlotId_extraInitializers);
            __esDecorate(null, null, _slotNumber_decorators, { kind: "field", name: "slotNumber", static: false, private: false, access: { has: function (obj) { return "slotNumber" in obj; }, get: function (obj) { return obj.slotNumber; }, set: function (obj, value) { obj.slotNumber = value; } }, metadata: _metadata }, _slotNumber_initializers, _slotNumber_extraInitializers);
            __esDecorate(null, null, _label_decorators, { kind: "field", name: "label", static: false, private: false, access: { has: function (obj) { return "label" in obj; }, get: function (obj) { return obj.label; }, set: function (obj, value) { obj.label = value; } }, metadata: _metadata }, _label_initializers, _label_extraInitializers);
            __esDecorate(null, null, _startTime_decorators, { kind: "field", name: "startTime", static: false, private: false, access: { has: function (obj) { return "startTime" in obj; }, get: function (obj) { return obj.startTime; }, set: function (obj, value) { obj.startTime = value; } }, metadata: _metadata }, _startTime_initializers, _startTime_extraInitializers);
            __esDecorate(null, null, _endTime_decorators, { kind: "field", name: "endTime", static: false, private: false, access: { has: function (obj) { return "endTime" in obj; }, get: function (obj) { return obj.endTime; }, set: function (obj, value) { obj.endTime = value; } }, metadata: _metadata }, _endTime_initializers, _endTime_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _source_decorators, { kind: "field", name: "source", static: false, private: false, access: { has: function (obj) { return "source" in obj; }, get: function (obj) { return obj.source; }, set: function (obj, value) { obj.source = value; } }, metadata: _metadata }, _source_initializers, _source_extraInitializers);
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _subtitle_decorators, { kind: "field", name: "subtitle", static: false, private: false, access: { has: function (obj) { return "subtitle" in obj; }, get: function (obj) { return obj.subtitle; }, set: function (obj, value) { obj.subtitle = value; } }, metadata: _metadata }, _subtitle_initializers, _subtitle_extraInitializers);
            __esDecorate(null, null, _bookingId_decorators, { kind: "field", name: "bookingId", static: false, private: false, access: { has: function (obj) { return "bookingId" in obj; }, get: function (obj) { return obj.bookingId; }, set: function (obj, value) { obj.bookingId = value; } }, metadata: _metadata }, _bookingId_initializers, _bookingId_extraInitializers);
            __esDecorate(null, null, _classSectionId_decorators, { kind: "field", name: "classSectionId", static: false, private: false, access: { has: function (obj) { return "classSectionId" in obj; }, get: function (obj) { return obj.classSectionId; }, set: function (obj, value) { obj.classSectionId = value; } }, metadata: _metadata }, _classSectionId_initializers, _classSectionId_extraInitializers);
            __esDecorate(null, null, _overrideId_decorators, { kind: "field", name: "overrideId", static: false, private: false, access: { has: function (obj) { return "overrideId" in obj; }, get: function (obj) { return obj.overrideId; }, set: function (obj, value) { obj.overrideId = value; } }, metadata: _metadata }, _overrideId_initializers, _overrideId_extraInitializers);
            __esDecorate(null, null, _classMeetingId_decorators, { kind: "field", name: "classMeetingId", static: false, private: false, access: { has: function (obj) { return "classMeetingId" in obj; }, get: function (obj) { return obj.classMeetingId; }, set: function (obj, value) { obj.classMeetingId = value; } }, metadata: _metadata }, _classMeetingId_initializers, _classMeetingId_extraInitializers);
            __esDecorate(null, null, _editable_decorators, { kind: "field", name: "editable", static: false, private: false, access: { has: function (obj) { return "editable" in obj; }, get: function (obj) { return obj.editable; }, set: function (obj, value) { obj.editable = value; } }, metadata: _metadata }, _editable_initializers, _editable_extraInitializers);
            __esDecorate(null, null, _bookable_decorators, { kind: "field", name: "bookable", static: false, private: false, access: { has: function (obj) { return "bookable" in obj; }, get: function (obj) { return obj.bookable; }, set: function (obj, value) { obj.bookable = value; } }, metadata: _metadata }, _bookable_initializers, _bookable_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.RoomScheduleSlotDto = RoomScheduleSlotDto;
var RoomScheduleDayDto = function () {
    var _a;
    var _dayOfWeek_decorators;
    var _dayOfWeek_initializers = [];
    var _dayOfWeek_extraInitializers = [];
    var _dateKey_decorators;
    var _dateKey_initializers = [];
    var _dateKey_extraInitializers = [];
    var _label_decorators;
    var _label_initializers = [];
    var _label_extraInitializers = [];
    var _slots_decorators;
    var _slots_initializers = [];
    var _slots_extraInitializers = [];
    return _a = /** @class */ (function () {
            function RoomScheduleDayDto() {
                this.dayOfWeek = __runInitializers(this, _dayOfWeek_initializers, void 0);
                this.dateKey = (__runInitializers(this, _dayOfWeek_extraInitializers), __runInitializers(this, _dateKey_initializers, void 0));
                this.label = (__runInitializers(this, _dateKey_extraInitializers), __runInitializers(this, _label_initializers, void 0));
                this.slots = (__runInitializers(this, _label_extraInitializers), __runInitializers(this, _slots_initializers, void 0));
                __runInitializers(this, _slots_extraInitializers);
            }
            return RoomScheduleDayDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _dayOfWeek_decorators = [(0, swagger_1.ApiProperty)({ example: 2, description: '2 = Monday, 7 = Saturday' })];
            _dateKey_decorators = [(0, swagger_1.ApiProperty)({ example: '2026-04-20' })];
            _label_decorators = [(0, swagger_1.ApiProperty)({ example: 'Thu 2' })];
            _slots_decorators = [(0, swagger_1.ApiProperty)({ type: function () { return RoomScheduleSlotDto; }, isArray: true })];
            __esDecorate(null, null, _dayOfWeek_decorators, { kind: "field", name: "dayOfWeek", static: false, private: false, access: { has: function (obj) { return "dayOfWeek" in obj; }, get: function (obj) { return obj.dayOfWeek; }, set: function (obj, value) { obj.dayOfWeek = value; } }, metadata: _metadata }, _dayOfWeek_initializers, _dayOfWeek_extraInitializers);
            __esDecorate(null, null, _dateKey_decorators, { kind: "field", name: "dateKey", static: false, private: false, access: { has: function (obj) { return "dateKey" in obj; }, get: function (obj) { return obj.dateKey; }, set: function (obj, value) { obj.dateKey = value; } }, metadata: _metadata }, _dateKey_initializers, _dateKey_extraInitializers);
            __esDecorate(null, null, _label_decorators, { kind: "field", name: "label", static: false, private: false, access: { has: function (obj) { return "label" in obj; }, get: function (obj) { return obj.label; }, set: function (obj, value) { obj.label = value; } }, metadata: _metadata }, _label_initializers, _label_extraInitializers);
            __esDecorate(null, null, _slots_decorators, { kind: "field", name: "slots", static: false, private: false, access: { has: function (obj) { return "slots" in obj; }, get: function (obj) { return obj.slots; }, set: function (obj, value) { obj.slots = value; } }, metadata: _metadata }, _slots_initializers, _slots_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.RoomScheduleDayDto = RoomScheduleDayDto;
var RoomScheduleResponseDto = function () {
    var _a;
    var _roomCode_decorators;
    var _roomCode_initializers = [];
    var _roomCode_extraInitializers = [];
    var _buildingCode_decorators;
    var _buildingCode_initializers = [];
    var _buildingCode_extraInitializers = [];
    var _buildingName_decorators;
    var _buildingName_initializers = [];
    var _buildingName_extraInitializers = [];
    var _capacity_decorators;
    var _capacity_initializers = [];
    var _capacity_extraInitializers = [];
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _weekStart_decorators;
    var _weekStart_initializers = [];
    var _weekStart_extraInitializers = [];
    var _days_decorators;
    var _days_initializers = [];
    var _days_extraInitializers = [];
    return _a = /** @class */ (function () {
            function RoomScheduleResponseDto() {
                this.roomCode = __runInitializers(this, _roomCode_initializers, void 0);
                this.buildingCode = (__runInitializers(this, _roomCode_extraInitializers), __runInitializers(this, _buildingCode_initializers, void 0));
                this.buildingName = (__runInitializers(this, _buildingCode_extraInitializers), __runInitializers(this, _buildingName_initializers, void 0));
                this.capacity = (__runInitializers(this, _buildingName_extraInitializers), __runInitializers(this, _capacity_initializers, void 0));
                this.name = (__runInitializers(this, _capacity_extraInitializers), __runInitializers(this, _name_initializers, void 0));
                this.weekStart = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _weekStart_initializers, void 0));
                this.days = (__runInitializers(this, _weekStart_extraInitializers), __runInitializers(this, _days_initializers, void 0));
                __runInitializers(this, _days_extraInitializers);
            }
            return RoomScheduleResponseDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _roomCode_decorators = [(0, swagger_1.ApiProperty)({ example: 'B1.02' })];
            _buildingCode_decorators = [(0, swagger_1.ApiProperty)({ example: 'B' })];
            _buildingName_decorators = [(0, swagger_1.ApiProperty)({ example: 'Tòa B' })];
            _capacity_decorators = [(0, swagger_1.ApiProperty)({ example: 60 })];
            _name_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Phong hoc 1', nullable: true })];
            _weekStart_decorators = [(0, swagger_1.ApiProperty)({
                    example: '2026-04-27',
                    description: 'Monday (YYYY-MM-DD) of the week returned; first bookable week if omitted on request.',
                })];
            _days_decorators = [(0, swagger_1.ApiProperty)({ type: function () { return RoomScheduleDayDto; }, isArray: true })];
            __esDecorate(null, null, _roomCode_decorators, { kind: "field", name: "roomCode", static: false, private: false, access: { has: function (obj) { return "roomCode" in obj; }, get: function (obj) { return obj.roomCode; }, set: function (obj, value) { obj.roomCode = value; } }, metadata: _metadata }, _roomCode_initializers, _roomCode_extraInitializers);
            __esDecorate(null, null, _buildingCode_decorators, { kind: "field", name: "buildingCode", static: false, private: false, access: { has: function (obj) { return "buildingCode" in obj; }, get: function (obj) { return obj.buildingCode; }, set: function (obj, value) { obj.buildingCode = value; } }, metadata: _metadata }, _buildingCode_initializers, _buildingCode_extraInitializers);
            __esDecorate(null, null, _buildingName_decorators, { kind: "field", name: "buildingName", static: false, private: false, access: { has: function (obj) { return "buildingName" in obj; }, get: function (obj) { return obj.buildingName; }, set: function (obj, value) { obj.buildingName = value; } }, metadata: _metadata }, _buildingName_initializers, _buildingName_extraInitializers);
            __esDecorate(null, null, _capacity_decorators, { kind: "field", name: "capacity", static: false, private: false, access: { has: function (obj) { return "capacity" in obj; }, get: function (obj) { return obj.capacity; }, set: function (obj, value) { obj.capacity = value; } }, metadata: _metadata }, _capacity_initializers, _capacity_extraInitializers);
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _weekStart_decorators, { kind: "field", name: "weekStart", static: false, private: false, access: { has: function (obj) { return "weekStart" in obj; }, get: function (obj) { return obj.weekStart; }, set: function (obj, value) { obj.weekStart = value; } }, metadata: _metadata }, _weekStart_initializers, _weekStart_extraInitializers);
            __esDecorate(null, null, _days_decorators, { kind: "field", name: "days", static: false, private: false, access: { has: function (obj) { return "days" in obj; }, get: function (obj) { return obj.days; }, set: function (obj, value) { obj.days = value; } }, metadata: _metadata }, _days_initializers, _days_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.RoomScheduleResponseDto = RoomScheduleResponseDto;
