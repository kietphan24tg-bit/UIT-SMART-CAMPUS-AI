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
exports.ScheduleSemesterWithSessionsDto = exports.ScheduleSessionDto = exports.ScheduleCourseDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var ScheduleCourseDto = function () {
    var _a;
    var _code_decorators;
    var _code_initializers = [];
    var _code_extraInitializers = [];
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _credits_decorators;
    var _credits_initializers = [];
    var _credits_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ScheduleCourseDto() {
                this.code = __runInitializers(this, _code_initializers, void 0);
                this.name = (__runInitializers(this, _code_extraInitializers), __runInitializers(this, _name_initializers, void 0));
                this.credits = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _credits_initializers, void 0));
                __runInitializers(this, _credits_extraInitializers);
            }
            return ScheduleCourseDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _code_decorators = [(0, swagger_1.ApiProperty)({ example: 'SE346' })];
            _name_decorators = [(0, swagger_1.ApiProperty)({ example: 'Internet of Things' })];
            _credits_decorators = [(0, swagger_1.ApiProperty)({ example: 4 })];
            __esDecorate(null, null, _code_decorators, { kind: "field", name: "code", static: false, private: false, access: { has: function (obj) { return "code" in obj; }, get: function (obj) { return obj.code; }, set: function (obj, value) { obj.code = value; } }, metadata: _metadata }, _code_initializers, _code_extraInitializers);
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _credits_decorators, { kind: "field", name: "credits", static: false, private: false, access: { has: function (obj) { return "credits" in obj; }, get: function (obj) { return obj.credits; }, set: function (obj, value) { obj.credits = value; } }, metadata: _metadata }, _credits_initializers, _credits_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ScheduleCourseDto = ScheduleCourseDto;
var ScheduleSessionDto = function () {
    var _a;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _classCode_decorators;
    var _classCode_initializers = [];
    var _classCode_extraInitializers = [];
    var _sectionCode_decorators;
    var _sectionCode_initializers = [];
    var _sectionCode_extraInitializers = [];
    var _note_decorators;
    var _note_initializers = [];
    var _note_extraInitializers = [];
    var _instructor_decorators;
    var _instructor_initializers = [];
    var _instructor_extraInitializers = [];
    var _room_decorators;
    var _room_initializers = [];
    var _room_extraInitializers = [];
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
    var _sessionType_decorators;
    var _sessionType_initializers = [];
    var _sessionType_extraInitializers = [];
    var _startDate_decorators;
    var _startDate_initializers = [];
    var _startDate_extraInitializers = [];
    var _endDate_decorators;
    var _endDate_initializers = [];
    var _endDate_extraInitializers = [];
    var _course_decorators;
    var _course_initializers = [];
    var _course_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ScheduleSessionDto() {
                this.id = __runInitializers(this, _id_initializers, void 0);
                this.classCode = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _classCode_initializers, void 0));
                this.sectionCode = (__runInitializers(this, _classCode_extraInitializers), __runInitializers(this, _sectionCode_initializers, void 0));
                this.note = (__runInitializers(this, _sectionCode_extraInitializers), __runInitializers(this, _note_initializers, void 0));
                this.instructor = (__runInitializers(this, _note_extraInitializers), __runInitializers(this, _instructor_initializers, void 0));
                this.room = (__runInitializers(this, _instructor_extraInitializers), __runInitializers(this, _room_initializers, void 0));
                this.dayOfWeek = (__runInitializers(this, _room_extraInitializers), __runInitializers(this, _dayOfWeek_initializers, void 0));
                this.startTime = (__runInitializers(this, _dayOfWeek_extraInitializers), __runInitializers(this, _startTime_initializers, void 0));
                this.endTime = (__runInitializers(this, _startTime_extraInitializers), __runInitializers(this, _endTime_initializers, void 0));
                this.startPeriod = (__runInitializers(this, _endTime_extraInitializers), __runInitializers(this, _startPeriod_initializers, void 0));
                this.endPeriod = (__runInitializers(this, _startPeriod_extraInitializers), __runInitializers(this, _endPeriod_initializers, void 0));
                this.sessionType = (__runInitializers(this, _endPeriod_extraInitializers), __runInitializers(this, _sessionType_initializers, void 0));
                this.startDate = (__runInitializers(this, _sessionType_extraInitializers), __runInitializers(this, _startDate_initializers, void 0));
                this.endDate = (__runInitializers(this, _startDate_extraInitializers), __runInitializers(this, _endDate_initializers, void 0));
                this.course = (__runInitializers(this, _endDate_extraInitializers), __runInitializers(this, _course_initializers, void 0));
                __runInitializers(this, _course_extraInitializers);
            }
            return ScheduleSessionDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [(0, swagger_1.ApiProperty)({ example: 'schedule-item-1' })];
            _classCode_decorators = [(0, swagger_1.ApiProperty)({ example: 'SE346.Q22' })];
            _sectionCode_decorators = [(0, swagger_1.ApiProperty)({ example: 'Q22' })];
            _note_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Hoc tai phong lab IoT' })];
            _instructor_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Nguyen Van A', nullable: true })];
            _room_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'E3.1', nullable: true })];
            _dayOfWeek_decorators = [(0, swagger_1.ApiProperty)({ example: 2, description: '2 = Monday, 8 = Sunday' })];
            _startTime_decorators = [(0, swagger_1.ApiProperty)({ example: '07:30' })];
            _endTime_decorators = [(0, swagger_1.ApiProperty)({ example: '09:30' })];
            _startPeriod_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 1, nullable: true })];
            _endPeriod_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 3, nullable: true })];
            _sessionType_decorators = [(0, swagger_1.ApiProperty)({ enum: ['daytime', 'evening'], example: 'daytime' })];
            _startDate_decorators = [(0, swagger_1.ApiProperty)({ example: '2025-01-06T00:00:00.000Z' })];
            _endDate_decorators = [(0, swagger_1.ApiProperty)({ example: '2025-05-30T00:00:00.000Z' })];
            _course_decorators = [(0, swagger_1.ApiProperty)({ type: function () { return ScheduleCourseDto; } })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _classCode_decorators, { kind: "field", name: "classCode", static: false, private: false, access: { has: function (obj) { return "classCode" in obj; }, get: function (obj) { return obj.classCode; }, set: function (obj, value) { obj.classCode = value; } }, metadata: _metadata }, _classCode_initializers, _classCode_extraInitializers);
            __esDecorate(null, null, _sectionCode_decorators, { kind: "field", name: "sectionCode", static: false, private: false, access: { has: function (obj) { return "sectionCode" in obj; }, get: function (obj) { return obj.sectionCode; }, set: function (obj, value) { obj.sectionCode = value; } }, metadata: _metadata }, _sectionCode_initializers, _sectionCode_extraInitializers);
            __esDecorate(null, null, _note_decorators, { kind: "field", name: "note", static: false, private: false, access: { has: function (obj) { return "note" in obj; }, get: function (obj) { return obj.note; }, set: function (obj, value) { obj.note = value; } }, metadata: _metadata }, _note_initializers, _note_extraInitializers);
            __esDecorate(null, null, _instructor_decorators, { kind: "field", name: "instructor", static: false, private: false, access: { has: function (obj) { return "instructor" in obj; }, get: function (obj) { return obj.instructor; }, set: function (obj, value) { obj.instructor = value; } }, metadata: _metadata }, _instructor_initializers, _instructor_extraInitializers);
            __esDecorate(null, null, _room_decorators, { kind: "field", name: "room", static: false, private: false, access: { has: function (obj) { return "room" in obj; }, get: function (obj) { return obj.room; }, set: function (obj, value) { obj.room = value; } }, metadata: _metadata }, _room_initializers, _room_extraInitializers);
            __esDecorate(null, null, _dayOfWeek_decorators, { kind: "field", name: "dayOfWeek", static: false, private: false, access: { has: function (obj) { return "dayOfWeek" in obj; }, get: function (obj) { return obj.dayOfWeek; }, set: function (obj, value) { obj.dayOfWeek = value; } }, metadata: _metadata }, _dayOfWeek_initializers, _dayOfWeek_extraInitializers);
            __esDecorate(null, null, _startTime_decorators, { kind: "field", name: "startTime", static: false, private: false, access: { has: function (obj) { return "startTime" in obj; }, get: function (obj) { return obj.startTime; }, set: function (obj, value) { obj.startTime = value; } }, metadata: _metadata }, _startTime_initializers, _startTime_extraInitializers);
            __esDecorate(null, null, _endTime_decorators, { kind: "field", name: "endTime", static: false, private: false, access: { has: function (obj) { return "endTime" in obj; }, get: function (obj) { return obj.endTime; }, set: function (obj, value) { obj.endTime = value; } }, metadata: _metadata }, _endTime_initializers, _endTime_extraInitializers);
            __esDecorate(null, null, _startPeriod_decorators, { kind: "field", name: "startPeriod", static: false, private: false, access: { has: function (obj) { return "startPeriod" in obj; }, get: function (obj) { return obj.startPeriod; }, set: function (obj, value) { obj.startPeriod = value; } }, metadata: _metadata }, _startPeriod_initializers, _startPeriod_extraInitializers);
            __esDecorate(null, null, _endPeriod_decorators, { kind: "field", name: "endPeriod", static: false, private: false, access: { has: function (obj) { return "endPeriod" in obj; }, get: function (obj) { return obj.endPeriod; }, set: function (obj, value) { obj.endPeriod = value; } }, metadata: _metadata }, _endPeriod_initializers, _endPeriod_extraInitializers);
            __esDecorate(null, null, _sessionType_decorators, { kind: "field", name: "sessionType", static: false, private: false, access: { has: function (obj) { return "sessionType" in obj; }, get: function (obj) { return obj.sessionType; }, set: function (obj, value) { obj.sessionType = value; } }, metadata: _metadata }, _sessionType_initializers, _sessionType_extraInitializers);
            __esDecorate(null, null, _startDate_decorators, { kind: "field", name: "startDate", static: false, private: false, access: { has: function (obj) { return "startDate" in obj; }, get: function (obj) { return obj.startDate; }, set: function (obj, value) { obj.startDate = value; } }, metadata: _metadata }, _startDate_initializers, _startDate_extraInitializers);
            __esDecorate(null, null, _endDate_decorators, { kind: "field", name: "endDate", static: false, private: false, access: { has: function (obj) { return "endDate" in obj; }, get: function (obj) { return obj.endDate; }, set: function (obj, value) { obj.endDate = value; } }, metadata: _metadata }, _endDate_initializers, _endDate_extraInitializers);
            __esDecorate(null, null, _course_decorators, { kind: "field", name: "course", static: false, private: false, access: { has: function (obj) { return "course" in obj; }, get: function (obj) { return obj.course; }, set: function (obj, value) { obj.course = value; } }, metadata: _metadata }, _course_initializers, _course_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ScheduleSessionDto = ScheduleSessionDto;
var ScheduleSemesterWithSessionsDto = function () {
    var _a;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _academicYear_decorators;
    var _academicYear_initializers = [];
    var _academicYear_extraInitializers = [];
    var _term_decorators;
    var _term_initializers = [];
    var _term_extraInitializers = [];
    var _startDate_decorators;
    var _startDate_initializers = [];
    var _startDate_extraInitializers = [];
    var _endDate_decorators;
    var _endDate_initializers = [];
    var _endDate_extraInitializers = [];
    var _isCurrent_decorators;
    var _isCurrent_initializers = [];
    var _isCurrent_extraInitializers = [];
    var _sessions_decorators;
    var _sessions_initializers = [];
    var _sessions_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ScheduleSemesterWithSessionsDto() {
                this.id = __runInitializers(this, _id_initializers, void 0);
                this.name = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _name_initializers, void 0));
                this.academicYear = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _academicYear_initializers, void 0));
                this.term = (__runInitializers(this, _academicYear_extraInitializers), __runInitializers(this, _term_initializers, void 0));
                this.startDate = (__runInitializers(this, _term_extraInitializers), __runInitializers(this, _startDate_initializers, void 0));
                this.endDate = (__runInitializers(this, _startDate_extraInitializers), __runInitializers(this, _endDate_initializers, void 0));
                this.isCurrent = (__runInitializers(this, _endDate_extraInitializers), __runInitializers(this, _isCurrent_initializers, void 0));
                this.sessions = (__runInitializers(this, _isCurrent_extraInitializers), __runInitializers(this, _sessions_initializers, void 0));
                __runInitializers(this, _sessions_extraInitializers);
            }
            return ScheduleSemesterWithSessionsDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [(0, swagger_1.ApiProperty)({ example: 'sem-2025-2026-2' })];
            _name_decorators = [(0, swagger_1.ApiProperty)({ example: 'HK2 2025-2026' })];
            _academicYear_decorators = [(0, swagger_1.ApiProperty)({ example: '2025-2026' })];
            _term_decorators = [(0, swagger_1.ApiProperty)({ example: 2 })];
            _startDate_decorators = [(0, swagger_1.ApiProperty)({ example: '2026-01-05T00:00:00.000Z' })];
            _endDate_decorators = [(0, swagger_1.ApiProperty)({ example: '2026-05-31T23:59:59.000Z' })];
            _isCurrent_decorators = [(0, swagger_1.ApiProperty)({ example: true })];
            _sessions_decorators = [(0, swagger_1.ApiProperty)({ type: function () { return ScheduleSessionDto; }, isArray: true })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _academicYear_decorators, { kind: "field", name: "academicYear", static: false, private: false, access: { has: function (obj) { return "academicYear" in obj; }, get: function (obj) { return obj.academicYear; }, set: function (obj, value) { obj.academicYear = value; } }, metadata: _metadata }, _academicYear_initializers, _academicYear_extraInitializers);
            __esDecorate(null, null, _term_decorators, { kind: "field", name: "term", static: false, private: false, access: { has: function (obj) { return "term" in obj; }, get: function (obj) { return obj.term; }, set: function (obj, value) { obj.term = value; } }, metadata: _metadata }, _term_initializers, _term_extraInitializers);
            __esDecorate(null, null, _startDate_decorators, { kind: "field", name: "startDate", static: false, private: false, access: { has: function (obj) { return "startDate" in obj; }, get: function (obj) { return obj.startDate; }, set: function (obj, value) { obj.startDate = value; } }, metadata: _metadata }, _startDate_initializers, _startDate_extraInitializers);
            __esDecorate(null, null, _endDate_decorators, { kind: "field", name: "endDate", static: false, private: false, access: { has: function (obj) { return "endDate" in obj; }, get: function (obj) { return obj.endDate; }, set: function (obj, value) { obj.endDate = value; } }, metadata: _metadata }, _endDate_initializers, _endDate_extraInitializers);
            __esDecorate(null, null, _isCurrent_decorators, { kind: "field", name: "isCurrent", static: false, private: false, access: { has: function (obj) { return "isCurrent" in obj; }, get: function (obj) { return obj.isCurrent; }, set: function (obj, value) { obj.isCurrent = value; } }, metadata: _metadata }, _isCurrent_initializers, _isCurrent_extraInitializers);
            __esDecorate(null, null, _sessions_decorators, { kind: "field", name: "sessions", static: false, private: false, access: { has: function (obj) { return "sessions" in obj; }, get: function (obj) { return obj.sessions; }, set: function (obj, value) { obj.sessions = value; } }, metadata: _metadata }, _sessions_initializers, _sessions_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ScheduleSemesterWithSessionsDto = ScheduleSemesterWithSessionsDto;
