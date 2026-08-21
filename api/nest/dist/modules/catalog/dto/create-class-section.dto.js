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
exports.CreateClassSectionDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_transformer_1 = require("class-transformer");
var class_validator_1 = require("class-validator");
var CreateClassSectionDto = function () {
    var _a;
    var _semesterId_decorators;
    var _semesterId_initializers = [];
    var _semesterId_extraInitializers = [];
    var _courseCode_decorators;
    var _courseCode_initializers = [];
    var _courseCode_extraInitializers = [];
    var _classCode_decorators;
    var _classCode_initializers = [];
    var _classCode_extraInitializers = [];
    var _sectionCode_decorators;
    var _sectionCode_initializers = [];
    var _sectionCode_extraInitializers = [];
    var _note_decorators;
    var _note_initializers = [];
    var _note_extraInitializers = [];
    var _lecturerId_decorators;
    var _lecturerId_initializers = [];
    var _lecturerId_extraInitializers = [];
    var _capacity_decorators;
    var _capacity_initializers = [];
    var _capacity_extraInitializers = [];
    var _registrationOpen_decorators;
    var _registrationOpen_initializers = [];
    var _registrationOpen_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateClassSectionDto() {
                this.semesterId = __runInitializers(this, _semesterId_initializers, void 0);
                this.courseCode = (__runInitializers(this, _semesterId_extraInitializers), __runInitializers(this, _courseCode_initializers, void 0));
                this.classCode = (__runInitializers(this, _courseCode_extraInitializers), __runInitializers(this, _classCode_initializers, void 0));
                this.sectionCode = (__runInitializers(this, _classCode_extraInitializers), __runInitializers(this, _sectionCode_initializers, void 0));
                this.note = (__runInitializers(this, _sectionCode_extraInitializers), __runInitializers(this, _note_initializers, void 0));
                this.lecturerId = (__runInitializers(this, _note_extraInitializers), __runInitializers(this, _lecturerId_initializers, void 0));
                this.capacity = (__runInitializers(this, _lecturerId_extraInitializers), __runInitializers(this, _capacity_initializers, void 0));
                this.registrationOpen = (__runInitializers(this, _capacity_extraInitializers), __runInitializers(this, _registrationOpen_initializers, void 0));
                __runInitializers(this, _registrationOpen_extraInitializers);
            }
            return CreateClassSectionDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _semesterId_decorators = [(0, swagger_1.ApiProperty)({ example: 'sem-2025-2026-2' }), (0, class_validator_1.IsString)()];
            _courseCode_decorators = [(0, swagger_1.ApiProperty)({ example: 'SE346' }), (0, class_validator_1.IsString)()];
            _classCode_decorators = [(0, swagger_1.ApiProperty)({ example: 'SE346.Q22' }), (0, class_validator_1.IsString)()];
            _sectionCode_decorators = [(0, swagger_1.ApiProperty)({ example: 'Q22' }), (0, class_validator_1.IsString)()];
            _note_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Lop do an IoT' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _lecturerId_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'lecturer-user-id' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _capacity_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 60, default: 60 }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1)];
            _registrationOpen_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: true, default: true }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            __esDecorate(null, null, _semesterId_decorators, { kind: "field", name: "semesterId", static: false, private: false, access: { has: function (obj) { return "semesterId" in obj; }, get: function (obj) { return obj.semesterId; }, set: function (obj, value) { obj.semesterId = value; } }, metadata: _metadata }, _semesterId_initializers, _semesterId_extraInitializers);
            __esDecorate(null, null, _courseCode_decorators, { kind: "field", name: "courseCode", static: false, private: false, access: { has: function (obj) { return "courseCode" in obj; }, get: function (obj) { return obj.courseCode; }, set: function (obj, value) { obj.courseCode = value; } }, metadata: _metadata }, _courseCode_initializers, _courseCode_extraInitializers);
            __esDecorate(null, null, _classCode_decorators, { kind: "field", name: "classCode", static: false, private: false, access: { has: function (obj) { return "classCode" in obj; }, get: function (obj) { return obj.classCode; }, set: function (obj, value) { obj.classCode = value; } }, metadata: _metadata }, _classCode_initializers, _classCode_extraInitializers);
            __esDecorate(null, null, _sectionCode_decorators, { kind: "field", name: "sectionCode", static: false, private: false, access: { has: function (obj) { return "sectionCode" in obj; }, get: function (obj) { return obj.sectionCode; }, set: function (obj, value) { obj.sectionCode = value; } }, metadata: _metadata }, _sectionCode_initializers, _sectionCode_extraInitializers);
            __esDecorate(null, null, _note_decorators, { kind: "field", name: "note", static: false, private: false, access: { has: function (obj) { return "note" in obj; }, get: function (obj) { return obj.note; }, set: function (obj, value) { obj.note = value; } }, metadata: _metadata }, _note_initializers, _note_extraInitializers);
            __esDecorate(null, null, _lecturerId_decorators, { kind: "field", name: "lecturerId", static: false, private: false, access: { has: function (obj) { return "lecturerId" in obj; }, get: function (obj) { return obj.lecturerId; }, set: function (obj, value) { obj.lecturerId = value; } }, metadata: _metadata }, _lecturerId_initializers, _lecturerId_extraInitializers);
            __esDecorate(null, null, _capacity_decorators, { kind: "field", name: "capacity", static: false, private: false, access: { has: function (obj) { return "capacity" in obj; }, get: function (obj) { return obj.capacity; }, set: function (obj, value) { obj.capacity = value; } }, metadata: _metadata }, _capacity_initializers, _capacity_extraInitializers);
            __esDecorate(null, null, _registrationOpen_decorators, { kind: "field", name: "registrationOpen", static: false, private: false, access: { has: function (obj) { return "registrationOpen" in obj; }, get: function (obj) { return obj.registrationOpen; }, set: function (obj, value) { obj.registrationOpen = value; } }, metadata: _metadata }, _registrationOpen_initializers, _registrationOpen_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateClassSectionDto = CreateClassSectionDto;
