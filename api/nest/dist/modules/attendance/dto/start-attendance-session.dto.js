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
exports.StartAttendanceSessionDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var StartAttendanceSessionDto = function () {
    var _a;
    var _classSectionId_decorators;
    var _classSectionId_initializers = [];
    var _classSectionId_extraInitializers = [];
    var _durationMinutes_decorators;
    var _durationMinutes_initializers = [];
    var _durationMinutes_extraInitializers = [];
    return _a = /** @class */ (function () {
            function StartAttendanceSessionDto() {
                this.classSectionId = __runInitializers(this, _classSectionId_initializers, void 0);
                this.durationMinutes = (__runInitializers(this, _classSectionId_extraInitializers), __runInitializers(this, _durationMinutes_initializers, void 0));
                __runInitializers(this, _durationMinutes_extraInitializers);
            }
            return StartAttendanceSessionDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _classSectionId_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Class section id to start attendance for',
                    example: 'class-section-123',
                }), (0, class_validator_1.IsString)()];
            _durationMinutes_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'Session duration in minutes',
                    example: 10,
                    default: 10,
                    minimum: 1,
                    maximum: 120,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(120)];
            __esDecorate(null, null, _classSectionId_decorators, { kind: "field", name: "classSectionId", static: false, private: false, access: { has: function (obj) { return "classSectionId" in obj; }, get: function (obj) { return obj.classSectionId; }, set: function (obj, value) { obj.classSectionId = value; } }, metadata: _metadata }, _classSectionId_initializers, _classSectionId_extraInitializers);
            __esDecorate(null, null, _durationMinutes_decorators, { kind: "field", name: "durationMinutes", static: false, private: false, access: { has: function (obj) { return "durationMinutes" in obj; }, get: function (obj) { return obj.durationMinutes; }, set: function (obj, value) { obj.durationMinutes = value; } }, metadata: _metadata }, _durationMinutes_initializers, _durationMinutes_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.StartAttendanceSessionDto = StartAttendanceSessionDto;
