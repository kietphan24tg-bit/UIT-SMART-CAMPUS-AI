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
var testing_1 = require("@nestjs/testing");
var auth_controller_1 = require("./auth.controller");
var auth_service_1 = require("./auth.service");
describe('AuthController', function () {
    var controller;
    var authService;
    var mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
    };
    var registrationChallenge = {
        challengeId: '9e0df78c-d9e1-43ff-ad1e-3788f07309c6',
        maskedEmail: 'te***@uit.edu.vn',
        expiresInSeconds: 600,
        resendAvailableInSeconds: 60,
        delivery: 'preview',
        previewCode: '123456',
    };
    var passwordResetChallenge = {
        maskedEmail: 'st***@gm.uit.edu.vn',
        expiresInSeconds: 600,
        delivery: 'preview',
        previewCode: '123456',
    };
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var module;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, testing_1.Test.createTestingModule({
                        controllers: [auth_controller_1.AuthController],
                        providers: [
                            {
                                provide: auth_service_1.AuthService,
                                useValue: {
                                    register: jest.fn().mockResolvedValue(registrationChallenge),
                                    verifyRegistrationOtp: jest.fn().mockResolvedValue(mockTokens),
                                    resendRegistrationOtp: jest.fn().mockResolvedValue(registrationChallenge),
                                    login: jest.fn().mockResolvedValue(mockTokens),
                                    refreshToken: jest.fn().mockResolvedValue(mockTokens),
                                    requestPasswordReset: jest.fn().mockResolvedValue(passwordResetChallenge),
                                    verifyPasswordResetOtp: jest.fn().mockResolvedValue({ verified: true }),
                                    resetPassword: jest.fn().mockResolvedValue({ success: true }),
                                    changePassword: jest.fn().mockResolvedValue({ success: true }),
                                    logout: jest.fn().mockResolvedValue(undefined),
                                },
                            },
                        ],
                    }).compile()];
                case 1:
                    module = _a.sent();
                    controller = module.get(auth_controller_1.AuthController);
                    authService = module.get(auth_service_1.AuthService);
                    return [2 /*return*/];
            }
        });
    }); });
    describe('register', function () {
        it('should call authService.register and return a challenge', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dto, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dto = {
                            email: 'test@uit.edu.vn',
                            password: 'Password123',
                            studentId: '22520001',
                            firstName: 'Nguyen',
                            lastName: 'Van A',
                        };
                        return [4 /*yield*/, controller.register(dto)];
                    case 1:
                        result = _a.sent();
                        expect(authService.register).toHaveBeenCalledWith(dto);
                        expect(result).toEqual(registrationChallenge);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should verify the registration OTP and return tokens', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dto, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dto = {
                            challengeId: registrationChallenge.challengeId,
                            otp: '123456',
                        };
                        return [4 /*yield*/, controller.verifyRegistrationOtp(dto)];
                    case 1:
                        result = _a.sent();
                        expect(authService.verifyRegistrationOtp).toHaveBeenCalledWith(dto.challengeId, dto.otp);
                        expect(result).toEqual(mockTokens);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should resend registration OTP for the challenge', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dto, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dto = { challengeId: registrationChallenge.challengeId };
                        return [4 /*yield*/, controller.resendRegistrationOtp(dto)];
                    case 1:
                        result = _a.sent();
                        expect(authService.resendRegistrationOtp).toHaveBeenCalledWith(dto.challengeId);
                        expect(result).toEqual(registrationChallenge);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('login', function () {
        it('should call authService.login and return tokens', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dto, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dto = { email: 'test@uit.edu.vn', password: 'Password123' };
                        return [4 /*yield*/, controller.login(dto)];
                    case 1:
                        result = _a.sent();
                        expect(authService.login).toHaveBeenCalledWith(dto);
                        expect(result).toEqual(mockTokens);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('refresh', function () {
        it('should call authService.refreshToken and return new tokens', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dto, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dto = { refreshToken: 'old-refresh-token' };
                        return [4 /*yield*/, controller.refresh(dto)];
                    case 1:
                        result = _a.sent();
                        expect(authService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
                        expect(result).toEqual(mockTokens);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('logout', function () {
        it('should call authService.logout with userId', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, controller.logout('user-1')];
                    case 1:
                        _a.sent();
                        expect(authService.logout).toHaveBeenCalledWith('user-1');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('changePassword', function () {
        it('should call authService.changePassword with userId and dto fields', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dto, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dto = { currentPassword: 'OldPassword123', newPassword: 'NewPassword456' };
                        return [4 /*yield*/, controller.changePassword('user-1', dto)];
                    case 1:
                        result = _a.sent();
                        expect(authService.changePassword).toHaveBeenCalledWith('user-1', dto.currentPassword, dto.newPassword);
                        expect(result).toEqual({ success: true });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('requestPasswordReset', function () {
        it('should request an OTP for password reset', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dto, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dto = { email: 'student@gm.uit.edu.vn' };
                        return [4 /*yield*/, controller.requestPasswordReset(dto)];
                    case 1:
                        result = _a.sent();
                        expect(authService.requestPasswordReset).toHaveBeenCalledWith(dto.email);
                        expect(result).toEqual(passwordResetChallenge);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('verifyPasswordResetOtp', function () {
        it('should verify OTP before reset', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dto, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dto = { email: 'student@gm.uit.edu.vn', otp: '123456' };
                        return [4 /*yield*/, controller.verifyPasswordResetOtp(dto)];
                    case 1:
                        result = _a.sent();
                        expect(authService.verifyPasswordResetOtp).toHaveBeenCalledWith(dto.email, dto.otp);
                        expect(result).toEqual({ verified: true });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('resetPassword', function () {
        it('should reset password with email, otp, and new password', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dto, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dto = {
                            email: 'student@gm.uit.edu.vn',
                            otp: '123456',
                            newPassword: 'Password123',
                        };
                        return [4 /*yield*/, controller.resetPassword(dto)];
                    case 1:
                        result = _a.sent();
                        expect(authService.resetPassword).toHaveBeenCalledWith(dto.email, dto.otp, dto.newPassword);
                        expect(result).toEqual({ success: true });
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
