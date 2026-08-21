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
exports.AuthService = void 0;
var node_crypto_1 = require("node:crypto");
var common_1 = require("@nestjs/common");
var shared_1 = require("@smart-campus/shared");
var bcrypt = require("bcrypt");
var PASSWORD_RESET_OTP_TTL_MS = 10 * 60 * 1000;
var REGISTRATION_OTP_TTL_MS = 10 * 60 * 1000;
var REGISTRATION_RESEND_COOLDOWN_MS = 60 * 1000;
var REGISTRATION_MAX_FAILED_ATTEMPTS = 5;
var PASSWORD_RESET_EMAIL_NOT_REGISTERED_MESSAGE = 'Email chưa được đăng ký tài khoản.';
var EMAIL_ALREADY_REGISTERED_MESSAGE = 'Email đã được đăng ký.';
var STUDENT_ID_ALREADY_REGISTERED_MESSAGE = 'MSSV đã được đăng ký.';
var REGISTRATION_CHALLENGE_INVALID_MESSAGE = 'Yêu cầu đăng ký không hợp lệ hoặc đã hết hạn.';
var REGISTRATION_OTP_INVALID_MESSAGE = 'OTP không hợp lệ hoặc đã hết hạn.';
var UIT_EMAIL_MESSAGE = 'Email cần thuộc miền UIT.';
var AuthService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AuthService = _classThis = /** @class */ (function () {
        function AuthService_1(prisma, jwtService, usersService, configService, passwordResetMailerService) {
            this.prisma = prisma;
            this.jwtService = jwtService;
            this.usersService = usersService;
            this.configService = configService;
            this.passwordResetMailerService = passwordResetMailerService;
        }
        AuthService_1.prototype.register = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var email, passwordHash, otp, otpHash, now, challenge, error_1, activeChallenge, retryInSeconds, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            email = (0, shared_1.normalizeEmail)(dto.email);
                            this.assertUitEmail(email);
                            return [4 /*yield*/, this.cleanupExpiredRegistrationChallenges()];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.assertRegistrationIdentityAvailable(email, dto.studentId)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.assertRegistrationRequestCooldown(email, dto.studentId)];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, bcrypt.hash(dto.password, 10)];
                        case 4:
                            passwordHash = _a.sent();
                            otp = this.generateOtp();
                            return [4 /*yield*/, bcrypt.hash(otp, 10)];
                        case 5:
                            otpHash = _a.sent();
                            now = new Date();
                            _a.label = 6;
                        case 6:
                            _a.trys.push([6, 8, , 11]);
                            return [4 /*yield*/, this.prisma.registrationChallenge.create({
                                    data: {
                                        email: email,
                                        passwordHash: passwordHash,
                                        studentId: dto.studentId,
                                        firstName: dto.firstName.trim(),
                                        lastName: dto.lastName.trim(),
                                        otpHash: otpHash,
                                        expiresAt: new Date(now.getTime() + REGISTRATION_OTP_TTL_MS),
                                        resendAvailableAt: new Date(now.getTime() + REGISTRATION_RESEND_COOLDOWN_MS),
                                        lastSentAt: now,
                                    },
                                })];
                        case 7:
                            challenge = _a.sent();
                            return [3 /*break*/, 11];
                        case 8:
                            error_1 = _a.sent();
                            if (!this.isUniqueConstraintError(error_1)) return [3 /*break*/, 10];
                            return [4 /*yield*/, this.prisma.registrationChallenge.findUnique({
                                    where: { email: email },
                                })];
                        case 9:
                            activeChallenge = _a.sent();
                            retryInSeconds = activeChallenge
                                ? this.secondsUntil(activeChallenge.resendAvailableAt)
                                : Math.ceil(REGISTRATION_RESEND_COOLDOWN_MS / 1000);
                            throw new common_1.HttpException("Vui l\u00F2ng ch\u1EDD ".concat(retryInSeconds, " gi\u00E2y tr\u01B0\u1EDBc khi g\u1EEDi l\u1EA1i OTP."), common_1.HttpStatus.TOO_MANY_REQUESTS);
                        case 10: throw error_1;
                        case 11:
                            _a.trys.push([11, 13, , 15]);
                            return [4 /*yield*/, this.deliverRegistrationChallenge(challenge, otp)];
                        case 12: return [2 /*return*/, _a.sent()];
                        case 13:
                            error_2 = _a.sent();
                            return [4 /*yield*/, this.prisma.registrationChallenge.deleteMany({ where: { id: challenge.id } })];
                        case 14:
                            _a.sent();
                            throw error_2;
                        case 15: return [2 /*return*/];
                    }
                });
            });
        };
        AuthService_1.prototype.verifyRegistrationOtp = function (challengeId, otp) {
            return __awaiter(this, void 0, void 0, function () {
                var challenge, isValid, verifiedAt;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getActiveRegistrationChallenge(challengeId)];
                        case 1:
                            challenge = _a.sent();
                            if (challenge.failedAttempts >= REGISTRATION_MAX_FAILED_ATTEMPTS) {
                                throw new common_1.UnauthorizedException(REGISTRATION_OTP_INVALID_MESSAGE);
                            }
                            return [4 /*yield*/, bcrypt.compare(String(otp).trim(), challenge.otpHash)];
                        case 2:
                            isValid = _a.sent();
                            if (!!isValid) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.prisma.registrationChallenge.updateMany({
                                    where: {
                                        id: challenge.id,
                                        otpHash: challenge.otpHash,
                                        consumedAt: null,
                                        expiresAt: { gt: new Date() },
                                        failedAttempts: { lt: REGISTRATION_MAX_FAILED_ATTEMPTS },
                                    },
                                    data: {
                                        failedAttempts: { increment: 1 },
                                        lastAttemptAt: new Date(),
                                    },
                                })];
                        case 3:
                            _a.sent();
                            throw new common_1.UnauthorizedException(REGISTRATION_OTP_INVALID_MESSAGE);
                        case 4:
                            verifiedAt = new Date();
                            return [2 /*return*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var claimed, user, tokens;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, tx.registrationChallenge.updateMany({
                                                    where: {
                                                        id: challenge.id,
                                                        otpHash: challenge.otpHash,
                                                        consumedAt: null,
                                                        expiresAt: { gt: verifiedAt },
                                                        failedAttempts: { lt: REGISTRATION_MAX_FAILED_ATTEMPTS },
                                                    },
                                                    data: {
                                                        consumedAt: verifiedAt,
                                                        lastAttemptAt: verifiedAt,
                                                    },
                                                })];
                                            case 1:
                                                claimed = _a.sent();
                                                if (claimed.count === 0) {
                                                    throw new common_1.UnauthorizedException(REGISTRATION_OTP_INVALID_MESSAGE);
                                                }
                                                return [4 /*yield*/, this.usersService.create({
                                                        email: challenge.email,
                                                        passwordHash: challenge.passwordHash,
                                                        studentId: challenge.studentId,
                                                        firstName: challenge.firstName,
                                                        lastName: challenge.lastName,
                                                        emailVerifiedAt: verifiedAt,
                                                    }, tx)];
                                            case 2:
                                                user = _a.sent();
                                                return [4 /*yield*/, this.generateTokens(user.id, user.role, tx)];
                                            case 3:
                                                tokens = _a.sent();
                                                // Successful challenges contain password and OTP hashes; remove them atomically.
                                                return [4 /*yield*/, tx.registrationChallenge.delete({ where: { id: challenge.id } })];
                                            case 4:
                                                // Successful challenges contain password and OTP hashes; remove them atomically.
                                                _a.sent();
                                                return [2 /*return*/, tokens];
                                        }
                                    });
                                }); })];
                    }
                });
            });
        };
        AuthService_1.prototype.resendRegistrationOtp = function (challengeId) {
            return __awaiter(this, void 0, void 0, function () {
                var challenge, now, otp, otpHash, expiresAt, resendAvailableAt, reserved, updatedChallenge, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getActiveRegistrationChallenge(challengeId)];
                        case 1:
                            challenge = _a.sent();
                            now = new Date();
                            if (challenge.resendAvailableAt > now) {
                                throw new common_1.HttpException("Vui l\u00F2ng ch\u1EDD ".concat(this.secondsUntil(challenge.resendAvailableAt, now), " gi\u00E2y tr\u01B0\u1EDBc khi g\u1EEDi l\u1EA1i OTP."), common_1.HttpStatus.TOO_MANY_REQUESTS);
                            }
                            otp = this.generateOtp();
                            return [4 /*yield*/, bcrypt.hash(otp, 10)];
                        case 2:
                            otpHash = _a.sent();
                            expiresAt = new Date(now.getTime() + REGISTRATION_OTP_TTL_MS);
                            resendAvailableAt = new Date(now.getTime() + REGISTRATION_RESEND_COOLDOWN_MS);
                            return [4 /*yield*/, this.prisma.registrationChallenge.updateMany({
                                    where: {
                                        id: challenge.id,
                                        consumedAt: null,
                                        expiresAt: { gt: now },
                                        resendAvailableAt: { lte: now },
                                    },
                                    data: {
                                        otpHash: otpHash,
                                        expiresAt: expiresAt,
                                        resendAvailableAt: resendAvailableAt,
                                        failedAttempts: 0,
                                        lastAttemptAt: null,
                                        lastSentAt: now,
                                    },
                                })];
                        case 3:
                            reserved = _a.sent();
                            if (reserved.count === 0) {
                                throw new common_1.HttpException('Vui lòng chờ trước khi gửi lại OTP.', common_1.HttpStatus.TOO_MANY_REQUESTS);
                            }
                            updatedChallenge = __assign(__assign({}, challenge), { otpHash: otpHash, expiresAt: expiresAt, resendAvailableAt: resendAvailableAt, failedAttempts: 0, lastAttemptAt: null, lastSentAt: now });
                            _a.label = 4;
                        case 4:
                            _a.trys.push([4, 6, , 8]);
                            return [4 /*yield*/, this.deliverRegistrationChallenge(updatedChallenge, otp)];
                        case 5: return [2 /*return*/, _a.sent()];
                        case 6:
                            error_3 = _a.sent();
                            // Keep the challenge reusable when production SMTP is unavailable.
                            return [4 /*yield*/, this.prisma.registrationChallenge.updateMany({
                                    where: { id: challenge.id, otpHash: otpHash, consumedAt: null },
                                    data: { resendAvailableAt: new Date() },
                                })];
                        case 7:
                            // Keep the challenge reusable when production SMTP is unavailable.
                            _a.sent();
                            throw error_3;
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        AuthService_1.prototype.login = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var user, isPasswordValid;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.user.findUnique({
                                where: { email: (0, shared_1.normalizeEmail)(dto.email) },
                            })];
                        case 1:
                            user = _a.sent();
                            if (!user || !user.isActive || !user.emailVerifiedAt) {
                                throw new common_1.UnauthorizedException('Email hoặc mật khẩu chưa đúng.');
                            }
                            if ((0, shared_1.isLegacyUserRole)(user.role)) {
                                throw new common_1.UnauthorizedException('Tài khoản không tồn tại.');
                            }
                            return [4 /*yield*/, bcrypt.compare(dto.password, user.passwordHash)];
                        case 2:
                            isPasswordValid = _a.sent();
                            if (!isPasswordValid) {
                                throw new common_1.UnauthorizedException('Email hoặc mật khẩu chưa đúng.');
                            }
                            return [2 /*return*/, this.generateTokens(user.id, user.role)];
                    }
                });
            });
        };
        AuthService_1.prototype.refreshToken = function (refreshToken) {
            return __awaiter(this, void 0, void 0, function () {
                var stored;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.refreshToken.findUnique({
                                where: { token: refreshToken },
                                include: { user: true },
                            })];
                        case 1:
                            stored = _a.sent();
                            if (!stored ||
                                stored.expiresAt < new Date() ||
                                !stored.user.isActive ||
                                !stored.user.emailVerifiedAt) {
                                throw new common_1.UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
                            }
                            return [4 /*yield*/, this.prisma.refreshToken.delete({ where: { id: stored.id } })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, this.generateTokens(stored.user.id, stored.user.role)];
                    }
                });
            });
        };
        AuthService_1.prototype.logout = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.refreshToken.deleteMany({ where: { userId: userId } })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        AuthService_1.prototype.requestPasswordReset = function (email) {
            return __awaiter(this, void 0, void 0, function () {
                var normalizedEmail, emailDeliveryAvailable, deliveryMode, baseResponse, user, otp, codeHash, expiresAt, sent;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            normalizedEmail = (0, shared_1.normalizeEmail)(email);
                            this.assertUitEmail(normalizedEmail);
                            emailDeliveryAvailable = this.passwordResetMailerService.canSendEmail();
                            deliveryMode = emailDeliveryAvailable ? 'email' : 'preview';
                            baseResponse = {
                                maskedEmail: this.maskEmail(normalizedEmail),
                                expiresInSeconds: PASSWORD_RESET_OTP_TTL_MS / 1000,
                                delivery: deliveryMode,
                            };
                            return [4 /*yield*/, this.prisma.user.findUnique({
                                    where: { email: normalizedEmail },
                                })];
                        case 1:
                            user = _a.sent();
                            if (!user || !user.isActive) {
                                throw new common_1.BadRequestException(PASSWORD_RESET_EMAIL_NOT_REGISTERED_MESSAGE);
                            }
                            otp = this.generateOtp();
                            return [4 /*yield*/, bcrypt.hash(otp, 10)];
                        case 2:
                            codeHash = _a.sent();
                            expiresAt = new Date(Date.now() + PASSWORD_RESET_OTP_TTL_MS);
                            return [4 /*yield*/, this.prisma.passwordResetOtp.updateMany({
                                    where: {
                                        userId: user.id,
                                        consumedAt: null,
                                        expiresAt: { gt: new Date() },
                                    },
                                    data: { consumedAt: new Date() },
                                })];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.passwordResetOtp.create({
                                    data: {
                                        userId: user.id,
                                        codeHash: codeHash,
                                        expiresAt: expiresAt,
                                    },
                                })];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, this.passwordResetMailerService.sendOtpEmail(normalizedEmail, otp, Math.round(PASSWORD_RESET_OTP_TTL_MS / 60000))];
                        case 5:
                            sent = _a.sent();
                            if (sent) {
                                return [2 /*return*/, baseResponse];
                            }
                            if (this.canExposeOtpPreview()) {
                                // Dev preview keeps the flow testable locally until SMTP is configured.
                                return [2 /*return*/, __assign(__assign({}, baseResponse), { delivery: 'preview', previewCode: otp })];
                            }
                            throw new common_1.InternalServerErrorException('Không thể gửi OTP lúc này.');
                    }
                });
            });
        };
        AuthService_1.prototype.verifyPasswordResetOtp = function (email, otp) {
            return __awaiter(this, void 0, void 0, function () {
                var user, passwordResetOtp, isValid;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findActiveUserByEmail(email)];
                        case 1:
                            user = _a.sent();
                            return [4 /*yield*/, this.getLatestActivePasswordResetOtp(user.id)];
                        case 2:
                            passwordResetOtp = _a.sent();
                            return [4 /*yield*/, bcrypt.compare(String(otp).trim(), passwordResetOtp.codeHash)];
                        case 3:
                            isValid = _a.sent();
                            if (!isValid) {
                                throw new common_1.UnauthorizedException('OTP không hợp lệ hoặc đã hết hạn.');
                            }
                            return [2 /*return*/, { verified: true }];
                    }
                });
            });
        };
        AuthService_1.prototype.changePassword = function (userId, currentPassword, newPassword) {
            return __awaiter(this, void 0, void 0, function () {
                var user, isPasswordValid, passwordHash;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.user.findUnique({ where: { id: userId } })];
                        case 1:
                            user = _a.sent();
                            if (!user || !user.isActive) {
                                throw new common_1.UnauthorizedException('Email hoặc mật khẩu chưa đúng.');
                            }
                            return [4 /*yield*/, bcrypt.compare(currentPassword, user.passwordHash)];
                        case 2:
                            isPasswordValid = _a.sent();
                            if (!isPasswordValid) {
                                throw new common_1.UnauthorizedException('Mật khẩu hiện tại chưa đúng.');
                            }
                            return [4 /*yield*/, bcrypt.hash(newPassword, 10)];
                        case 3:
                            passwordHash = _a.sent();
                            return [4 /*yield*/, this.prisma.user.update({
                                    where: { id: userId },
                                    data: { passwordHash: passwordHash },
                                })];
                        case 4:
                            _a.sent();
                            return [2 /*return*/, { success: true }];
                    }
                });
            });
        };
        AuthService_1.prototype.resetPassword = function (email, otp, newPassword) {
            return __awaiter(this, void 0, void 0, function () {
                var user, passwordResetOtp, isValid, passwordHash, consumedAt;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findActiveUserByEmail(email)];
                        case 1:
                            user = _a.sent();
                            return [4 /*yield*/, this.getLatestActivePasswordResetOtp(user.id)];
                        case 2:
                            passwordResetOtp = _a.sent();
                            return [4 /*yield*/, bcrypt.compare(String(otp).trim(), passwordResetOtp.codeHash)];
                        case 3:
                            isValid = _a.sent();
                            if (!isValid) {
                                throw new common_1.UnauthorizedException('OTP không hợp lệ hoặc đã hết hạn.');
                            }
                            return [4 /*yield*/, bcrypt.hash(newPassword, 10)];
                        case 4:
                            passwordHash = _a.sent();
                            consumedAt = new Date();
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var consumed;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, tx.passwordResetOtp.updateMany({
                                                    where: {
                                                        id: passwordResetOtp.id,
                                                        consumedAt: null,
                                                        expiresAt: { gt: new Date() },
                                                    },
                                                    data: { consumedAt: consumedAt },
                                                })];
                                            case 1:
                                                consumed = _a.sent();
                                                if (consumed.count === 0) {
                                                    throw new common_1.UnauthorizedException('OTP không hợp lệ hoặc đã hết hạn.');
                                                }
                                                return [4 /*yield*/, tx.user.update({
                                                        where: { id: user.id },
                                                        data: { passwordHash: passwordHash },
                                                    })];
                                            case 2:
                                                _a.sent();
                                                return [4 /*yield*/, tx.refreshToken.deleteMany({ where: { userId: user.id } })];
                                            case 3:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); })];
                        case 5:
                            _a.sent();
                            return [2 /*return*/, { success: true }];
                    }
                });
            });
        };
        AuthService_1.prototype.generateTokens = function (userId_1, role_1) {
            return __awaiter(this, arguments, void 0, function (userId, role, client) {
                var payload, accessToken, refreshTokenValue, refreshExpDays;
                if (client === void 0) { client = this.prisma; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            payload = { sub: userId, role: role };
                            accessToken = this.jwtService.sign(payload);
                            refreshTokenValue = (0, node_crypto_1.randomUUID)();
                            refreshExpDays = parseInt(this.configService.get('JWT_REFRESH_EXPIRATION', '7d').replace('d', ''), 10);
                            return [4 /*yield*/, client.refreshToken.create({
                                    data: {
                                        token: refreshTokenValue,
                                        userId: userId,
                                        expiresAt: new Date(Date.now() + refreshExpDays * 24 * 60 * 60 * 1000),
                                    },
                                })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, { accessToken: accessToken, refreshToken: refreshTokenValue }];
                    }
                });
            });
        };
        AuthService_1.prototype.cleanupExpiredRegistrationChallenges = function () {
            return __awaiter(this, void 0, void 0, function () {
                var now;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            now = new Date();
                            return [4 /*yield*/, this.prisma.registrationChallenge.deleteMany({
                                    where: {
                                        OR: [{ expiresAt: { lte: now } }, { consumedAt: { not: null } }],
                                    },
                                })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        AuthService_1.prototype.assertRegistrationIdentityAvailable = function (email, studentId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, emailOwner, studentIdOwner;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.prisma.user.findUnique({ where: { email: email }, select: { id: true } }),
                                this.prisma.user.findUnique({ where: { studentId: studentId }, select: { id: true } }),
                            ])];
                        case 1:
                            _a = _b.sent(), emailOwner = _a[0], studentIdOwner = _a[1];
                            if (emailOwner) {
                                throw new common_1.ConflictException(EMAIL_ALREADY_REGISTERED_MESSAGE);
                            }
                            if (studentIdOwner) {
                                throw new common_1.ConflictException(STUDENT_ID_ALREADY_REGISTERED_MESSAGE);
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        AuthService_1.prototype.assertRegistrationRequestCooldown = function (email, studentId) {
            return __awaiter(this, void 0, void 0, function () {
                var now, existing;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            now = new Date();
                            return [4 /*yield*/, this.prisma.registrationChallenge.findFirst({
                                    where: {
                                        consumedAt: null,
                                        expiresAt: { gt: now },
                                        OR: [{ email: email }, { studentId: studentId }],
                                    },
                                    orderBy: { lastSentAt: 'desc' },
                                })];
                        case 1:
                            existing = _a.sent();
                            if ((existing === null || existing === void 0 ? void 0 : existing.resendAvailableAt) && existing.resendAvailableAt > now) {
                                throw new common_1.HttpException("Vui l\u00F2ng ch\u1EDD ".concat(this.secondsUntil(existing.resendAvailableAt, now), " gi\u00E2y tr\u01B0\u1EDBc khi g\u1EEDi l\u1EA1i OTP."), common_1.HttpStatus.TOO_MANY_REQUESTS);
                            }
                            if (!existing) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.prisma.registrationChallenge.deleteMany({
                                    where: {
                                        consumedAt: null,
                                        OR: [{ email: email }, { studentId: studentId }],
                                    },
                                })];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        AuthService_1.prototype.getActiveRegistrationChallenge = function (challengeId) {
            return __awaiter(this, void 0, void 0, function () {
                var challenge;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.registrationChallenge.findUnique({
                                where: { id: challengeId },
                            })];
                        case 1:
                            challenge = _a.sent();
                            if (!challenge || challenge.consumedAt) {
                                throw new common_1.BadRequestException(REGISTRATION_CHALLENGE_INVALID_MESSAGE);
                            }
                            if (!(challenge.expiresAt <= new Date())) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.prisma.registrationChallenge.deleteMany({ where: { id: challenge.id } })];
                        case 2:
                            _a.sent();
                            throw new common_1.BadRequestException(REGISTRATION_CHALLENGE_INVALID_MESSAGE);
                        case 3: return [2 /*return*/, challenge];
                    }
                });
            });
        };
        AuthService_1.prototype.deliverRegistrationChallenge = function (challenge, otp) {
            return __awaiter(this, void 0, void 0, function () {
                var sent, response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.passwordResetMailerService.sendRegistrationOtpEmail(challenge.email, otp, Math.round(REGISTRATION_OTP_TTL_MS / 60000))];
                        case 1:
                            sent = _a.sent();
                            response = {
                                challengeId: challenge.id,
                                maskedEmail: this.maskEmail(challenge.email),
                                expiresInSeconds: this.secondsUntil(challenge.expiresAt),
                                resendAvailableInSeconds: this.secondsUntil(challenge.resendAvailableAt),
                            };
                            if (sent) {
                                return [2 /*return*/, __assign(__assign({}, response), { delivery: 'email' })];
                            }
                            if (this.canExposeOtpPreview()) {
                                return [2 /*return*/, __assign(__assign({}, response), { delivery: 'preview', previewCode: otp })];
                            }
                            throw new common_1.InternalServerErrorException('Không thể gửi OTP lúc này.');
                    }
                });
            });
        };
        AuthService_1.prototype.assertUitEmail = function (email) {
            if (!(0, shared_1.isValidUitEmail)(email)) {
                throw new common_1.BadRequestException(UIT_EMAIL_MESSAGE);
            }
        };
        AuthService_1.prototype.canExposeOtpPreview = function () {
            var _a;
            var environment = String((_a = process.env.NODE_ENV) !== null && _a !== void 0 ? _a : this.configService.get('NODE_ENV', ''))
                .trim()
                .toLowerCase();
            return environment === 'development' || environment === 'test';
        };
        AuthService_1.prototype.secondsUntil = function (target, now) {
            if (now === void 0) { now = new Date(); }
            return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 1000));
        };
        AuthService_1.prototype.isUniqueConstraintError = function (error) {
            return (typeof error === 'object' &&
                error !== null &&
                'code' in error &&
                error.code === 'P2002');
        };
        AuthService_1.prototype.maskEmail = function (email) {
            var _a = email.split('@'), localPart = _a[0], _b = _a[1], domain = _b === void 0 ? 'uit.edu.vn' : _b;
            if (!localPart) {
                return "***@".concat(domain);
            }
            if (localPart.length <= 2) {
                return "".concat(localPart[0] || '*', "*@").concat(domain);
            }
            return "".concat(localPart.slice(0, 2), "***@").concat(domain);
        };
        AuthService_1.prototype.generateOtp = function () {
            return "".concat((0, node_crypto_1.randomInt)(100000, 1000000));
        };
        AuthService_1.prototype.findActiveUserByEmail = function (email) {
            return __awaiter(this, void 0, void 0, function () {
                var normalizedEmail, user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            normalizedEmail = (0, shared_1.normalizeEmail)(email);
                            this.assertUitEmail(normalizedEmail);
                            return [4 /*yield*/, this.prisma.user.findUnique({
                                    where: { email: normalizedEmail },
                                })];
                        case 1:
                            user = _a.sent();
                            if (!user || !user.isActive) {
                                throw new common_1.UnauthorizedException('OTP không hợp lệ hoặc đã hết hạn.');
                            }
                            return [2 /*return*/, user];
                    }
                });
            });
        };
        AuthService_1.prototype.getLatestActivePasswordResetOtp = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var passwordResetOtp;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.passwordResetOtp.findFirst({
                                where: {
                                    userId: userId,
                                    consumedAt: null,
                                    expiresAt: { gt: new Date() },
                                },
                                orderBy: { createdAt: 'desc' },
                            })];
                        case 1:
                            passwordResetOtp = _a.sent();
                            if (!passwordResetOtp) {
                                throw new common_1.UnauthorizedException('OTP không hợp lệ hoặc đã hết hạn.');
                            }
                            return [2 /*return*/, passwordResetOtp];
                    }
                });
            });
        };
        return AuthService_1;
    }());
    __setFunctionName(_classThis, "AuthService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuthService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuthService = _classThis;
}();
exports.AuthService = AuthService;
