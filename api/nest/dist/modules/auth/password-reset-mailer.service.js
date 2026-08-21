"use strict";
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
exports.PasswordResetMailerService = void 0;
var common_1 = require("@nestjs/common");
var nodemailer_1 = require("nodemailer");
var PasswordResetMailerService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var PasswordResetMailerService = _classThis = /** @class */ (function () {
        function PasswordResetMailerService_1(configService) {
            this.configService = configService;
            this.logger = new common_1.Logger(PasswordResetMailerService.name);
        }
        PasswordResetMailerService_1.prototype.canSendEmail = function () {
            return this.getTransporter() !== null && Boolean(this.getFromAddress());
        };
        PasswordResetMailerService_1.prototype.sendOtpEmail = function (email, otp, expiresInMinutes) {
            return __awaiter(this, void 0, void 0, function () {
                var transporter, from, error_1, message;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            transporter = this.getTransporter();
                            from = this.getFromAddress();
                            if (!transporter || !from) {
                                return [2 /*return*/, false];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, transporter.sendMail({
                                    from: from,
                                    to: email,
                                    subject: 'UIT Smart Campus | Mã OTP đặt lại mật khẩu',
                                    text: [
                                        'Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản UIT Smart Campus.',
                                        "M\u00E3 OTP c\u1EE7a b\u1EA1n l\u00E0: ".concat(otp),
                                        "M\u00E3 c\u00F3 hi\u1EC7u l\u1EF1c trong ".concat(expiresInMinutes, " ph\u00FAt."),
                                        'Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.',
                                    ].join('\n'),
                                    html: "\n          <div style=\"font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;\">\n            <p>B\u1EA1n \u0111\u00E3 y\u00EAu c\u1EA7u \u0111\u1EB7t l\u1EA1i m\u1EADt kh\u1EA9u cho t\u00E0i kho\u1EA3n <strong>UIT Smart Campus</strong>.</p>\n            <p style=\"margin: 20px 0;\">\n              <span style=\"display: inline-block; padding: 12px 18px; border-radius: 12px; background: #eff6ff; color: #1d4ed8; font-size: 24px; font-weight: 700; letter-spacing: 4px;\">\n                ".concat(otp, "\n              </span>\n            </p>\n            <p>M\u00E3 OTP c\u00F3 hi\u1EC7u l\u1EF1c trong <strong>").concat(expiresInMinutes, " ph\u00FAt</strong>.</p>\n            <p>N\u1EBFu b\u1EA1n kh\u00F4ng th\u1EF1c hi\u1EC7n y\u00EAu c\u1EA7u n\u00E0y, vui l\u00F2ng b\u1ECF qua email.</p>\n          </div>\n        "),
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, true];
                        case 3:
                            error_1 = _a.sent();
                            message = error_1 instanceof Error ? error_1.message : 'Unknown mail transport error';
                            this.logger.warn("Failed to send password reset OTP email: ".concat(message));
                            return [2 /*return*/, false];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        PasswordResetMailerService_1.prototype.sendRegistrationOtpEmail = function (email, otp, expiresInMinutes) {
            return __awaiter(this, void 0, void 0, function () {
                var transporter, from, error_2, message;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            transporter = this.getTransporter();
                            from = this.getFromAddress();
                            if (!transporter || !from) {
                                return [2 /*return*/, false];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, transporter.sendMail({
                                    from: from,
                                    to: email,
                                    subject: 'UIT Smart Campus | Mã OTP xác thực đăng ký',
                                    text: [
                                        'Bạn đang tạo tài khoản UIT Smart Campus.',
                                        "M\u00E3 OTP x\u00E1c th\u1EF1c \u0111\u0103ng k\u00FD c\u1EE7a b\u1EA1n l\u00E0: ".concat(otp),
                                        "M\u00E3 c\u00F3 hi\u1EC7u l\u1EF1c trong ".concat(expiresInMinutes, " ph\u00FAt."),
                                        'Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.',
                                    ].join('\n'),
                                    html: "\n          <div style=\"font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;\">\n            <p>B\u1EA1n \u0111ang t\u1EA1o t\u00E0i kho\u1EA3n <strong>UIT Smart Campus</strong>.</p>\n            <p style=\"margin: 20px 0;\">\n              <span style=\"display: inline-block; padding: 12px 18px; border-radius: 12px; background: #eff6ff; color: #1d4ed8; font-size: 24px; font-weight: 700; letter-spacing: 4px;\">\n                ".concat(otp, "\n              </span>\n            </p>\n            <p>M\u00E3 OTP c\u00F3 hi\u1EC7u l\u1EF1c trong <strong>").concat(expiresInMinutes, " ph\u00FAt</strong>.</p>\n            <p>N\u1EBFu b\u1EA1n kh\u00F4ng th\u1EF1c hi\u1EC7n y\u00EAu c\u1EA7u n\u00E0y, vui l\u00F2ng b\u1ECF qua email.</p>\n          </div>\n        "),
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, true];
                        case 3:
                            error_2 = _a.sent();
                            message = error_2 instanceof Error ? error_2.message : 'Unknown mail transport error';
                            this.logger.warn("Failed to send registration OTP email: ".concat(message));
                            return [2 /*return*/, false];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        PasswordResetMailerService_1.prototype.getFromAddress = function () {
            return this.configService.get('SMTP_FROM', '').trim();
        };
        PasswordResetMailerService_1.prototype.getTransporter = function () {
            if (this.transporter !== undefined) {
                return this.transporter;
            }
            var host = this.configService.get('SMTP_HOST', '').trim();
            var port = this.configService.get('SMTP_PORT', 587);
            var user = this.configService.get('SMTP_USER', '').trim();
            var pass = this.configService.get('SMTP_PASS', '').trim();
            if (!host) {
                this.transporter = null;
                return this.transporter;
            }
            this.transporter = nodemailer_1.default.createTransport({
                host: host,
                port: port,
                secure: this.configService.get('SMTP_SECURE', port === 465),
                auth: user && pass ? { user: user, pass: pass } : undefined,
                // Keep delivery bounded below the mobile OTP request timeout.
                connectionTimeout: 5000,
                greetingTimeout: 5000,
                socketTimeout: 15000,
            });
            return this.transporter;
        };
        return PasswordResetMailerService_1;
    }());
    __setFunctionName(_classThis, "PasswordResetMailerService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PasswordResetMailerService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PasswordResetMailerService = _classThis;
}();
exports.PasswordResetMailerService = PasswordResetMailerService;
