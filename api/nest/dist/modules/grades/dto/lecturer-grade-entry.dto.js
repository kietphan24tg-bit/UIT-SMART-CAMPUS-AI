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
exports.UpsertGradeSheetDto = exports.UpsertGradeSheetRowDto = exports.UpdateGradeWeightsDto = void 0;
var class_transformer_1 = require("class-transformer");
var class_validator_1 = require("class-validator");
var UpdateGradeWeightsDto = function () {
    var _a;
    var _processWeight_decorators;
    var _processWeight_initializers = [];
    var _processWeight_extraInitializers = [];
    var _practiceWeight_decorators;
    var _practiceWeight_initializers = [];
    var _practiceWeight_extraInitializers = [];
    var _midtermWeight_decorators;
    var _midtermWeight_initializers = [];
    var _midtermWeight_extraInitializers = [];
    var _finalWeight_decorators;
    var _finalWeight_initializers = [];
    var _finalWeight_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpdateGradeWeightsDto() {
                this.processWeight = __runInitializers(this, _processWeight_initializers, void 0);
                this.practiceWeight = (__runInitializers(this, _processWeight_extraInitializers), __runInitializers(this, _practiceWeight_initializers, void 0));
                this.midtermWeight = (__runInitializers(this, _practiceWeight_extraInitializers), __runInitializers(this, _midtermWeight_initializers, void 0));
                this.finalWeight = (__runInitializers(this, _midtermWeight_extraInitializers), __runInitializers(this, _finalWeight_initializers, void 0));
                __runInitializers(this, _finalWeight_extraInitializers);
            }
            return UpdateGradeWeightsDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _processWeight_decorators = [(0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(100)];
            _practiceWeight_decorators = [(0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(100)];
            _midtermWeight_decorators = [(0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(100)];
            _finalWeight_decorators = [(0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(100)];
            __esDecorate(null, null, _processWeight_decorators, { kind: "field", name: "processWeight", static: false, private: false, access: { has: function (obj) { return "processWeight" in obj; }, get: function (obj) { return obj.processWeight; }, set: function (obj, value) { obj.processWeight = value; } }, metadata: _metadata }, _processWeight_initializers, _processWeight_extraInitializers);
            __esDecorate(null, null, _practiceWeight_decorators, { kind: "field", name: "practiceWeight", static: false, private: false, access: { has: function (obj) { return "practiceWeight" in obj; }, get: function (obj) { return obj.practiceWeight; }, set: function (obj, value) { obj.practiceWeight = value; } }, metadata: _metadata }, _practiceWeight_initializers, _practiceWeight_extraInitializers);
            __esDecorate(null, null, _midtermWeight_decorators, { kind: "field", name: "midtermWeight", static: false, private: false, access: { has: function (obj) { return "midtermWeight" in obj; }, get: function (obj) { return obj.midtermWeight; }, set: function (obj, value) { obj.midtermWeight = value; } }, metadata: _metadata }, _midtermWeight_initializers, _midtermWeight_extraInitializers);
            __esDecorate(null, null, _finalWeight_decorators, { kind: "field", name: "finalWeight", static: false, private: false, access: { has: function (obj) { return "finalWeight" in obj; }, get: function (obj) { return obj.finalWeight; }, set: function (obj, value) { obj.finalWeight = value; } }, metadata: _metadata }, _finalWeight_initializers, _finalWeight_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateGradeWeightsDto = UpdateGradeWeightsDto;
var UpsertGradeSheetRowDto = function () {
    var _a;
    var _studentId_decorators;
    var _studentId_initializers = [];
    var _studentId_extraInitializers = [];
    var _processScore_decorators;
    var _processScore_initializers = [];
    var _processScore_extraInitializers = [];
    var _practiceScore_decorators;
    var _practiceScore_initializers = [];
    var _practiceScore_extraInitializers = [];
    var _midtermScore_decorators;
    var _midtermScore_initializers = [];
    var _midtermScore_extraInitializers = [];
    var _finalScore_decorators;
    var _finalScore_initializers = [];
    var _finalScore_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpsertGradeSheetRowDto() {
                this.studentId = __runInitializers(this, _studentId_initializers, void 0);
                this.processScore = (__runInitializers(this, _studentId_extraInitializers), __runInitializers(this, _processScore_initializers, void 0));
                this.practiceScore = (__runInitializers(this, _processScore_extraInitializers), __runInitializers(this, _practiceScore_initializers, void 0));
                this.midtermScore = (__runInitializers(this, _practiceScore_extraInitializers), __runInitializers(this, _midtermScore_initializers, void 0));
                this.finalScore = (__runInitializers(this, _midtermScore_extraInitializers), __runInitializers(this, _finalScore_initializers, void 0));
                __runInitializers(this, _finalScore_extraInitializers);
            }
            return UpsertGradeSheetRowDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _studentId_decorators = [(0, class_validator_1.IsString)()];
            _processScore_decorators = [(0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(10)];
            _practiceScore_decorators = [(0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(10)];
            _midtermScore_decorators = [(0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(10)];
            _finalScore_decorators = [(0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(10)];
            __esDecorate(null, null, _studentId_decorators, { kind: "field", name: "studentId", static: false, private: false, access: { has: function (obj) { return "studentId" in obj; }, get: function (obj) { return obj.studentId; }, set: function (obj, value) { obj.studentId = value; } }, metadata: _metadata }, _studentId_initializers, _studentId_extraInitializers);
            __esDecorate(null, null, _processScore_decorators, { kind: "field", name: "processScore", static: false, private: false, access: { has: function (obj) { return "processScore" in obj; }, get: function (obj) { return obj.processScore; }, set: function (obj, value) { obj.processScore = value; } }, metadata: _metadata }, _processScore_initializers, _processScore_extraInitializers);
            __esDecorate(null, null, _practiceScore_decorators, { kind: "field", name: "practiceScore", static: false, private: false, access: { has: function (obj) { return "practiceScore" in obj; }, get: function (obj) { return obj.practiceScore; }, set: function (obj, value) { obj.practiceScore = value; } }, metadata: _metadata }, _practiceScore_initializers, _practiceScore_extraInitializers);
            __esDecorate(null, null, _midtermScore_decorators, { kind: "field", name: "midtermScore", static: false, private: false, access: { has: function (obj) { return "midtermScore" in obj; }, get: function (obj) { return obj.midtermScore; }, set: function (obj, value) { obj.midtermScore = value; } }, metadata: _metadata }, _midtermScore_initializers, _midtermScore_extraInitializers);
            __esDecorate(null, null, _finalScore_decorators, { kind: "field", name: "finalScore", static: false, private: false, access: { has: function (obj) { return "finalScore" in obj; }, get: function (obj) { return obj.finalScore; }, set: function (obj, value) { obj.finalScore = value; } }, metadata: _metadata }, _finalScore_initializers, _finalScore_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpsertGradeSheetRowDto = UpsertGradeSheetRowDto;
var UpsertGradeSheetDto = function () {
    var _a;
    var _rows_decorators;
    var _rows_initializers = [];
    var _rows_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpsertGradeSheetDto() {
                this.rows = __runInitializers(this, _rows_initializers, void 0);
                __runInitializers(this, _rows_extraInitializers);
            }
            return UpsertGradeSheetDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _rows_decorators = [(0, class_validator_1.IsArray)(), (0, class_validator_1.ArrayNotEmpty)(), (0, class_validator_1.ArrayMaxSize)(300), (0, class_validator_1.ValidateNested)({ each: true }), (0, class_transformer_1.Type)(function () { return UpsertGradeSheetRowDto; })];
            __esDecorate(null, null, _rows_decorators, { kind: "field", name: "rows", static: false, private: false, access: { has: function (obj) { return "rows" in obj; }, get: function (obj) { return obj.rows; }, set: function (obj, value) { obj.rows = value; } }, metadata: _metadata }, _rows_initializers, _rows_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpsertGradeSheetDto = UpsertGradeSheetDto;
