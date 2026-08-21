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
exports.RegistrationsController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var client_1 = require("@prisma/client");
var shared_1 = require("@smart-campus/shared");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var roles_guard_1 = require("../../common/guards/roles.guard");
var RegistrationsController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Registrations'), (0, common_1.Controller)('registrations'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.STUDENT), (0, swagger_1.ApiBearerAuth)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getAvailableClassSections_decorators;
    var _getMyRegistrations_decorators;
    var _register_decorators;
    var _drop_decorators;
    var RegistrationsController = _classThis = /** @class */ (function () {
        function RegistrationsController_1(registrationsService) {
            this.registrationsService = (__runInitializers(this, _instanceExtraInitializers), registrationsService);
        }
        RegistrationsController_1.prototype.getAvailableClassSections = function (studentId) {
            return this.registrationsService.getAvailableClassSections(studentId);
        };
        RegistrationsController_1.prototype.getMyRegistrations = function (studentId, status) {
            return this.registrationsService.getMyRegistrations(studentId, status);
        };
        RegistrationsController_1.prototype.register = function (studentId, dto) {
            return this.registrationsService.register(studentId, dto.classSectionId);
        };
        RegistrationsController_1.prototype.drop = function (studentId, enrollmentId) {
            return this.registrationsService.drop(studentId, enrollmentId);
        };
        return RegistrationsController_1;
    }());
    __setFunctionName(_classThis, "RegistrationsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getAvailableClassSections_decorators = [(0, common_1.Get)('available-class-sections'), (0, swagger_1.ApiOperation)({ summary: 'Get available class sections for registration' })];
        _getMyRegistrations_decorators = [(0, common_1.Get)('me'), (0, swagger_1.ApiOperation)({ summary: 'Get current student registrations' }), (0, swagger_1.ApiQuery)({
                name: 'status',
                required: false,
                enum: client_1.EnrollmentStatus,
            })];
        _register_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiOperation)({ summary: 'Register for a class section' })];
        _drop_decorators = [(0, common_1.Patch)(':id/drop'), (0, swagger_1.ApiOperation)({ summary: 'Drop a registration' }), (0, swagger_1.ApiParam)({ name: 'id', description: 'Enrollment id' })];
        __esDecorate(_classThis, null, _getAvailableClassSections_decorators, { kind: "method", name: "getAvailableClassSections", static: false, private: false, access: { has: function (obj) { return "getAvailableClassSections" in obj; }, get: function (obj) { return obj.getAvailableClassSections; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMyRegistrations_decorators, { kind: "method", name: "getMyRegistrations", static: false, private: false, access: { has: function (obj) { return "getMyRegistrations" in obj; }, get: function (obj) { return obj.getMyRegistrations; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _register_decorators, { kind: "method", name: "register", static: false, private: false, access: { has: function (obj) { return "register" in obj; }, get: function (obj) { return obj.register; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _drop_decorators, { kind: "method", name: "drop", static: false, private: false, access: { has: function (obj) { return "drop" in obj; }, get: function (obj) { return obj.drop; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RegistrationsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RegistrationsController = _classThis;
}();
exports.RegistrationsController = RegistrationsController;
