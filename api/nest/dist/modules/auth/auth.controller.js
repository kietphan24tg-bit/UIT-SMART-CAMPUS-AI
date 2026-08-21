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
exports.AuthController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var AuthController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Auth'), (0, common_1.Controller)('auth')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _register_decorators;
    var _verifyRegistrationOtp_decorators;
    var _resendRegistrationOtp_decorators;
    var _login_decorators;
    var _refresh_decorators;
    var _changePassword_decorators;
    var _requestPasswordReset_decorators;
    var _verifyPasswordResetOtp_decorators;
    var _resetPassword_decorators;
    var _logout_decorators;
    var AuthController = _classThis = /** @class */ (function () {
        function AuthController_1(authService) {
            this.authService = (__runInitializers(this, _instanceExtraInitializers), authService);
        }
        AuthController_1.prototype.register = function (dto) {
            return this.authService.register(dto);
        };
        AuthController_1.prototype.verifyRegistrationOtp = function (dto) {
            return this.authService.verifyRegistrationOtp(dto.challengeId, dto.otp);
        };
        AuthController_1.prototype.resendRegistrationOtp = function (dto) {
            return this.authService.resendRegistrationOtp(dto.challengeId);
        };
        AuthController_1.prototype.login = function (dto) {
            return this.authService.login(dto);
        };
        AuthController_1.prototype.refresh = function (dto) {
            return this.authService.refreshToken(dto.refreshToken);
        };
        AuthController_1.prototype.changePassword = function (userId, dto) {
            return this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);
        };
        AuthController_1.prototype.requestPasswordReset = function (dto) {
            return this.authService.requestPasswordReset(dto.email);
        };
        AuthController_1.prototype.verifyPasswordResetOtp = function (dto) {
            return this.authService.verifyPasswordResetOtp(dto.email, dto.otp);
        };
        AuthController_1.prototype.resetPassword = function (dto) {
            return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
        };
        AuthController_1.prototype.logout = function (userId) {
            return this.authService.logout(userId);
        };
        return AuthController_1;
    }());
    __setFunctionName(_classThis, "AuthController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _register_decorators = [(0, common_1.Post)('register'), (0, swagger_1.ApiOperation)({ summary: 'Register a new user' })];
        _verifyRegistrationOtp_decorators = [(0, common_1.Post)('register/verify'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Verify registration OTP and create the user' })];
        _resendRegistrationOtp_decorators = [(0, common_1.Post)('register/resend'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Resend registration OTP' })];
        _login_decorators = [(0, common_1.Post)('login'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Login with email and password' })];
        _refresh_decorators = [(0, common_1.Post)('refresh'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Refresh access token' })];
        _changePassword_decorators = [(0, common_1.Post)('change-password'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Change password for authenticated user' })];
        _requestPasswordReset_decorators = [(0, common_1.Post)('password-reset/request'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Send OTP for password reset' })];
        _verifyPasswordResetOtp_decorators = [(0, common_1.Post)('password-reset/verify'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Verify OTP for password reset' })];
        _resetPassword_decorators = [(0, common_1.Post)('password-reset/reset'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Reset password with verified OTP' })];
        _logout_decorators = [(0, common_1.Post)('logout'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Logout and invalidate refresh tokens' })];
        __esDecorate(_classThis, null, _register_decorators, { kind: "method", name: "register", static: false, private: false, access: { has: function (obj) { return "register" in obj; }, get: function (obj) { return obj.register; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _verifyRegistrationOtp_decorators, { kind: "method", name: "verifyRegistrationOtp", static: false, private: false, access: { has: function (obj) { return "verifyRegistrationOtp" in obj; }, get: function (obj) { return obj.verifyRegistrationOtp; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _resendRegistrationOtp_decorators, { kind: "method", name: "resendRegistrationOtp", static: false, private: false, access: { has: function (obj) { return "resendRegistrationOtp" in obj; }, get: function (obj) { return obj.resendRegistrationOtp; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _login_decorators, { kind: "method", name: "login", static: false, private: false, access: { has: function (obj) { return "login" in obj; }, get: function (obj) { return obj.login; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _refresh_decorators, { kind: "method", name: "refresh", static: false, private: false, access: { has: function (obj) { return "refresh" in obj; }, get: function (obj) { return obj.refresh; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _changePassword_decorators, { kind: "method", name: "changePassword", static: false, private: false, access: { has: function (obj) { return "changePassword" in obj; }, get: function (obj) { return obj.changePassword; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _requestPasswordReset_decorators, { kind: "method", name: "requestPasswordReset", static: false, private: false, access: { has: function (obj) { return "requestPasswordReset" in obj; }, get: function (obj) { return obj.requestPasswordReset; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _verifyPasswordResetOtp_decorators, { kind: "method", name: "verifyPasswordResetOtp", static: false, private: false, access: { has: function (obj) { return "verifyPasswordResetOtp" in obj; }, get: function (obj) { return obj.verifyPasswordResetOtp; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _resetPassword_decorators, { kind: "method", name: "resetPassword", static: false, private: false, access: { has: function (obj) { return "resetPassword" in obj; }, get: function (obj) { return obj.resetPassword; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _logout_decorators, { kind: "method", name: "logout", static: false, private: false, access: { has: function (obj) { return "logout" in obj; }, get: function (obj) { return obj.logout; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuthController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuthController = _classThis;
}();
exports.AuthController = AuthController;
