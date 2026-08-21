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
exports.SemesterGradesDto = exports.GradeRecordDto = exports.GradesSummaryDto = exports.GradeClassSectionDto = exports.GradeCourseDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var GradeCourseDto = function () {
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
            function GradeCourseDto() {
                this.code = __runInitializers(this, _code_initializers, void 0);
                this.name = (__runInitializers(this, _code_extraInitializers), __runInitializers(this, _name_initializers, void 0));
                this.credits = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _credits_initializers, void 0));
                __runInitializers(this, _credits_extraInitializers);
            }
            return GradeCourseDto;
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
exports.GradeCourseDto = GradeCourseDto;
var GradeClassSectionDto = function () {
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
    return _a = /** @class */ (function () {
            function GradeClassSectionDto() {
                this.id = __runInitializers(this, _id_initializers, void 0);
                this.classCode = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _classCode_initializers, void 0));
                this.sectionCode = (__runInitializers(this, _classCode_extraInitializers), __runInitializers(this, _sectionCode_initializers, void 0));
                __runInitializers(this, _sectionCode_extraInitializers);
            }
            return GradeClassSectionDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [(0, swagger_1.ApiProperty)({ example: 'section-1' })];
            _classCode_decorators = [(0, swagger_1.ApiProperty)({ example: 'SE346.Q21' })];
            _sectionCode_decorators = [(0, swagger_1.ApiProperty)({ example: 'Q21' })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _classCode_decorators, { kind: "field", name: "classCode", static: false, private: false, access: { has: function (obj) { return "classCode" in obj; }, get: function (obj) { return obj.classCode; }, set: function (obj, value) { obj.classCode = value; } }, metadata: _metadata }, _classCode_initializers, _classCode_extraInitializers);
            __esDecorate(null, null, _sectionCode_decorators, { kind: "field", name: "sectionCode", static: false, private: false, access: { has: function (obj) { return "sectionCode" in obj; }, get: function (obj) { return obj.sectionCode; }, set: function (obj, value) { obj.sectionCode = value; } }, metadata: _metadata }, _sectionCode_initializers, _sectionCode_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.GradeClassSectionDto = GradeClassSectionDto;
var GradesSummaryDto = function () {
    var _a;
    var _gpa_decorators;
    var _gpa_initializers = [];
    var _gpa_extraInitializers = [];
    var _totalCredits_decorators;
    var _totalCredits_initializers = [];
    var _totalCredits_extraInitializers = [];
    var _totalEarnedCredits_decorators;
    var _totalEarnedCredits_initializers = [];
    var _totalEarnedCredits_extraInitializers = [];
    var _totalCourses_decorators;
    var _totalCourses_initializers = [];
    var _totalCourses_extraInitializers = [];
    var _totalSemesters_decorators;
    var _totalSemesters_initializers = [];
    var _totalSemesters_extraInitializers = [];
    return _a = /** @class */ (function () {
            function GradesSummaryDto() {
                this.gpa = __runInitializers(this, _gpa_initializers, void 0);
                this.totalCredits = (__runInitializers(this, _gpa_extraInitializers), __runInitializers(this, _totalCredits_initializers, void 0));
                this.totalEarnedCredits = (__runInitializers(this, _totalCredits_extraInitializers), __runInitializers(this, _totalEarnedCredits_initializers, void 0));
                this.totalCourses = (__runInitializers(this, _totalEarnedCredits_extraInitializers), __runInitializers(this, _totalCourses_initializers, void 0));
                this.totalSemesters = (__runInitializers(this, _totalCourses_extraInitializers), __runInitializers(this, _totalSemesters_initializers, void 0));
                __runInitializers(this, _totalSemesters_extraInitializers);
            }
            return GradesSummaryDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _gpa_decorators = [(0, swagger_1.ApiProperty)({ example: 8.4 })];
            _totalCredits_decorators = [(0, swagger_1.ApiProperty)({ example: 7 })];
            _totalEarnedCredits_decorators = [(0, swagger_1.ApiProperty)({ example: 11 })];
            _totalCourses_decorators = [(0, swagger_1.ApiProperty)({ example: 3 })];
            _totalSemesters_decorators = [(0, swagger_1.ApiProperty)({ example: 2 })];
            __esDecorate(null, null, _gpa_decorators, { kind: "field", name: "gpa", static: false, private: false, access: { has: function (obj) { return "gpa" in obj; }, get: function (obj) { return obj.gpa; }, set: function (obj, value) { obj.gpa = value; } }, metadata: _metadata }, _gpa_initializers, _gpa_extraInitializers);
            __esDecorate(null, null, _totalCredits_decorators, { kind: "field", name: "totalCredits", static: false, private: false, access: { has: function (obj) { return "totalCredits" in obj; }, get: function (obj) { return obj.totalCredits; }, set: function (obj, value) { obj.totalCredits = value; } }, metadata: _metadata }, _totalCredits_initializers, _totalCredits_extraInitializers);
            __esDecorate(null, null, _totalEarnedCredits_decorators, { kind: "field", name: "totalEarnedCredits", static: false, private: false, access: { has: function (obj) { return "totalEarnedCredits" in obj; }, get: function (obj) { return obj.totalEarnedCredits; }, set: function (obj, value) { obj.totalEarnedCredits = value; } }, metadata: _metadata }, _totalEarnedCredits_initializers, _totalEarnedCredits_extraInitializers);
            __esDecorate(null, null, _totalCourses_decorators, { kind: "field", name: "totalCourses", static: false, private: false, access: { has: function (obj) { return "totalCourses" in obj; }, get: function (obj) { return obj.totalCourses; }, set: function (obj, value) { obj.totalCourses = value; } }, metadata: _metadata }, _totalCourses_initializers, _totalCourses_extraInitializers);
            __esDecorate(null, null, _totalSemesters_decorators, { kind: "field", name: "totalSemesters", static: false, private: false, access: { has: function (obj) { return "totalSemesters" in obj; }, get: function (obj) { return obj.totalSemesters; }, set: function (obj, value) { obj.totalSemesters = value; } }, metadata: _metadata }, _totalSemesters_initializers, _totalSemesters_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.GradesSummaryDto = GradesSummaryDto;
var GradeRecordDto = function () {
    var _a;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _midterm_decorators;
    var _midterm_initializers = [];
    var _midterm_extraInitializers = [];
    var _finalExam_decorators;
    var _finalExam_initializers = [];
    var _finalExam_extraInitializers = [];
    var _assignment_decorators;
    var _assignment_initializers = [];
    var _assignment_extraInitializers = [];
    var _totalScore_decorators;
    var _totalScore_initializers = [];
    var _totalScore_extraInitializers = [];
    var _letterGrade_decorators;
    var _letterGrade_initializers = [];
    var _letterGrade_extraInitializers = [];
    var _gradePoint_decorators;
    var _gradePoint_initializers = [];
    var _gradePoint_extraInitializers = [];
    var _isExempt_decorators;
    var _isExempt_initializers = [];
    var _isExempt_extraInitializers = [];
    var _earnedCredits_decorators;
    var _earnedCredits_initializers = [];
    var _earnedCredits_extraInitializers = [];
    var _course_decorators;
    var _course_initializers = [];
    var _course_extraInitializers = [];
    var _classSection_decorators;
    var _classSection_initializers = [];
    var _classSection_extraInitializers = [];
    return _a = /** @class */ (function () {
            function GradeRecordDto() {
                this.id = __runInitializers(this, _id_initializers, void 0);
                this.midterm = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _midterm_initializers, void 0));
                this.finalExam = (__runInitializers(this, _midterm_extraInitializers), __runInitializers(this, _finalExam_initializers, void 0));
                this.assignment = (__runInitializers(this, _finalExam_extraInitializers), __runInitializers(this, _assignment_initializers, void 0));
                this.totalScore = (__runInitializers(this, _assignment_extraInitializers), __runInitializers(this, _totalScore_initializers, void 0));
                this.letterGrade = (__runInitializers(this, _totalScore_extraInitializers), __runInitializers(this, _letterGrade_initializers, void 0));
                this.gradePoint = (__runInitializers(this, _letterGrade_extraInitializers), __runInitializers(this, _gradePoint_initializers, void 0));
                this.isExempt = (__runInitializers(this, _gradePoint_extraInitializers), __runInitializers(this, _isExempt_initializers, void 0));
                this.earnedCredits = (__runInitializers(this, _isExempt_extraInitializers), __runInitializers(this, _earnedCredits_initializers, void 0));
                this.course = (__runInitializers(this, _earnedCredits_extraInitializers), __runInitializers(this, _course_initializers, void 0));
                this.classSection = (__runInitializers(this, _course_extraInitializers), __runInitializers(this, _classSection_initializers, void 0));
                __runInitializers(this, _classSection_extraInitializers);
            }
            return GradeRecordDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [(0, swagger_1.ApiProperty)({ example: 'grade-1' })];
            _midterm_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 8, nullable: true })];
            _finalExam_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 7, nullable: true })];
            _assignment_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 9, nullable: true })];
            _totalScore_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 7.8, nullable: true })];
            _letterGrade_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'B+', nullable: true })];
            _gradePoint_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 7.8, nullable: true })];
            _isExempt_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: false })];
            _earnedCredits_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 4, nullable: true })];
            _course_decorators = [(0, swagger_1.ApiProperty)({ type: function () { return GradeCourseDto; } })];
            _classSection_decorators = [(0, swagger_1.ApiPropertyOptional)({ type: function () { return GradeClassSectionDto; } })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _midterm_decorators, { kind: "field", name: "midterm", static: false, private: false, access: { has: function (obj) { return "midterm" in obj; }, get: function (obj) { return obj.midterm; }, set: function (obj, value) { obj.midterm = value; } }, metadata: _metadata }, _midterm_initializers, _midterm_extraInitializers);
            __esDecorate(null, null, _finalExam_decorators, { kind: "field", name: "finalExam", static: false, private: false, access: { has: function (obj) { return "finalExam" in obj; }, get: function (obj) { return obj.finalExam; }, set: function (obj, value) { obj.finalExam = value; } }, metadata: _metadata }, _finalExam_initializers, _finalExam_extraInitializers);
            __esDecorate(null, null, _assignment_decorators, { kind: "field", name: "assignment", static: false, private: false, access: { has: function (obj) { return "assignment" in obj; }, get: function (obj) { return obj.assignment; }, set: function (obj, value) { obj.assignment = value; } }, metadata: _metadata }, _assignment_initializers, _assignment_extraInitializers);
            __esDecorate(null, null, _totalScore_decorators, { kind: "field", name: "totalScore", static: false, private: false, access: { has: function (obj) { return "totalScore" in obj; }, get: function (obj) { return obj.totalScore; }, set: function (obj, value) { obj.totalScore = value; } }, metadata: _metadata }, _totalScore_initializers, _totalScore_extraInitializers);
            __esDecorate(null, null, _letterGrade_decorators, { kind: "field", name: "letterGrade", static: false, private: false, access: { has: function (obj) { return "letterGrade" in obj; }, get: function (obj) { return obj.letterGrade; }, set: function (obj, value) { obj.letterGrade = value; } }, metadata: _metadata }, _letterGrade_initializers, _letterGrade_extraInitializers);
            __esDecorate(null, null, _gradePoint_decorators, { kind: "field", name: "gradePoint", static: false, private: false, access: { has: function (obj) { return "gradePoint" in obj; }, get: function (obj) { return obj.gradePoint; }, set: function (obj, value) { obj.gradePoint = value; } }, metadata: _metadata }, _gradePoint_initializers, _gradePoint_extraInitializers);
            __esDecorate(null, null, _isExempt_decorators, { kind: "field", name: "isExempt", static: false, private: false, access: { has: function (obj) { return "isExempt" in obj; }, get: function (obj) { return obj.isExempt; }, set: function (obj, value) { obj.isExempt = value; } }, metadata: _metadata }, _isExempt_initializers, _isExempt_extraInitializers);
            __esDecorate(null, null, _earnedCredits_decorators, { kind: "field", name: "earnedCredits", static: false, private: false, access: { has: function (obj) { return "earnedCredits" in obj; }, get: function (obj) { return obj.earnedCredits; }, set: function (obj, value) { obj.earnedCredits = value; } }, metadata: _metadata }, _earnedCredits_initializers, _earnedCredits_extraInitializers);
            __esDecorate(null, null, _course_decorators, { kind: "field", name: "course", static: false, private: false, access: { has: function (obj) { return "course" in obj; }, get: function (obj) { return obj.course; }, set: function (obj, value) { obj.course = value; } }, metadata: _metadata }, _course_initializers, _course_extraInitializers);
            __esDecorate(null, null, _classSection_decorators, { kind: "field", name: "classSection", static: false, private: false, access: { has: function (obj) { return "classSection" in obj; }, get: function (obj) { return obj.classSection; }, set: function (obj, value) { obj.classSection = value; } }, metadata: _metadata }, _classSection_initializers, _classSection_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.GradeRecordDto = GradeRecordDto;
var SemesterGradesDto = function () {
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
    var _summary_decorators;
    var _summary_initializers = [];
    var _summary_extraInitializers = [];
    var _grades_decorators;
    var _grades_initializers = [];
    var _grades_extraInitializers = [];
    return _a = /** @class */ (function () {
            function SemesterGradesDto() {
                this.id = __runInitializers(this, _id_initializers, void 0);
                this.name = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _name_initializers, void 0));
                this.academicYear = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _academicYear_initializers, void 0));
                this.term = (__runInitializers(this, _academicYear_extraInitializers), __runInitializers(this, _term_initializers, void 0));
                this.startDate = (__runInitializers(this, _term_extraInitializers), __runInitializers(this, _startDate_initializers, void 0));
                this.endDate = (__runInitializers(this, _startDate_extraInitializers), __runInitializers(this, _endDate_initializers, void 0));
                this.isCurrent = (__runInitializers(this, _endDate_extraInitializers), __runInitializers(this, _isCurrent_initializers, void 0));
                this.summary = (__runInitializers(this, _isCurrent_extraInitializers), __runInitializers(this, _summary_initializers, void 0));
                this.grades = (__runInitializers(this, _summary_extraInitializers), __runInitializers(this, _grades_initializers, void 0));
                __runInitializers(this, _grades_extraInitializers);
            }
            return SemesterGradesDto;
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
            _summary_decorators = [(0, swagger_1.ApiProperty)({ type: function () { return GradesSummaryDto; } })];
            _grades_decorators = [(0, swagger_1.ApiProperty)({ type: function () { return [GradeRecordDto]; } })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _academicYear_decorators, { kind: "field", name: "academicYear", static: false, private: false, access: { has: function (obj) { return "academicYear" in obj; }, get: function (obj) { return obj.academicYear; }, set: function (obj, value) { obj.academicYear = value; } }, metadata: _metadata }, _academicYear_initializers, _academicYear_extraInitializers);
            __esDecorate(null, null, _term_decorators, { kind: "field", name: "term", static: false, private: false, access: { has: function (obj) { return "term" in obj; }, get: function (obj) { return obj.term; }, set: function (obj, value) { obj.term = value; } }, metadata: _metadata }, _term_initializers, _term_extraInitializers);
            __esDecorate(null, null, _startDate_decorators, { kind: "field", name: "startDate", static: false, private: false, access: { has: function (obj) { return "startDate" in obj; }, get: function (obj) { return obj.startDate; }, set: function (obj, value) { obj.startDate = value; } }, metadata: _metadata }, _startDate_initializers, _startDate_extraInitializers);
            __esDecorate(null, null, _endDate_decorators, { kind: "field", name: "endDate", static: false, private: false, access: { has: function (obj) { return "endDate" in obj; }, get: function (obj) { return obj.endDate; }, set: function (obj, value) { obj.endDate = value; } }, metadata: _metadata }, _endDate_initializers, _endDate_extraInitializers);
            __esDecorate(null, null, _isCurrent_decorators, { kind: "field", name: "isCurrent", static: false, private: false, access: { has: function (obj) { return "isCurrent" in obj; }, get: function (obj) { return obj.isCurrent; }, set: function (obj, value) { obj.isCurrent = value; } }, metadata: _metadata }, _isCurrent_initializers, _isCurrent_extraInitializers);
            __esDecorate(null, null, _summary_decorators, { kind: "field", name: "summary", static: false, private: false, access: { has: function (obj) { return "summary" in obj; }, get: function (obj) { return obj.summary; }, set: function (obj, value) { obj.summary = value; } }, metadata: _metadata }, _summary_initializers, _summary_extraInitializers);
            __esDecorate(null, null, _grades_decorators, { kind: "field", name: "grades", static: false, private: false, access: { has: function (obj) { return "grades" in obj; }, get: function (obj) { return obj.grades; }, set: function (obj, value) { obj.grades = value; } }, metadata: _metadata }, _grades_initializers, _grades_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.SemesterGradesDto = SemesterGradesDto;
