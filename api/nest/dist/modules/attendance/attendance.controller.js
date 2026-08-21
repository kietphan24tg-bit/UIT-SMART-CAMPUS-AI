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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var shared_1 = require("@smart-campus/shared");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var roles_guard_1 = require("../../common/guards/roles.guard");
var AttendanceController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Attendance'), (0, common_1.Controller)('attendance')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _startSession_decorators;
    var _stopSession_decorators;
    var _issueQrToken_decorators;
    var _checkin_decorators;
    var _getSessionRecords_decorators;
    var _exportSessionAttendance_decorators;
    var _exportClassSectionAttendanceSummary_decorators;
    var _getHistory_decorators;
    var _getLecturerClassSections_decorators;
    var _getClassSectionStudents_decorators;
    var _getClassSectionSessionSummary_decorators;
    var _getStudentHistory_decorators;
    var AttendanceController = _classThis = /** @class */ (function () {
        function AttendanceController_1(attendanceService) {
            this.attendanceService = (__runInitializers(this, _instanceExtraInitializers), attendanceService);
        }
        AttendanceController_1.prototype.startSession = function (actorId, actorRole, dto) {
            return this.attendanceService.startSession(actorId, actorRole, dto);
        };
        AttendanceController_1.prototype.stopSession = function (sessionId, actorId, actorRole) {
            return this.attendanceService.stopSession(sessionId, actorId, actorRole);
        };
        AttendanceController_1.prototype.issueQrToken = function (sessionId, displayKey) {
            return this.attendanceService.issueQrToken(sessionId, displayKey);
        };
        AttendanceController_1.prototype.checkin = function (studentId, dto) {
            return this.attendanceService.checkin(studentId, dto);
        };
        AttendanceController_1.prototype.getSessionRecords = function (sessionId, actorId, actorRole, query) {
            return this.attendanceService.getSessionRecords(sessionId, actorId, actorRole, query);
        };
        AttendanceController_1.prototype.exportSessionAttendance = function (sessionId, actorId, actorRole, response) {
            return __awaiter(this, void 0, void 0, function () {
                var exported;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.attendanceService.exportSessionAttendance(sessionId, actorId, actorRole)];
                        case 1:
                            exported = _a.sent();
                            response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                            response.setHeader('Content-Disposition', "attachment; filename=\"".concat(exported.fileName, "\""));
                            response.send(exported.buffer);
                            return [2 /*return*/];
                    }
                });
            });
        };
        AttendanceController_1.prototype.exportClassSectionAttendanceSummary = function (classSectionId, actorId, actorRole, response) {
            return __awaiter(this, void 0, void 0, function () {
                var exported;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.attendanceService.exportClassSectionAttendanceSummary(classSectionId, actorId, actorRole)];
                        case 1:
                            exported = _a.sent();
                            response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                            response.setHeader('Content-Disposition', "attachment; filename=\"".concat(exported.fileName, "\""));
                            response.send(exported.buffer);
                            return [2 /*return*/];
                    }
                });
            });
        };
        AttendanceController_1.prototype.getHistory = function (actorId, actorRole, query) {
            return this.attendanceService.getHistory(actorId, actorRole, query);
        };
        AttendanceController_1.prototype.getLecturerClassSections = function (actorId, actorRole) {
            return this.attendanceService.getLecturerClassSections(actorId, actorRole);
        };
        AttendanceController_1.prototype.getClassSectionStudents = function (classSectionId, actorId, actorRole) {
            return this.attendanceService.getClassSectionStudents(classSectionId, actorId, actorRole);
        };
        AttendanceController_1.prototype.getClassSectionSessionSummary = function (classSectionId, actorId, actorRole) {
            return this.attendanceService.getClassSectionSessionSummary(classSectionId, actorId, actorRole);
        };
        AttendanceController_1.prototype.getStudentHistory = function (studentId, query) {
            return this.attendanceService.getStudentHistory(studentId, query);
        };
        return AttendanceController_1;
    }());
    __setFunctionName(_classThis, "AttendanceController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _startSession_decorators = [(0, common_1.Post)('session/start'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Start an attendance session' })];
        _stopSession_decorators = [(0, common_1.Post)('session/:id/stop'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiParam)({ name: 'id', description: 'Attendance session id' }), (0, swagger_1.ApiOperation)({ summary: 'Stop an attendance session early' })];
        _issueQrToken_decorators = [(0, common_1.Get)('session/:id/qr-token'), (0, swagger_1.ApiParam)({ name: 'id', description: 'Attendance session id' }), (0, swagger_1.ApiQuery)({ name: 'displayKey', required: true, description: 'Projector display key from start session response' }), (0, swagger_1.ApiOperation)({ summary: 'Issue a dynamic attendance QR token' })];
        _checkin_decorators = [(0, common_1.Post)('checkin'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.STUDENT), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Check in attendance using dynamic token' })];
        _getSessionRecords_decorators = [(0, common_1.Get)('session/:id/records'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiParam)({ name: 'id', description: 'Attendance session id' }), (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }), (0, swagger_1.ApiOperation)({ summary: 'Get attendance records for a session' })];
        _exportSessionAttendance_decorators = [(0, common_1.Get)('session/:id/export'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiParam)({ name: 'id', description: 'Attendance session id' }), (0, swagger_1.ApiOperation)({ summary: 'Export attendance session roster to Excel' })];
        _exportClassSectionAttendanceSummary_decorators = [(0, common_1.Get)('class-sections/:id/export'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiParam)({ name: 'id', description: 'Class section id' }), (0, swagger_1.ApiOperation)({ summary: 'Export attendance summary by class section to Excel' })];
        _getHistory_decorators = [(0, common_1.Get)('history'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiQuery)({ name: 'classSectionId', required: true, type: String }), (0, swagger_1.ApiQuery)({ name: 'date', required: false, type: String }), (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }), (0, swagger_1.ApiOperation)({ summary: 'Get attendance session history by class/date for current manager role' })];
        _getLecturerClassSections_decorators = [(0, common_1.Get)('lecturer/class-sections'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Get class sections manageable by current role' })];
        _getClassSectionStudents_decorators = [(0, common_1.Get)('class-sections/:id/students'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiParam)({ name: 'id', description: 'Class section id' }), (0, swagger_1.ApiOperation)({ summary: 'Get enrolled students for a class section' })];
        _getClassSectionSessionSummary_decorators = [(0, common_1.Get)('class-sections/:id/session-summary'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiParam)({ name: 'id', description: 'Class section id' }), (0, swagger_1.ApiOperation)({ summary: 'Get attendance session summary for a class section' })];
        _getStudentHistory_decorators = [(0, common_1.Get)('me/history'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.STUDENT), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }), (0, swagger_1.ApiOperation)({ summary: 'Get attendance check-in history of current student' })];
        __esDecorate(_classThis, null, _startSession_decorators, { kind: "method", name: "startSession", static: false, private: false, access: { has: function (obj) { return "startSession" in obj; }, get: function (obj) { return obj.startSession; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _stopSession_decorators, { kind: "method", name: "stopSession", static: false, private: false, access: { has: function (obj) { return "stopSession" in obj; }, get: function (obj) { return obj.stopSession; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _issueQrToken_decorators, { kind: "method", name: "issueQrToken", static: false, private: false, access: { has: function (obj) { return "issueQrToken" in obj; }, get: function (obj) { return obj.issueQrToken; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _checkin_decorators, { kind: "method", name: "checkin", static: false, private: false, access: { has: function (obj) { return "checkin" in obj; }, get: function (obj) { return obj.checkin; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSessionRecords_decorators, { kind: "method", name: "getSessionRecords", static: false, private: false, access: { has: function (obj) { return "getSessionRecords" in obj; }, get: function (obj) { return obj.getSessionRecords; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _exportSessionAttendance_decorators, { kind: "method", name: "exportSessionAttendance", static: false, private: false, access: { has: function (obj) { return "exportSessionAttendance" in obj; }, get: function (obj) { return obj.exportSessionAttendance; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _exportClassSectionAttendanceSummary_decorators, { kind: "method", name: "exportClassSectionAttendanceSummary", static: false, private: false, access: { has: function (obj) { return "exportClassSectionAttendanceSummary" in obj; }, get: function (obj) { return obj.exportClassSectionAttendanceSummary; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getHistory_decorators, { kind: "method", name: "getHistory", static: false, private: false, access: { has: function (obj) { return "getHistory" in obj; }, get: function (obj) { return obj.getHistory; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getLecturerClassSections_decorators, { kind: "method", name: "getLecturerClassSections", static: false, private: false, access: { has: function (obj) { return "getLecturerClassSections" in obj; }, get: function (obj) { return obj.getLecturerClassSections; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getClassSectionStudents_decorators, { kind: "method", name: "getClassSectionStudents", static: false, private: false, access: { has: function (obj) { return "getClassSectionStudents" in obj; }, get: function (obj) { return obj.getClassSectionStudents; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getClassSectionSessionSummary_decorators, { kind: "method", name: "getClassSectionSessionSummary", static: false, private: false, access: { has: function (obj) { return "getClassSectionSessionSummary" in obj; }, get: function (obj) { return obj.getClassSectionSessionSummary; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getStudentHistory_decorators, { kind: "method", name: "getStudentHistory", static: false, private: false, access: { has: function (obj) { return "getStudentHistory" in obj; }, get: function (obj) { return obj.getStudentHistory; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AttendanceController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AttendanceController = _classThis;
}();
exports.AttendanceController = AttendanceController;
