"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradesController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var shared_1 = require("@smart-campus/shared");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var roles_guard_1 = require("../../common/guards/roles.guard");
var grades_response_dto_1 = require("./dto/grades-response.dto");
var GradesController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Grades'), (0, common_1.Controller)('grades'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getAllSemesterGrades_decorators;
    var _getGradesSummary_decorators;
    var _getCurrentSemesterGrades_decorators;
    var _getSemesterGradesById_decorators;
    var _getLecturerClassSections_decorators;
    var _getClassSectionGradeSheet_decorators;
    var _updateClassSectionGradeWeights_decorators;
    var _upsertClassSectionGradeSheet_decorators;
    var GradesController = _classThis = /** @class */ (function () {
        function GradesController_1(gradesService) {
            this.gradesService = (__runInitializers(this, _instanceExtraInitializers), gradesService);
        }
        GradesController_1.prototype.getAllSemesterGrades = function (userId) {
            return this.gradesService.getAllSemesterGrades(userId);
        };
        GradesController_1.prototype.getGradesSummary = function (userId) {
            return this.gradesService.getGradesSummary(userId);
        };
        GradesController_1.prototype.getCurrentSemesterGrades = function (userId) {
            return this.gradesService.getCurrentSemesterGrades(userId);
        };
        GradesController_1.prototype.getSemesterGradesById = function (userId, semesterId) {
            return this.gradesService.getSemesterGradesById(userId, semesterId);
        };
        GradesController_1.prototype.getLecturerClassSections = function (actorId, actorRole) {
            return this.gradesService.getLecturerClassSections(actorId, actorRole);
        };
        GradesController_1.prototype.getClassSectionGradeSheet = function (classSectionId, actorId, actorRole) {
            return this.gradesService.getClassSectionGradeSheet(classSectionId, actorId, actorRole);
        };
        GradesController_1.prototype.updateClassSectionGradeWeights = function (classSectionId, actorId, actorRole, dto) {
            return this.gradesService.updateClassSectionGradeWeights(classSectionId, actorId, actorRole, dto);
        };
        GradesController_1.prototype.upsertClassSectionGradeSheet = function (classSectionId, actorId, actorRole, dto) {
            return this.gradesService.upsertClassSectionGradeSheet(classSectionId, actorId, actorRole, dto);
        };
        return GradesController_1;
    }());
    __setFunctionName(_classThis, "GradesController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getAllSemesterGrades_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({
                summary: 'Get all semester grades',
                description: 'Returns all semesters of the current user with semester summaries and grade records.',
            }), (0, swagger_1.ApiOkResponse)({
                description: 'All semester grades of the current user.',
                type: grades_response_dto_1.SemesterGradesDto,
                isArray: true,
            })];
        _getGradesSummary_decorators = [(0, common_1.Get)('summary'), (0, swagger_1.ApiOperation)({
                summary: 'Get cumulative grades summary',
                description: 'Returns the cumulative grades summary across all semesters of the current user.',
            }), (0, swagger_1.ApiOkResponse)({
                description: 'Cumulative grades summary of the current user.',
                type: grades_response_dto_1.GradesSummaryDto,
            })];
        _getCurrentSemesterGrades_decorators = [(0, common_1.Get)('current'), (0, swagger_1.ApiOperation)({
                summary: 'Get current semester grades',
                description: 'Returns the current semester grades of the current user. If no semester is marked as current, it falls back to the newest semester available for that user.',
            }), (0, swagger_1.ApiOkResponse)({
                description: 'Current semester grades of the current user.',
                type: grades_response_dto_1.SemesterGradesDto,
            })];
        _getSemesterGradesById_decorators = [(0, common_1.Get)('semesters/:semesterId'), (0, swagger_1.ApiOperation)({
                summary: 'Get grades by semester ID',
                description: 'Returns the grade records for the requested semester of the current user.',
            }), (0, swagger_1.ApiParam)({
                name: 'semesterId',
                description: 'Semester ID.',
                example: 'sem-2025-2026-2',
            }), (0, swagger_1.ApiOkResponse)({
                description: 'Semester grades of the current user.',
                type: grades_response_dto_1.SemesterGradesDto,
            }), (0, swagger_1.ApiNotFoundResponse)({ description: 'Semester grades not found.' })];
        _getLecturerClassSections_decorators = [(0, common_1.Get)('lecturer/class-sections'), (0, common_1.UseGuards)(roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiOperation)({ summary: 'Get grade-entry class sections manageable by current role' })];
        _getClassSectionGradeSheet_decorators = [(0, common_1.Get)('class-sections/:id/sheet'), (0, common_1.UseGuards)(roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiParam)({ name: 'id', description: 'Class section id' }), (0, swagger_1.ApiOperation)({ summary: 'Get grade sheet for a class section' })];
        _updateClassSectionGradeWeights_decorators = [(0, common_1.Put)('class-sections/:id/weights'), (0, common_1.UseGuards)(roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiParam)({ name: 'id', description: 'Class section id' }), (0, swagger_1.ApiOperation)({ summary: 'Update grade weights for a class section' })];
        _upsertClassSectionGradeSheet_decorators = [(0, common_1.Put)('class-sections/:id/sheet'), (0, common_1.UseGuards)(roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiParam)({ name: 'id', description: 'Class section id' }), (0, swagger_1.ApiOperation)({ summary: 'Bulk upsert grade sheet for a class section' })];
        __esDecorate(_classThis, null, _getAllSemesterGrades_decorators, { kind: "method", name: "getAllSemesterGrades", static: false, private: false, access: { has: function (obj) { return "getAllSemesterGrades" in obj; }, get: function (obj) { return obj.getAllSemesterGrades; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getGradesSummary_decorators, { kind: "method", name: "getGradesSummary", static: false, private: false, access: { has: function (obj) { return "getGradesSummary" in obj; }, get: function (obj) { return obj.getGradesSummary; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCurrentSemesterGrades_decorators, { kind: "method", name: "getCurrentSemesterGrades", static: false, private: false, access: { has: function (obj) { return "getCurrentSemesterGrades" in obj; }, get: function (obj) { return obj.getCurrentSemesterGrades; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSemesterGradesById_decorators, { kind: "method", name: "getSemesterGradesById", static: false, private: false, access: { has: function (obj) { return "getSemesterGradesById" in obj; }, get: function (obj) { return obj.getSemesterGradesById; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getLecturerClassSections_decorators, { kind: "method", name: "getLecturerClassSections", static: false, private: false, access: { has: function (obj) { return "getLecturerClassSections" in obj; }, get: function (obj) { return obj.getLecturerClassSections; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getClassSectionGradeSheet_decorators, { kind: "method", name: "getClassSectionGradeSheet", static: false, private: false, access: { has: function (obj) { return "getClassSectionGradeSheet" in obj; }, get: function (obj) { return obj.getClassSectionGradeSheet; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateClassSectionGradeWeights_decorators, { kind: "method", name: "updateClassSectionGradeWeights", static: false, private: false, access: { has: function (obj) { return "updateClassSectionGradeWeights" in obj; }, get: function (obj) { return obj.updateClassSectionGradeWeights; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _upsertClassSectionGradeSheet_decorators, { kind: "method", name: "upsertClassSectionGradeSheet", static: false, private: false, access: { has: function (obj) { return "upsertClassSectionGradeSheet" in obj; }, get: function (obj) { return obj.upsertClassSectionGradeSheet; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        GradesController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return GradesController = _classThis;
}();
exports.GradesController = GradesController;
