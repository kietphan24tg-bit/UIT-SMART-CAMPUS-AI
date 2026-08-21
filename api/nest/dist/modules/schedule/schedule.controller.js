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
exports.ScheduleController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var schedule_response_dto_1 = require("./dto/schedule-response.dto");
var ScheduleController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Schedule'), (0, common_1.Controller)('schedules'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getAllSemestersWithSchedules_decorators;
    var _getCurrentSemesterSchedule_decorators;
    var _getSemesterScheduleById_decorators;
    var ScheduleController = _classThis = /** @class */ (function () {
        function ScheduleController_1(scheduleService) {
            this.scheduleService = (__runInitializers(this, _instanceExtraInitializers), scheduleService);
        }
        ScheduleController_1.prototype.getAllSemestersWithSchedules = function (userId) {
            return this.scheduleService.getAllSemestersWithSchedules(userId);
        };
        ScheduleController_1.prototype.getCurrentSemesterSchedule = function (userId) {
            return this.scheduleService.getCurrentSemesterSchedule(userId);
        };
        ScheduleController_1.prototype.getSemesterScheduleById = function (semesterId, userId) {
            return this.scheduleService.getSemesterScheduleById(userId, semesterId);
        };
        return ScheduleController_1;
    }());
    __setFunctionName(_classThis, "ScheduleController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getAllSemestersWithSchedules_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({
                summary: 'Get all semesters with schedule sessions',
                description: 'Returns all semesters of the current user, each with its schedule sessions.',
            }), (0, swagger_1.ApiOkResponse)({
                description: 'All semesters with schedule sessions of the current user.',
                type: schedule_response_dto_1.ScheduleSemesterWithSessionsDto,
                isArray: true,
            })];
        _getCurrentSemesterSchedule_decorators = [(0, common_1.Get)('current'), (0, swagger_1.ApiOperation)({
                summary: 'Get current semester schedule',
                description: 'Returns the current semester and its schedule sessions for the current user.',
            }), (0, swagger_1.ApiOkResponse)({
                description: 'Current semester with schedule sessions.',
                type: schedule_response_dto_1.ScheduleSemesterWithSessionsDto,
            }), (0, swagger_1.ApiNotFoundResponse)({ description: 'Current semester not found.' })];
        _getSemesterScheduleById_decorators = [(0, common_1.Get)('semesters/:semesterId'), (0, swagger_1.ApiOperation)({
                summary: 'Get schedule by semester ID',
                description: 'Returns the requested semester and its schedule sessions for the current user.',
            }), (0, swagger_1.ApiParam)({
                name: 'semesterId',
                description: 'Semester ID.',
                example: 'sem-2025-2026-2',
            }), (0, swagger_1.ApiOkResponse)({
                description: 'Semester with schedule sessions.',
                type: schedule_response_dto_1.ScheduleSemesterWithSessionsDto,
            }), (0, swagger_1.ApiNotFoundResponse)({ description: 'Semester not found.' })];
        __esDecorate(_classThis, null, _getAllSemestersWithSchedules_decorators, { kind: "method", name: "getAllSemestersWithSchedules", static: false, private: false, access: { has: function (obj) { return "getAllSemestersWithSchedules" in obj; }, get: function (obj) { return obj.getAllSemestersWithSchedules; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCurrentSemesterSchedule_decorators, { kind: "method", name: "getCurrentSemesterSchedule", static: false, private: false, access: { has: function (obj) { return "getCurrentSemesterSchedule" in obj; }, get: function (obj) { return obj.getCurrentSemesterSchedule; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSemesterScheduleById_decorators, { kind: "method", name: "getSemesterScheduleById", static: false, private: false, access: { has: function (obj) { return "getSemesterScheduleById" in obj; }, get: function (obj) { return obj.getSemesterScheduleById; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ScheduleController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ScheduleController = _classThis;
}();
exports.ScheduleController = ScheduleController;
