"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var class_validator_1 = require("class-validator");
var change_password_dto_1 = require("./change-password.dto");
var password_reset_confirm_dto_1 = require("./password-reset-confirm.dto");
var password_reset_request_dto_1 = require("./password-reset-request.dto");
var password_reset_verify_dto_1 = require("./password-reset-verify.dto");
var register_dto_1 = require("./register.dto");
var registration_otp_resend_dto_1 = require("./registration-otp-resend.dto");
var registration_otp_verify_dto_1 = require("./registration-otp-verify.dto");
describe('Auth validation DTOs', function () {
    it('returns Vietnamese messages for invalid register payloads', function () { return __awaiter(void 0, void 0, void 0, function () {
        var dto, errors, messages;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dto = new register_dto_1.RegisterDto();
                    dto.email = 'student';
                    dto.password = 'short';
                    dto.studentId = '123';
                    dto.firstName = '';
                    dto.lastName = '';
                    return [4 /*yield*/, (0, class_validator_1.validate)(dto)];
                case 1:
                    errors = _a.sent();
                    messages = errors.flatMap(function (error) { var _a; return Object.values((_a = error.constraints) !== null && _a !== void 0 ? _a : {}); });
                    expect(messages).toContain('Email không đúng định dạng.');
                    expect(messages).toContain('Mật khẩu phải có ít nhất 8 ký tự.');
                    expect(messages).toContain('Mã số sinh viên phải gồm đúng 8 chữ số.');
                    expect(messages).toContain('Vui lòng nhập tên.');
                    expect(messages).toContain('Vui lòng nhập họ.');
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects non-UIT email domains for registration and password reset', function () { return __awaiter(void 0, void 0, void 0, function () {
        var registerDto, resetDto, _a, registerErrors, resetErrors;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    registerDto = new register_dto_1.RegisterDto();
                    registerDto.email = 'student@example.com';
                    registerDto.password = 'Password123';
                    registerDto.studentId = '22520001';
                    registerDto.firstName = 'An';
                    registerDto.lastName = 'Nguyen';
                    resetDto = new password_reset_request_dto_1.PasswordResetRequestDto();
                    resetDto.email = 'student@example.com';
                    return [4 /*yield*/, Promise.all([
                            (0, class_validator_1.validate)(registerDto),
                            (0, class_validator_1.validate)(resetDto),
                        ])];
                case 1:
                    _a = _b.sent(), registerErrors = _a[0], resetErrors = _a[1];
                    expect(registerErrors.flatMap(function (error) { var _a; return Object.values((_a = error.constraints) !== null && _a !== void 0 ? _a : {}); })).toContain('Email cần thuộc miền UIT.');
                    expect(resetErrors.flatMap(function (error) { var _a; return Object.values((_a = error.constraints) !== null && _a !== void 0 ? _a : {}); })).toContain('Email cần thuộc miền UIT.');
                    return [2 /*return*/];
            }
        });
    }); });
    it('validates registration verification and resend payloads', function () { return __awaiter(void 0, void 0, void 0, function () {
        var verifyDto, resendDto, _a, verifyErrors, resendErrors, verifyMessages, resendMessages;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    verifyDto = new registration_otp_verify_dto_1.RegistrationOtpVerifyDto();
                    verifyDto.challengeId = 'invalid';
                    verifyDto.otp = '12';
                    resendDto = new registration_otp_resend_dto_1.RegistrationOtpResendDto();
                    resendDto.challengeId = 'invalid';
                    return [4 /*yield*/, Promise.all([
                            (0, class_validator_1.validate)(verifyDto),
                            (0, class_validator_1.validate)(resendDto),
                        ])];
                case 1:
                    _a = _b.sent(), verifyErrors = _a[0], resendErrors = _a[1];
                    verifyMessages = verifyErrors.flatMap(function (error) { var _a; return Object.values((_a = error.constraints) !== null && _a !== void 0 ? _a : {}); });
                    resendMessages = resendErrors.flatMap(function (error) { var _a; return Object.values((_a = error.constraints) !== null && _a !== void 0 ? _a : {}); });
                    expect(verifyMessages).toContain('Mã xác thực đăng ký không hợp lệ.');
                    expect(verifyMessages).toContain('OTP phải gồm đúng 6 chữ số.');
                    expect(resendMessages).toContain('Mã xác thực đăng ký không hợp lệ.');
                    return [2 /*return*/];
            }
        });
    }); });
    it('returns Vietnamese messages for password reset request validation', function () { return __awaiter(void 0, void 0, void 0, function () {
        var dto, errors, messages;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dto = new password_reset_request_dto_1.PasswordResetRequestDto();
                    dto.email = 'student';
                    return [4 /*yield*/, (0, class_validator_1.validate)(dto)];
                case 1:
                    errors = _a.sent();
                    messages = errors.flatMap(function (error) { var _a; return Object.values((_a = error.constraints) !== null && _a !== void 0 ? _a : {}); });
                    expect(messages).toContain('Email không đúng định dạng.');
                    return [2 /*return*/];
            }
        });
    }); });
    it('returns Vietnamese messages for password reset verify validation', function () { return __awaiter(void 0, void 0, void 0, function () {
        var dto, errors, messages;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dto = new password_reset_verify_dto_1.PasswordResetVerifyDto();
                    dto.email = 'student';
                    dto.otp = '12';
                    return [4 /*yield*/, (0, class_validator_1.validate)(dto)];
                case 1:
                    errors = _a.sent();
                    messages = errors.flatMap(function (error) { var _a; return Object.values((_a = error.constraints) !== null && _a !== void 0 ? _a : {}); });
                    expect(messages).toContain('Email không đúng định dạng.');
                    expect(messages).toContain('OTP phải gồm đúng 6 chữ số.');
                    return [2 /*return*/];
            }
        });
    }); });
    it('returns Vietnamese messages for password reset confirm validation', function () { return __awaiter(void 0, void 0, void 0, function () {
        var dto, errors, messages;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dto = new password_reset_confirm_dto_1.PasswordResetConfirmDto();
                    dto.email = 'student';
                    dto.otp = '12';
                    dto.newPassword = 'short';
                    return [4 /*yield*/, (0, class_validator_1.validate)(dto)];
                case 1:
                    errors = _a.sent();
                    messages = errors.flatMap(function (error) { var _a; return Object.values((_a = error.constraints) !== null && _a !== void 0 ? _a : {}); });
                    expect(messages).toContain('Email không đúng định dạng.');
                    expect(messages).toContain('OTP phải gồm đúng 6 chữ số.');
                    expect(messages).toContain('Mật khẩu phải có ít nhất 8 ký tự.');
                    return [2 /*return*/];
            }
        });
    }); });
    it('returns Vietnamese messages for change password validation', function () { return __awaiter(void 0, void 0, void 0, function () {
        var dto, errors, messages;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dto = new change_password_dto_1.ChangePasswordDto();
                    dto.currentPassword = '';
                    dto.newPassword = 'short';
                    return [4 /*yield*/, (0, class_validator_1.validate)(dto)];
                case 1:
                    errors = _a.sent();
                    messages = errors.flatMap(function (error) { var _a; return Object.values((_a = error.constraints) !== null && _a !== void 0 ? _a : {}); });
                    expect(messages).toContain('Vui lòng nhập mật khẩu hiện tại.');
                    expect(messages).toContain('Mật khẩu phải có ít nhất 8 ký tự.');
                    return [2 /*return*/];
            }
        });
    }); });
});
