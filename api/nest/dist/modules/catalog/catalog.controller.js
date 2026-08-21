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
exports.CatalogController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var shared_1 = require("@smart-campus/shared");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var roles_guard_1 = require("../../common/guards/roles.guard");
var CatalogController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Catalog'), (0, common_1.Controller)('catalog'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _listSemesters_decorators;
    var _listCourses_decorators;
    var _listLecturers_decorators;
    var _listClassSections_decorators;
    var _createCourse_decorators;
    var _createClassSection_decorators;
    var _updateClassSection_decorators;
    var _replaceClassMeetings_decorators;
    var CatalogController = _classThis = /** @class */ (function () {
        function CatalogController_1(catalogService) {
            this.catalogService = (__runInitializers(this, _instanceExtraInitializers), catalogService);
        }
        CatalogController_1.prototype.listSemesters = function () {
            return this.catalogService.listSemesters();
        };
        CatalogController_1.prototype.listCourses = function () {
            return this.catalogService.listCourses();
        };
        CatalogController_1.prototype.listLecturers = function () {
            return this.catalogService.listLecturers();
        };
        CatalogController_1.prototype.listClassSections = function (semesterId) {
            return this.catalogService.listClassSections(semesterId);
        };
        CatalogController_1.prototype.createCourse = function (dto) {
            return this.catalogService.createCourse(dto);
        };
        CatalogController_1.prototype.createClassSection = function (dto) {
            return this.catalogService.createClassSection(dto);
        };
        CatalogController_1.prototype.updateClassSection = function (sectionId, dto) {
            return this.catalogService.updateClassSection(sectionId, dto);
        };
        CatalogController_1.prototype.replaceClassMeetings = function (sectionId, dto) {
            return this.catalogService.replaceClassMeetings(sectionId, dto);
        };
        return CatalogController_1;
    }());
    __setFunctionName(_classThis, "CatalogController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _listSemesters_decorators = [(0, common_1.Get)('semesters'), (0, swagger_1.ApiOperation)({ summary: 'List semesters for catalog management' })];
        _listCourses_decorators = [(0, common_1.Get)('courses'), (0, swagger_1.ApiOperation)({ summary: 'List courses for catalog management' })];
        _listLecturers_decorators = [(0, common_1.Get)('lecturers'), (0, swagger_1.ApiOperation)({ summary: 'List active lecturers' })];
        _listClassSections_decorators = [(0, common_1.Get)('class-sections'), (0, swagger_1.ApiOperation)({ summary: 'List class sections' }), (0, swagger_1.ApiQuery)({ name: 'semesterId', required: false, type: String })];
        _createCourse_decorators = [(0, common_1.Post)('courses'), (0, swagger_1.ApiOperation)({ summary: 'Create or update a course' })];
        _createClassSection_decorators = [(0, common_1.Post)('class-sections'), (0, swagger_1.ApiOperation)({ summary: 'Create a class section' })];
        _updateClassSection_decorators = [(0, common_1.Patch)('class-sections/:id'), (0, swagger_1.ApiOperation)({ summary: 'Update class section metadata' }), (0, swagger_1.ApiParam)({ name: 'id', description: 'Class section id' })];
        _replaceClassMeetings_decorators = [(0, common_1.Patch)('class-sections/:id/meetings'), (0, swagger_1.ApiOperation)({ summary: 'Replace class section meetings' }), (0, swagger_1.ApiParam)({ name: 'id', description: 'Class section id' })];
        __esDecorate(_classThis, null, _listSemesters_decorators, { kind: "method", name: "listSemesters", static: false, private: false, access: { has: function (obj) { return "listSemesters" in obj; }, get: function (obj) { return obj.listSemesters; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _listCourses_decorators, { kind: "method", name: "listCourses", static: false, private: false, access: { has: function (obj) { return "listCourses" in obj; }, get: function (obj) { return obj.listCourses; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _listLecturers_decorators, { kind: "method", name: "listLecturers", static: false, private: false, access: { has: function (obj) { return "listLecturers" in obj; }, get: function (obj) { return obj.listLecturers; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _listClassSections_decorators, { kind: "method", name: "listClassSections", static: false, private: false, access: { has: function (obj) { return "listClassSections" in obj; }, get: function (obj) { return obj.listClassSections; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createCourse_decorators, { kind: "method", name: "createCourse", static: false, private: false, access: { has: function (obj) { return "createCourse" in obj; }, get: function (obj) { return obj.createCourse; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createClassSection_decorators, { kind: "method", name: "createClassSection", static: false, private: false, access: { has: function (obj) { return "createClassSection" in obj; }, get: function (obj) { return obj.createClassSection; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateClassSection_decorators, { kind: "method", name: "updateClassSection", static: false, private: false, access: { has: function (obj) { return "updateClassSection" in obj; }, get: function (obj) { return obj.updateClassSection; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _replaceClassMeetings_decorators, { kind: "method", name: "replaceClassMeetings", static: false, private: false, access: { has: function (obj) { return "replaceClassMeetings" in obj; }, get: function (obj) { return obj.replaceClassMeetings; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CatalogController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CatalogController = _classThis;
}();
exports.CatalogController = CatalogController;
