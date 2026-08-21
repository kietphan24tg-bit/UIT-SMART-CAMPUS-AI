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
var nodemailer_1 = require("nodemailer");
var password_reset_mailer_service_1 = require("./password-reset-mailer.service");
var sendMailMock = jest.fn();
jest.mock('nodemailer', function () { return ({
    __esModule: true,
    default: {
        createTransport: jest.fn(),
    },
}); });
var mockedNodemailer = jest.mocked(nodemailer_1.default);
describe('PasswordResetMailerService', function () {
    beforeEach(function () {
        jest.clearAllMocks();
        mockedNodemailer.createTransport.mockReturnValue({
            sendMail: sendMailMock,
        });
    });
    it('uses Vietnamese copy with dấu in password reset email payload', function () { return __awaiter(void 0, void 0, void 0, function () {
        var configService, service;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    configService = {
                        get: jest.fn(function (key, defaultValue) {
                            var map = {
                                SMTP_HOST: 'smtp.test.local',
                                SMTP_PORT: 587,
                                SMTP_SECURE: false,
                                SMTP_USER: 'mailer',
                                SMTP_PASS: 'secret',
                                SMTP_FROM: 'UIT Smart Campus <noreply@uit.edu.vn>',
                            };
                            return key in map ? map[key] : defaultValue;
                        }),
                    };
                    service = new password_reset_mailer_service_1.PasswordResetMailerService(configService);
                    return [4 /*yield*/, service.sendOtpEmail('student@gm.uit.edu.vn', '123456', 10)];
                case 1:
                    _a.sent();
                    expect(mockedNodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({
                        connectionTimeout: 5000,
                        greetingTimeout: 5000,
                        socketTimeout: 15000,
                    }));
                    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
                        subject: 'UIT Smart Campus | Mã OTP đặt lại mật khẩu',
                        text: expect.stringContaining('Bạn đã yêu cầu đặt lại mật khẩu'),
                        html: expect.stringContaining('Mã OTP có hiệu lực trong'),
                    }));
                    return [2 /*return*/];
            }
        });
    }); });
    it('sends registration OTP with registration-specific copy', function () { return __awaiter(void 0, void 0, void 0, function () {
        var configService, service;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    configService = {
                        get: jest.fn(function (key, defaultValue) {
                            var map = {
                                SMTP_HOST: 'smtp.test.local',
                                SMTP_PORT: 587,
                                SMTP_SECURE: false,
                                SMTP_USER: 'mailer',
                                SMTP_PASS: 'secret',
                                SMTP_FROM: 'UIT Smart Campus <noreply@uit.edu.vn>',
                            };
                            return key in map ? map[key] : defaultValue;
                        }),
                    };
                    service = new password_reset_mailer_service_1.PasswordResetMailerService(configService);
                    return [4 /*yield*/, service.sendRegistrationOtpEmail('student@gm.uit.edu.vn', '654321', 10)];
                case 1:
                    _a.sent();
                    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
                        subject: 'UIT Smart Campus | Mã OTP xác thực đăng ký',
                        text: expect.stringContaining('Mã OTP xác thực đăng ký của bạn là: 654321'),
                        html: expect.stringContaining('Mã OTP có hiệu lực trong'),
                    }));
                    return [2 /*return*/];
            }
        });
    }); });
});
