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
exports.RoomBookingResponseDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var RoomBookingTimeSlotDto = function () {
    var _a;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
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
    return _a = /** @class */ (function () {
            function RoomBookingTimeSlotDto() {
                this.id = __runInitializers(this, _id_initializers, void 0);
                this.slotNumber = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _slotNumber_initializers, void 0));
                this.label = (__runInitializers(this, _slotNumber_extraInitializers), __runInitializers(this, _label_initializers, void 0));
                this.startTime = (__runInitializers(this, _label_extraInitializers), __runInitializers(this, _startTime_initializers, void 0));
                this.endTime = (__runInitializers(this, _startTime_extraInitializers), __runInitializers(this, _endTime_initializers, void 0));
                __runInitializers(this, _endTime_extraInitializers);
            }
            return RoomBookingTimeSlotDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [(0, swagger_1.ApiProperty)({ example: 'slot-1' })];
            _slotNumber_decorators = [(0, swagger_1.ApiProperty)({ example: 1 })];
            _label_decorators = [(0, swagger_1.ApiProperty)({ example: 'Tiết 1' })];
            _startTime_decorators = [(0, swagger_1.ApiProperty)({ example: '07:30' })];
            _endTime_decorators = [(0, swagger_1.ApiProperty)({ example: '08:15' })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _slotNumber_decorators, { kind: "field", name: "slotNumber", static: false, private: false, access: { has: function (obj) { return "slotNumber" in obj; }, get: function (obj) { return obj.slotNumber; }, set: function (obj, value) { obj.slotNumber = value; } }, metadata: _metadata }, _slotNumber_initializers, _slotNumber_extraInitializers);
            __esDecorate(null, null, _label_decorators, { kind: "field", name: "label", static: false, private: false, access: { has: function (obj) { return "label" in obj; }, get: function (obj) { return obj.label; }, set: function (obj, value) { obj.label = value; } }, metadata: _metadata }, _label_initializers, _label_extraInitializers);
            __esDecorate(null, null, _startTime_decorators, { kind: "field", name: "startTime", static: false, private: false, access: { has: function (obj) { return "startTime" in obj; }, get: function (obj) { return obj.startTime; }, set: function (obj, value) { obj.startTime = value; } }, metadata: _metadata }, _startTime_initializers, _startTime_extraInitializers);
            __esDecorate(null, null, _endTime_decorators, { kind: "field", name: "endTime", static: false, private: false, access: { has: function (obj) { return "endTime" in obj; }, get: function (obj) { return obj.endTime; }, set: function (obj, value) { obj.endTime = value; } }, metadata: _metadata }, _endTime_initializers, _endTime_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var RoomBookingResponseDto = function () {
    var _a;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _roomCode_decorators;
    var _roomCode_initializers = [];
    var _roomCode_extraInitializers = [];
    var _roomName_decorators;
    var _roomName_initializers = [];
    var _roomName_extraInitializers = [];
    var _buildingCode_decorators;
    var _buildingCode_initializers = [];
    var _buildingCode_extraInitializers = [];
    var _buildingName_decorators;
    var _buildingName_initializers = [];
    var _buildingName_extraInitializers = [];
    var _bookingDate_decorators;
    var _bookingDate_initializers = [];
    var _bookingDate_extraInitializers = [];
    var _timeSlotIds_decorators;
    var _timeSlotIds_initializers = [];
    var _timeSlotIds_extraInitializers = [];
    var _timeSlots_decorators;
    var _timeSlots_initializers = [];
    var _timeSlots_extraInitializers = [];
    var _slotCount_decorators;
    var _slotCount_initializers = [];
    var _slotCount_extraInitializers = [];
    var _startTime_decorators;
    var _startTime_initializers = [];
    var _startTime_extraInitializers = [];
    var _endTime_decorators;
    var _endTime_initializers = [];
    var _endTime_extraInitializers = [];
    var _title_decorators;
    var _title_initializers = [];
    var _title_extraInitializers = [];
    var _purpose_decorators;
    var _purpose_initializers = [];
    var _purpose_extraInitializers = [];
    var _attendeeCount_decorators;
    var _attendeeCount_initializers = [];
    var _attendeeCount_extraInitializers = [];
    var _contactName_decorators;
    var _contactName_initializers = [];
    var _contactName_extraInitializers = [];
    var _contactPhone_decorators;
    var _contactPhone_initializers = [];
    var _contactPhone_extraInitializers = [];
    var _departmentName_decorators;
    var _departmentName_initializers = [];
    var _departmentName_extraInitializers = [];
    var _notes_decorators;
    var _notes_initializers = [];
    var _notes_extraInitializers = [];
    var _approvedAt_decorators;
    var _approvedAt_initializers = [];
    var _approvedAt_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    return _a = /** @class */ (function () {
            function RoomBookingResponseDto() {
                this.id = __runInitializers(this, _id_initializers, void 0);
                this.roomCode = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _roomCode_initializers, void 0));
                this.roomName = (__runInitializers(this, _roomCode_extraInitializers), __runInitializers(this, _roomName_initializers, void 0));
                this.buildingCode = (__runInitializers(this, _roomName_extraInitializers), __runInitializers(this, _buildingCode_initializers, void 0));
                this.buildingName = (__runInitializers(this, _buildingCode_extraInitializers), __runInitializers(this, _buildingName_initializers, void 0));
                this.bookingDate = (__runInitializers(this, _buildingName_extraInitializers), __runInitializers(this, _bookingDate_initializers, void 0));
                this.timeSlotIds = (__runInitializers(this, _bookingDate_extraInitializers), __runInitializers(this, _timeSlotIds_initializers, void 0));
                this.timeSlots = (__runInitializers(this, _timeSlotIds_extraInitializers), __runInitializers(this, _timeSlots_initializers, void 0));
                this.slotCount = (__runInitializers(this, _timeSlots_extraInitializers), __runInitializers(this, _slotCount_initializers, void 0));
                this.startTime = (__runInitializers(this, _slotCount_extraInitializers), __runInitializers(this, _startTime_initializers, void 0));
                this.endTime = (__runInitializers(this, _startTime_extraInitializers), __runInitializers(this, _endTime_initializers, void 0));
                this.title = (__runInitializers(this, _endTime_extraInitializers), __runInitializers(this, _title_initializers, void 0));
                this.purpose = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _purpose_initializers, void 0));
                this.attendeeCount = (__runInitializers(this, _purpose_extraInitializers), __runInitializers(this, _attendeeCount_initializers, void 0));
                this.contactName = (__runInitializers(this, _attendeeCount_extraInitializers), __runInitializers(this, _contactName_initializers, void 0));
                this.contactPhone = (__runInitializers(this, _contactName_extraInitializers), __runInitializers(this, _contactPhone_initializers, void 0));
                this.departmentName = (__runInitializers(this, _contactPhone_extraInitializers), __runInitializers(this, _departmentName_initializers, void 0));
                this.notes = (__runInitializers(this, _departmentName_extraInitializers), __runInitializers(this, _notes_initializers, void 0));
                this.approvedAt = (__runInitializers(this, _notes_extraInitializers), __runInitializers(this, _approvedAt_initializers, void 0));
                this.status = (__runInitializers(this, _approvedAt_extraInitializers), __runInitializers(this, _status_initializers, void 0));
                this.createdAt = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
                __runInitializers(this, _createdAt_extraInitializers);
            }
            return RoomBookingResponseDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [(0, swagger_1.ApiProperty)({ example: 'booking-1' })];
            _roomCode_decorators = [(0, swagger_1.ApiProperty)({ example: 'B1.02' })];
            _roomName_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Phòng họp khoa', nullable: true })];
            _buildingCode_decorators = [(0, swagger_1.ApiProperty)({ example: 'B' })];
            _buildingName_decorators = [(0, swagger_1.ApiProperty)({ example: 'Tòa B' })];
            _bookingDate_decorators = [(0, swagger_1.ApiProperty)({ example: '2026-04-24' })];
            _timeSlotIds_decorators = [(0, swagger_1.ApiProperty)({ example: ['slot-1', 'slot-2'] })];
            _timeSlots_decorators = [(0, swagger_1.ApiProperty)({ type: function () { return RoomBookingTimeSlotDto; }, isArray: true })];
            _slotCount_decorators = [(0, swagger_1.ApiProperty)({ example: 2 })];
            _startTime_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: '07:30', nullable: true })];
            _endTime_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: '09:00', nullable: true })];
            _title_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'SE346 Team Meeting', nullable: true })];
            _purpose_decorators = [(0, swagger_1.ApiProperty)({ example: 'Học nhóm' })];
            _attendeeCount_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 5, nullable: true })];
            _contactName_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Nguyen Van A', nullable: true })];
            _contactPhone_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: '0901234567', nullable: true })];
            _departmentName_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Khoa Công nghệ phần mềm', nullable: true })];
            _notes_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Ghi chú nội bộ', nullable: true })];
            _approvedAt_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: '2026-04-23T10:00:00.000Z', nullable: true })];
            _status_decorators = [(0, swagger_1.ApiProperty)({ enum: ['pending', 'approved', 'booked', 'maintenance', 'rejected', 'cancelled'] })];
            _createdAt_decorators = [(0, swagger_1.ApiProperty)({ example: '2026-04-23T10:00:00.000Z' })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _roomCode_decorators, { kind: "field", name: "roomCode", static: false, private: false, access: { has: function (obj) { return "roomCode" in obj; }, get: function (obj) { return obj.roomCode; }, set: function (obj, value) { obj.roomCode = value; } }, metadata: _metadata }, _roomCode_initializers, _roomCode_extraInitializers);
            __esDecorate(null, null, _roomName_decorators, { kind: "field", name: "roomName", static: false, private: false, access: { has: function (obj) { return "roomName" in obj; }, get: function (obj) { return obj.roomName; }, set: function (obj, value) { obj.roomName = value; } }, metadata: _metadata }, _roomName_initializers, _roomName_extraInitializers);
            __esDecorate(null, null, _buildingCode_decorators, { kind: "field", name: "buildingCode", static: false, private: false, access: { has: function (obj) { return "buildingCode" in obj; }, get: function (obj) { return obj.buildingCode; }, set: function (obj, value) { obj.buildingCode = value; } }, metadata: _metadata }, _buildingCode_initializers, _buildingCode_extraInitializers);
            __esDecorate(null, null, _buildingName_decorators, { kind: "field", name: "buildingName", static: false, private: false, access: { has: function (obj) { return "buildingName" in obj; }, get: function (obj) { return obj.buildingName; }, set: function (obj, value) { obj.buildingName = value; } }, metadata: _metadata }, _buildingName_initializers, _buildingName_extraInitializers);
            __esDecorate(null, null, _bookingDate_decorators, { kind: "field", name: "bookingDate", static: false, private: false, access: { has: function (obj) { return "bookingDate" in obj; }, get: function (obj) { return obj.bookingDate; }, set: function (obj, value) { obj.bookingDate = value; } }, metadata: _metadata }, _bookingDate_initializers, _bookingDate_extraInitializers);
            __esDecorate(null, null, _timeSlotIds_decorators, { kind: "field", name: "timeSlotIds", static: false, private: false, access: { has: function (obj) { return "timeSlotIds" in obj; }, get: function (obj) { return obj.timeSlotIds; }, set: function (obj, value) { obj.timeSlotIds = value; } }, metadata: _metadata }, _timeSlotIds_initializers, _timeSlotIds_extraInitializers);
            __esDecorate(null, null, _timeSlots_decorators, { kind: "field", name: "timeSlots", static: false, private: false, access: { has: function (obj) { return "timeSlots" in obj; }, get: function (obj) { return obj.timeSlots; }, set: function (obj, value) { obj.timeSlots = value; } }, metadata: _metadata }, _timeSlots_initializers, _timeSlots_extraInitializers);
            __esDecorate(null, null, _slotCount_decorators, { kind: "field", name: "slotCount", static: false, private: false, access: { has: function (obj) { return "slotCount" in obj; }, get: function (obj) { return obj.slotCount; }, set: function (obj, value) { obj.slotCount = value; } }, metadata: _metadata }, _slotCount_initializers, _slotCount_extraInitializers);
            __esDecorate(null, null, _startTime_decorators, { kind: "field", name: "startTime", static: false, private: false, access: { has: function (obj) { return "startTime" in obj; }, get: function (obj) { return obj.startTime; }, set: function (obj, value) { obj.startTime = value; } }, metadata: _metadata }, _startTime_initializers, _startTime_extraInitializers);
            __esDecorate(null, null, _endTime_decorators, { kind: "field", name: "endTime", static: false, private: false, access: { has: function (obj) { return "endTime" in obj; }, get: function (obj) { return obj.endTime; }, set: function (obj, value) { obj.endTime = value; } }, metadata: _metadata }, _endTime_initializers, _endTime_extraInitializers);
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _purpose_decorators, { kind: "field", name: "purpose", static: false, private: false, access: { has: function (obj) { return "purpose" in obj; }, get: function (obj) { return obj.purpose; }, set: function (obj, value) { obj.purpose = value; } }, metadata: _metadata }, _purpose_initializers, _purpose_extraInitializers);
            __esDecorate(null, null, _attendeeCount_decorators, { kind: "field", name: "attendeeCount", static: false, private: false, access: { has: function (obj) { return "attendeeCount" in obj; }, get: function (obj) { return obj.attendeeCount; }, set: function (obj, value) { obj.attendeeCount = value; } }, metadata: _metadata }, _attendeeCount_initializers, _attendeeCount_extraInitializers);
            __esDecorate(null, null, _contactName_decorators, { kind: "field", name: "contactName", static: false, private: false, access: { has: function (obj) { return "contactName" in obj; }, get: function (obj) { return obj.contactName; }, set: function (obj, value) { obj.contactName = value; } }, metadata: _metadata }, _contactName_initializers, _contactName_extraInitializers);
            __esDecorate(null, null, _contactPhone_decorators, { kind: "field", name: "contactPhone", static: false, private: false, access: { has: function (obj) { return "contactPhone" in obj; }, get: function (obj) { return obj.contactPhone; }, set: function (obj, value) { obj.contactPhone = value; } }, metadata: _metadata }, _contactPhone_initializers, _contactPhone_extraInitializers);
            __esDecorate(null, null, _departmentName_decorators, { kind: "field", name: "departmentName", static: false, private: false, access: { has: function (obj) { return "departmentName" in obj; }, get: function (obj) { return obj.departmentName; }, set: function (obj, value) { obj.departmentName = value; } }, metadata: _metadata }, _departmentName_initializers, _departmentName_extraInitializers);
            __esDecorate(null, null, _notes_decorators, { kind: "field", name: "notes", static: false, private: false, access: { has: function (obj) { return "notes" in obj; }, get: function (obj) { return obj.notes; }, set: function (obj, value) { obj.notes = value; } }, metadata: _metadata }, _notes_initializers, _notes_extraInitializers);
            __esDecorate(null, null, _approvedAt_decorators, { kind: "field", name: "approvedAt", static: false, private: false, access: { has: function (obj) { return "approvedAt" in obj; }, get: function (obj) { return obj.approvedAt; }, set: function (obj, value) { obj.approvedAt = value; } }, metadata: _metadata }, _approvedAt_initializers, _approvedAt_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.RoomBookingResponseDto = RoomBookingResponseDto;
