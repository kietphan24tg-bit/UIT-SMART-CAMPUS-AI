"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var jwt_1 = require("@nestjs/jwt");
var testing_1 = require("@nestjs/testing");
var bcrypt = require("bcrypt");
var prisma_service_1 = require("../../database/prisma.service");
var users_service_1 = require("../users/users.service");
var auth_service_1 = require("./auth.service");
var password_reset_mailer_service_1 = require("./password-reset-mailer.service");
jest.mock('bcrypt');
jest.mock('node:crypto', function () { return ({
    randomInt: function () { return 123456; },
    randomUUID: function () { return 'mock-uuid-token'; },
}); });
describe('AuthService', function () {
    var authService;
    var prisma;
    var usersService;
    var passwordResetMailerService;
    var mockUser = {
        id: 'user-1',
        email: 'test@uit.edu.vn',
        passwordHash: 'hashed-password',
        studentId: '22520001',
        firstName: 'Nguyen',
        lastName: 'Van A',
        role: 'student',
        isActive: true,
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    var mockOtpRow = {
        id: 'otp-1',
        userId: 'user-1',
        codeHash: 'hashed-otp',
        expiresAt: new Date(Date.now() + 600000),
        consumedAt: null,
        createdAt: new Date(),
    };
    var mockRegistrationChallenge = {
        id: '9e0df78c-d9e1-43ff-ad1e-3788f07309c6',
        email: 'new@uit.edu.vn',
        passwordHash: 'hashed-pw',
        studentId: '22520002',
        firstName: 'Tran',
        lastName: 'Van B',
        otpHash: 'hashed-otp',
        expiresAt: new Date(Date.now() + 600000),
        resendAvailableAt: new Date(Date.now() + 60000),
        failedAttempts: 0,
        lastAttemptAt: null,
        lastSentAt: new Date(),
        consumedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var module;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.clearAllMocks();
                    return [4 /*yield*/, testing_1.Test.createTestingModule({
                            providers: [
                                auth_service_1.AuthService,
                                {
                                    provide: prisma_service_1.PrismaService,
                                    useValue: {
                                        $transaction: jest.fn(),
                                        user: { findUnique: jest.fn(), update: jest.fn() },
                                        registrationChallenge: {
                                            create: jest.fn(),
                                            findFirst: jest.fn(),
                                            findUnique: jest.fn(),
                                            updateMany: jest.fn(),
                                            delete: jest.fn(),
                                            deleteMany: jest.fn(),
                                        },
                                        passwordResetOtp: {
                                            updateMany: jest.fn(),
                                            create: jest.fn(),
                                            findFirst: jest.fn(),
                                        },
                                        refreshToken: {
                                            findUnique: jest.fn(),
                                            create: jest.fn(),
                                            delete: jest.fn(),
                                            deleteMany: jest.fn(),
                                        },
                                    },
                                },
                                {
                                    provide: jwt_1.JwtService,
                                    useValue: { sign: jest.fn().mockReturnValue('mock-access-token') },
                                },
                                {
                                    provide: users_service_1.UsersService,
                                    useValue: { create: jest.fn() },
                                },
                                {
                                    provide: config_1.ConfigService,
                                    useValue: { get: jest.fn().mockReturnValue('7d') },
                                },
                                {
                                    provide: password_reset_mailer_service_1.PasswordResetMailerService,
                                    useValue: {
                                        canSendEmail: jest.fn().mockReturnValue(false),
                                        sendOtpEmail: jest.fn().mockResolvedValue(false),
                                        sendRegistrationOtpEmail: jest.fn().mockResolvedValue(false),
                                    },
                                },
                            ],
                        }).compile()];
                case 1:
                    module = _a.sent();
                    authService = module.get(auth_service_1.AuthService);
                    prisma = module.get(prisma_service_1.PrismaService);
                    usersService = module.get(users_service_1.UsersService);
                    passwordResetMailerService = module.get(password_reset_mailer_service_1.PasswordResetMailerService);
                    prisma.$transaction.mockImplementation(function (callback) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, callback(prisma)];
                    }); }); });
                    return [2 /*return*/];
            }
        });
    }); });
    describe('register', function () {
        beforeEach(function () {
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.registrationChallenge.deleteMany.mockResolvedValue({ count: 0 });
            prisma.registrationChallenge.findFirst.mockResolvedValue(null);
        });
        it('should create a pending challenge without creating a user or session', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        bcrypt.hash
                            .mockResolvedValueOnce('hashed-pw')
                            .mockResolvedValueOnce('hashed-otp');
                        prisma.registrationChallenge.create.mockResolvedValue(mockRegistrationChallenge);
                        return [4 /*yield*/, authService.register({
                                email: ' New@UIT.edu.vn ',
                                password: 'Password123',
                                studentId: '22520002',
                                firstName: 'Tran',
                                lastName: 'Van B',
                            })];
                    case 1:
                        result = _a.sent();
                        expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10);
                        expect(prisma.registrationChallenge.create).toHaveBeenCalledWith({
                            data: expect.objectContaining({
                                email: 'new@uit.edu.vn',
                                passwordHash: 'hashed-pw',
                                studentId: '22520002',
                                otpHash: 'hashed-otp',
                            }),
                        });
                        expect(usersService.create).not.toHaveBeenCalled();
                        expect(prisma.refreshToken.create).not.toHaveBeenCalled();
                        expect(result).toMatchObject({
                            challengeId: mockRegistrationChallenge.id,
                            delivery: 'preview',
                            previewCode: '123456',
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should fail closed without exposing an OTP preview outside development or test', function () { return __awaiter(void 0, void 0, void 0, function () {
            var previousNodeEnv;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        previousNodeEnv = process.env.NODE_ENV;
                        process.env.NODE_ENV = 'staging';
                        bcrypt.hash
                            .mockResolvedValueOnce('hashed-pw')
                            .mockResolvedValueOnce('hashed-otp');
                        prisma.registrationChallenge.create.mockResolvedValue(mockRegistrationChallenge);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 3, 4]);
                        return [4 /*yield*/, expect(authService.register({
                                email: 'new@uit.edu.vn',
                                password: 'Password123',
                                studentId: '22520002',
                                firstName: 'Tran',
                                lastName: 'Van B',
                            })).rejects.toThrow('Không thể gửi OTP lúc này.')];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        if (previousNodeEnv === undefined) {
                            delete process.env.NODE_ENV;
                        }
                        else {
                            process.env.NODE_ENV = previousNodeEnv;
                        }
                        return [7 /*endfinally*/];
                    case 4:
                        expect(prisma.registrationChallenge.deleteMany).toHaveBeenCalledWith({
                            where: { id: mockRegistrationChallenge.id },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should reject a non-UIT email before hashing the password', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(authService.register({
                            email: 'student@example.com',
                            password: 'Password123',
                            studentId: '22520002',
                            firstName: 'Tran',
                            lastName: 'Van B',
                        })).rejects.toThrow('Email cần thuộc miền UIT.')];
                    case 1:
                        _a.sent();
                        expect(bcrypt.hash).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should reject a concurrent challenge for the same email', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        bcrypt.hash
                            .mockResolvedValueOnce('hashed-pw')
                            .mockResolvedValueOnce('hashed-otp');
                        prisma.registrationChallenge.create.mockRejectedValue({ code: 'P2002' });
                        prisma.registrationChallenge.findUnique.mockResolvedValue(mockRegistrationChallenge);
                        return [4 /*yield*/, expect(authService.register({
                                email: 'new@uit.edu.vn',
                                password: 'Password123',
                                studentId: '22520002',
                                firstName: 'Tran',
                                lastName: 'Van B',
                            })).rejects.toMatchObject({ status: 429 })];
                    case 1:
                        _a.sent();
                        expect(prisma.registrationChallenge.deleteMany).toHaveBeenCalledTimes(1);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should create the verified user and refresh token atomically after valid OTP', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.registrationChallenge.findUnique.mockResolvedValue(mockRegistrationChallenge);
                        bcrypt.compare.mockResolvedValue(true);
                        prisma.registrationChallenge.updateMany.mockResolvedValue({ count: 1 });
                        usersService.create.mockResolvedValue({ id: 'user-1', role: 'student' });
                        prisma.refreshToken.create.mockResolvedValue({});
                        prisma.registrationChallenge.delete.mockResolvedValue({});
                        return [4 /*yield*/, authService.verifyRegistrationOtp(mockRegistrationChallenge.id, '123456')];
                    case 1:
                        result = _a.sent();
                        expect(usersService.create).toHaveBeenCalledWith(expect.objectContaining({
                            email: 'new@uit.edu.vn',
                            passwordHash: 'hashed-pw',
                            emailVerifiedAt: expect.any(Date),
                        }), prisma);
                        expect(prisma.refreshToken.create).toHaveBeenCalled();
                        expect(prisma.registrationChallenge.delete).toHaveBeenCalledWith({
                            where: { id: mockRegistrationChallenge.id },
                        });
                        expect(result).toEqual({
                            accessToken: 'mock-access-token',
                            refreshToken: 'mock-uuid-token',
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should increment failed OTP attempts and stop before user creation', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.registrationChallenge.findUnique.mockResolvedValue(mockRegistrationChallenge);
                        bcrypt.compare.mockResolvedValue(false);
                        prisma.registrationChallenge.updateMany.mockResolvedValue({ count: 1 });
                        return [4 /*yield*/, expect(authService.verifyRegistrationOtp(mockRegistrationChallenge.id, '000000')).rejects.toThrow('OTP không hợp lệ hoặc đã hết hạn.')];
                    case 1:
                        _a.sent();
                        expect(prisma.registrationChallenge.updateMany).toHaveBeenCalledWith(expect.objectContaining({
                            data: expect.objectContaining({ failedAttempts: { increment: 1 } }),
                        }));
                        expect(usersService.create).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should block verification after five failed attempts', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.registrationChallenge.findUnique.mockResolvedValue(__assign(__assign({}, mockRegistrationChallenge), { failedAttempts: 5 }));
                        return [4 /*yield*/, expect(authService.verifyRegistrationOtp(mockRegistrationChallenge.id, '123456')).rejects.toThrow('OTP không hợp lệ hoặc đã hết hạn.')];
                    case 1:
                        _a.sent();
                        expect(bcrypt.compare).not.toHaveBeenCalled();
                        expect(usersService.create).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should rotate the OTP and reset failed attempts on resend', function () { return __awaiter(void 0, void 0, void 0, function () {
            var resendableChallenge, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        resendableChallenge = __assign(__assign({}, mockRegistrationChallenge), { failedAttempts: 4, lastAttemptAt: new Date(), resendAvailableAt: new Date(Date.now() - 1000) });
                        prisma.registrationChallenge.findUnique.mockResolvedValue(resendableChallenge);
                        bcrypt.hash.mockResolvedValue('new-otp-hash');
                        prisma.registrationChallenge.updateMany.mockResolvedValue({ count: 1 });
                        return [4 /*yield*/, authService.resendRegistrationOtp(resendableChallenge.id)];
                    case 1:
                        result = _a.sent();
                        expect(prisma.registrationChallenge.updateMany).toHaveBeenCalledWith(expect.objectContaining({
                            data: expect.objectContaining({
                                otpHash: 'new-otp-hash',
                                failedAttempts: 0,
                                lastAttemptAt: null,
                            }),
                        }));
                        expect(result).toMatchObject({
                            challengeId: resendableChallenge.id,
                            delivery: 'preview',
                            previewCode: '123456',
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('login', function () {
        it('should return tokens for valid credentials', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(mockUser);
                        bcrypt.compare.mockResolvedValue(true);
                        prisma.refreshToken.create.mockResolvedValue({});
                        return [4 /*yield*/, authService.login({
                                email: 'test@uit.edu.vn',
                                password: 'Password123',
                            })];
                    case 1:
                        result = _a.sent();
                        expect(result.accessToken).toBe('mock-access-token');
                        expect(result.refreshToken).toBe('mock-uuid-token');
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw UnauthorizedException for non-existent email', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(null);
                        return [4 /*yield*/, expect(authService.login({ email: 'noone@test.com', password: 'pass' })).rejects.toThrow(common_1.UnauthorizedException)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, expect(authService.login({ email: 'noone@test.com', password: 'pass' })).rejects.toThrow('Email hoặc mật khẩu chưa đúng.')];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw UnauthorizedException for wrong password', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(mockUser);
                        bcrypt.compare.mockResolvedValue(false);
                        return [4 /*yield*/, expect(authService.login({ email: 'test@uit.edu.vn', password: 'wrong' })).rejects.toThrow(common_1.UnauthorizedException)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, expect(authService.login({ email: 'test@uit.edu.vn', password: 'wrong' })).rejects.toThrow('Email hoặc mật khẩu chưa đúng.')];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw UnauthorizedException for inactive user', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(__assign(__assign({}, mockUser), { isActive: false }));
                        return [4 /*yield*/, expect(authService.login({ email: 'test@uit.edu.vn', password: 'Password123' })).rejects.toThrow(common_1.UnauthorizedException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should reject a user whose email is not verified', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(__assign(__assign({}, mockUser), { emailVerifiedAt: null }));
                        return [4 /*yield*/, expect(authService.login({ email: 'test@uit.edu.vn', password: 'Password123' })).rejects.toThrow(common_1.UnauthorizedException)];
                    case 1:
                        _a.sent();
                        expect(bcrypt.compare).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('refreshToken', function () {
        it('should return new tokens for valid refresh token', function () { return __awaiter(void 0, void 0, void 0, function () {
            var stored, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        stored = {
                            id: 'rt-1',
                            token: 'valid-token',
                            expiresAt: new Date(Date.now() + 86400000),
                            user: {
                                id: 'user-1',
                                role: 'student',
                                isActive: true,
                                emailVerifiedAt: new Date(),
                            },
                        };
                        prisma.refreshToken.findUnique.mockResolvedValue(stored);
                        prisma.refreshToken.delete.mockResolvedValue({});
                        prisma.refreshToken.create.mockResolvedValue({});
                        return [4 /*yield*/, authService.refreshToken('valid-token')];
                    case 1:
                        result = _a.sent();
                        expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt-1' } });
                        expect(result.accessToken).toBe('mock-access-token');
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw for expired refresh token', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.refreshToken.findUnique.mockResolvedValue({
                            id: 'rt-1',
                            token: 'expired',
                            expiresAt: new Date(Date.now() - 86400000),
                            user: {
                                id: 'user-1',
                                role: 'student',
                                isActive: true,
                                emailVerifiedAt: new Date(),
                            },
                        });
                        return [4 /*yield*/, expect(authService.refreshToken('expired')).rejects.toThrow(common_1.UnauthorizedException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw for non-existent refresh token', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.refreshToken.findUnique.mockResolvedValue(null);
                        return [4 /*yield*/, expect(authService.refreshToken('invalid')).rejects.toThrow(common_1.UnauthorizedException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw for refresh token belonging to inactive user', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.refreshToken.findUnique.mockResolvedValue({
                            id: 'rt-1',
                            token: 'inactive-user-token',
                            expiresAt: new Date(Date.now() + 86400000),
                            user: {
                                id: 'user-1',
                                role: 'student',
                                isActive: false,
                                emailVerifiedAt: new Date(),
                            },
                        });
                        return [4 /*yield*/, expect(authService.refreshToken('inactive-user-token')).rejects.toThrow(common_1.UnauthorizedException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should reject a refresh token belonging to an unverified user', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.refreshToken.findUnique.mockResolvedValue({
                            id: 'rt-1',
                            token: 'unverified-user-token',
                            expiresAt: new Date(Date.now() + 86400000),
                            user: {
                                id: 'user-1',
                                role: 'student',
                                isActive: true,
                                emailVerifiedAt: null,
                            },
                        });
                        return [4 /*yield*/, expect(authService.refreshToken('unverified-user-token')).rejects.toThrow(common_1.UnauthorizedException)];
                    case 1:
                        _a.sent();
                        expect(prisma.refreshToken.delete).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('logout', function () {
        it('should delete all refresh tokens for user', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.refreshToken.deleteMany.mockResolvedValue({ count: 2 });
                        return [4 /*yield*/, authService.logout('user-1')];
                    case 1:
                        _a.sent();
                        expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
                            where: { userId: 'user-1' },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('changePassword', function () {
        it('should update password when current password is correct', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(mockUser);
                        bcrypt.compare.mockResolvedValue(true);
                        bcrypt.hash.mockResolvedValue('hashed-new-password');
                        prisma.user.update.mockResolvedValue({});
                        return [4 /*yield*/, authService.changePassword('user-1', 'OldPassword123', 'NewPassword456')];
                    case 1:
                        result = _a.sent();
                        expect(bcrypt.compare).toHaveBeenCalledWith('OldPassword123', 'hashed-password');
                        expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword456', 10);
                        expect(prisma.user.update).toHaveBeenCalledWith({
                            where: { id: 'user-1' },
                            data: { passwordHash: 'hashed-new-password' },
                        });
                        expect(result).toEqual({ success: true });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw UnauthorizedException when user not found', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(null);
                        return [4 /*yield*/, expect(authService.changePassword('user-999', 'OldPassword123', 'NewPassword456')).rejects.toThrow(common_1.UnauthorizedException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw UnauthorizedException when current password is wrong', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(mockUser);
                        bcrypt.compare.mockResolvedValue(false);
                        return [4 /*yield*/, expect(authService.changePassword('user-1', 'WrongPassword', 'NewPassword456')).rejects.toThrow(common_1.UnauthorizedException)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, expect(authService.changePassword('user-1', 'WrongPassword', 'NewPassword456')).rejects.toThrow('Mật khẩu hiện tại chưa đúng.')];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw UnauthorizedException for inactive user', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(__assign(__assign({}, mockUser), { isActive: false }));
                        return [4 /*yield*/, expect(authService.changePassword('user-1', 'OldPassword123', 'NewPassword456')).rejects.toThrow(common_1.UnauthorizedException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('password reset', function () {
        it('should throw when password reset email is not registered', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(null);
                        return [4 /*yield*/, expect(authService.requestPasswordReset('missing@uit.edu.vn')).rejects.toThrow(common_1.BadRequestException)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, expect(authService.requestPasswordReset('missing@uit.edu.vn')).rejects.toThrow('Email chưa được đăng ký tài khoản.')];
                    case 2:
                        _a.sent();
                        expect(prisma.passwordResetOtp.create).not.toHaveBeenCalled();
                        expect(passwordResetMailerService.sendOtpEmail).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw when password reset email belongs to an inactive user', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(__assign(__assign({}, mockUser), { isActive: false }));
                        return [4 /*yield*/, expect(authService.requestPasswordReset('inactive@uit.edu.vn')).rejects.toThrow(common_1.BadRequestException)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, expect(authService.requestPasswordReset('inactive@uit.edu.vn')).rejects.toThrow('Email chưa được đăng ký tài khoản.')];
                    case 2:
                        _a.sent();
                        expect(prisma.passwordResetOtp.create).not.toHaveBeenCalled();
                        expect(passwordResetMailerService.sendOtpEmail).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should create a password reset OTP for an active user', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(mockUser);
                        bcrypt.hash.mockResolvedValue('hashed-otp');
                        prisma.passwordResetOtp.create.mockResolvedValue(mockOtpRow);
                        return [4 /*yield*/, authService.requestPasswordReset('test@uit.edu.vn')];
                    case 1:
                        result = _a.sent();
                        expect(prisma.passwordResetOtp.updateMany).toHaveBeenCalledWith({
                            where: {
                                userId: 'user-1',
                                consumedAt: null,
                                expiresAt: expect.any(Object),
                            },
                            data: { consumedAt: expect.any(Date) },
                        });
                        expect(prisma.passwordResetOtp.create).toHaveBeenCalledWith({
                            data: {
                                userId: 'user-1',
                                codeHash: 'hashed-otp',
                                expiresAt: expect.any(Date),
                            },
                        });
                        expect(passwordResetMailerService.sendOtpEmail).toHaveBeenCalled();
                        expect(result.delivery).toBe('preview');
                        expect('previewCode' in result && result.previewCode).toMatch(/^\d{6}$/);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return email delivery when SMTP send succeeds', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(mockUser);
                        bcrypt.hash.mockResolvedValue('hashed-otp');
                        prisma.passwordResetOtp.create.mockResolvedValue(mockOtpRow);
                        passwordResetMailerService.canSendEmail.mockReturnValue(true);
                        passwordResetMailerService.sendOtpEmail.mockResolvedValue(true);
                        return [4 /*yield*/, authService.requestPasswordReset('test@uit.edu.vn')];
                    case 1:
                        result = _a.sent();
                        expect(result.delivery).toBe('email');
                        expect(result).not.toHaveProperty('previewCode');
                        return [2 /*return*/];
                }
            });
        }); });
        it('should verify a valid OTP', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(mockUser);
                        bcrypt.hash.mockResolvedValue('hashed-otp');
                        prisma.passwordResetOtp.create.mockResolvedValue(mockOtpRow);
                        prisma.passwordResetOtp.findFirst.mockResolvedValue(mockOtpRow);
                        bcrypt.compare.mockResolvedValue(true);
                        return [4 /*yield*/, authService.requestPasswordReset('test@uit.edu.vn')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, expect(authService.verifyPasswordResetOtp('test@uit.edu.vn', '123456')).resolves.toEqual({ verified: true })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should update password, consume otp, and clear sessions after reset', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(mockUser);
                        bcrypt.hash
                            .mockResolvedValueOnce('hashed-otp')
                            .mockResolvedValueOnce('hashed-new-password');
                        prisma.passwordResetOtp.create.mockResolvedValue(mockOtpRow);
                        prisma.passwordResetOtp.findFirst.mockResolvedValue(mockOtpRow);
                        bcrypt.compare.mockResolvedValue(true);
                        prisma.user.update.mockResolvedValue({});
                        prisma.passwordResetOtp.updateMany.mockResolvedValue({ count: 1 });
                        prisma.refreshToken.deleteMany.mockResolvedValue({ count: 2 });
                        return [4 /*yield*/, authService.requestPasswordReset('test@uit.edu.vn')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, expect(authService.resetPassword('test@uit.edu.vn', '123456', 'Password123')).resolves.toEqual({ success: true })];
                    case 2:
                        _a.sent();
                        expect(prisma.user.update).toHaveBeenCalledWith({
                            where: { id: 'user-1' },
                            data: { passwordHash: 'hashed-new-password' },
                        });
                        expect(prisma.passwordResetOtp.updateMany).toHaveBeenCalledWith({
                            where: {
                                id: 'otp-1',
                                consumedAt: null,
                                expiresAt: expect.any(Object),
                            },
                            data: { consumedAt: expect.any(Date) },
                        });
                        expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
                            where: { userId: 'user-1' },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
