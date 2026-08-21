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
var client_1 = require("@prisma/client");
var testing_1 = require("@nestjs/testing");
var node_crypto_1 = require("node:crypto");
var prisma_service_1 = require("../../database/prisma.service");
var payments_service_1 = require("./payments.service");
describe('PaymentsService', function () {
    var service;
    var prisma;
    var configService;
    var fetchSpy;
    var dateNowSpy;
    var momoConfig = {
        MOMO_PARTNER_CODE: 'partner-code',
        MOMO_ACCESS_KEY: 'access-key',
        MOMO_SECRET_KEY: 'secret-key',
        MOMO_REDIRECT_URL: 'http://192.168.1.7:3000/api/v1/payments/momo/return',
        MOMO_IPN_URL: 'http://192.168.1.7:3000/api/v1/payments/momo/webhook',
        SEPAY_API_TOKEN: 'sepay-token',
        SEPAY_BANK_ACCOUNT_UUID: 'bank-account-uuid',
        SEPAY_API_BASE_URL: 'https://userapi.sepay.vn/v2',
        SEPAY_BANK_NAME: 'MBBank',
        SEPAY_ACCOUNT_NUMBER: '123456789',
        SEPAY_ACCOUNT_NAME: 'SMART CAMPUS',
        SEPAY_WEBHOOK_API_KEY: 'sepay-secret',
        SEPAY_QR_BASE_URL: 'https://qr.sepay.vn/img',
    };
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var moduleRef;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma = {
                        vehicle: {
                            findUnique: jest.fn(),
                        },
                        parkingSubscription: {
                            create: jest.fn(),
                            update: jest.fn(),
                        },
                        paymentTransaction: {
                            create: jest.fn(),
                            update: jest.fn(),
                            findUnique: jest.fn(),
                            findFirst: jest.fn(),
                        },
                        paymentWebhookEvent: {
                            create: jest.fn(),
                        },
                        $transaction: jest.fn(function (operations) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, Promise.all(operations)];
                        }); }); }),
                    };
                    configService = {
                        get: jest.fn(function (key) { var _a; return (_a = momoConfig[key]) !== null && _a !== void 0 ? _a : undefined; }),
                    };
                    return [4 /*yield*/, testing_1.Test.createTestingModule({
                            providers: [
                                payments_service_1.PaymentsService,
                                { provide: prisma_service_1.PrismaService, useValue: prisma },
                                { provide: config_1.ConfigService, useValue: configService },
                            ],
                        }).compile()];
                case 1:
                    moduleRef = _a.sent();
                    service = moduleRef.get(payments_service_1.PaymentsService);
                    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1730000000000);
                    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
                        ok: true,
                        json: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, ({ resultCode: 0, payUrl: 'https://momo.test/checkout' })];
                        }); }); },
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () {
        fetchSpy.mockRestore();
        dateNowSpy.mockRestore();
    });
    it('creates a sandbox checkout and signs the MoMo payload', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, _a, requestUrl, requestInit, payload, requestId, orderId, orderInfo, rawSignature;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    prisma.vehicle.findUnique.mockResolvedValue({
                        id: 'veh12345',
                        userId: 'user-1',
                        plateNumber: '51F-123.45',
                        subscription: {
                            id: 'sub-1',
                            monthlyFee: 50000,
                            status: 'inactive',
                            startDate: null,
                            endDate: null,
                            lastPaymentAt: null,
                        },
                    });
                    prisma.paymentTransaction.create.mockImplementation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                        var data = _b.data;
                        return __generator(this, function (_c) {
                            return [2 /*return*/, ({
                                    id: 'payment-1',
                                    subscriptionId: data.subscriptionId,
                                    providerOrderId: data.providerOrderId,
                                    requestId: data.requestId,
                                    amount: data.amount,
                                })];
                        });
                    }); });
                    prisma.paymentTransaction.update.mockResolvedValue({});
                    return [4 /*yield*/, service.createMomoPayment('user-1', 'veh12345')];
                case 1:
                    result = _b.sent();
                    expect(result).toEqual({
                        transactionId: 'payment-1',
                        provider: 'momo',
                        mode: 'sandbox',
                        amount: 50000,
                        orderId: 'MOMO-1730000000000-veh12345',
                        checkoutUrl: 'https://momo.test/checkout',
                    });
                    expect(fetchSpy).toHaveBeenCalledTimes(1);
                    _a = fetchSpy.mock.calls[0], requestUrl = _a[0], requestInit = _a[1];
                    expect(requestUrl).toBe('https://test-payment.momo.vn/v2/gateway/api/create');
                    payload = JSON.parse(String(requestInit.body));
                    requestId = 'REQ-1730000000000-veh12345';
                    orderId = 'MOMO-1730000000000-veh12345';
                    orderInfo = 'Thanh toán gửi xe tháng cho 51F-123.45';
                    rawSignature = [
                        "accessKey=".concat(momoConfig.MOMO_ACCESS_KEY),
                        'amount=50000',
                        'extraData=',
                        "ipnUrl=".concat(momoConfig.MOMO_IPN_URL),
                        "orderId=".concat(orderId),
                        "orderInfo=".concat(orderInfo),
                        "partnerCode=".concat(momoConfig.MOMO_PARTNER_CODE),
                        "redirectUrl=".concat(momoConfig.MOMO_REDIRECT_URL),
                        "requestId=".concat(requestId),
                        'requestType=captureWallet',
                    ].join('&');
                    expect(payload).toMatchObject({
                        partnerCode: momoConfig.MOMO_PARTNER_CODE,
                        requestId: requestId,
                        amount: '50000',
                        orderId: orderId,
                        orderInfo: orderInfo,
                        redirectUrl: momoConfig.MOMO_REDIRECT_URL,
                        ipnUrl: momoConfig.MOMO_IPN_URL,
                        lang: 'vi',
                        requestType: 'captureWallet',
                        autoCapture: true,
                        extraData: '',
                    });
                    expect(payload.signature).toBe((0, node_crypto_1.createHmac)('sha256', momoConfig.MOMO_SECRET_KEY).update(rawSignature).digest('hex'));
                    expect(prisma.paymentTransaction.update).toHaveBeenCalledWith(expect.objectContaining({
                        where: { id: 'payment-1' },
                        data: expect.objectContaining({
                            checkoutUrl: 'https://momo.test/checkout',
                        }),
                    }));
                    return [2 /*return*/];
            }
        });
    }); });
    it('fails fast when MoMo config is missing', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    configService.get.mockImplementation(function () { return ''; });
                    prisma.vehicle.findUnique.mockResolvedValue({
                        id: 'veh12345',
                        userId: 'user-1',
                        plateNumber: '51F-123.45',
                        subscription: {
                            id: 'sub-1',
                            monthlyFee: 50000,
                            status: 'inactive',
                            startDate: null,
                            endDate: null,
                            lastPaymentAt: null,
                        },
                    });
                    return [4 /*yield*/, expect(service.createMomoPayment('user-1', 'veh12345')).rejects.toBeInstanceOf(common_1.InternalServerErrorException)];
                case 1:
                    _a.sent();
                    expect(prisma.paymentTransaction.create).not.toHaveBeenCalled();
                    expect(fetchSpy).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('creates a SePay QR checkout URL without calling the SePay order API', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.vehicle.findUnique.mockResolvedValue({
                        id: 'veh12345',
                        userId: 'user-1',
                        plateNumber: '51F-123.45',
                        subscription: {
                            id: 'sub-1',
                            monthlyFee: 50000,
                            status: 'inactive',
                            startDate: null,
                            endDate: null,
                            lastPaymentAt: null,
                        },
                    });
                    prisma.paymentTransaction.create.mockImplementation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                        var data = _b.data;
                        return __generator(this, function (_c) {
                            return [2 /*return*/, (__assign({ id: 'payment-1' }, data))];
                        });
                    }); });
                    prisma.paymentTransaction.update.mockResolvedValue({});
                    return [4 /*yield*/, service.createSepayPayment('user-1', 'veh12345')];
                case 1:
                    result = _a.sent();
                    expect(result).toEqual({
                        transactionId: 'payment-1',
                        provider: 'sepay',
                        mode: 'qr',
                        amount: 50000,
                        orderId: 'SEPAYPARKING1730000000000veh12345',
                        checkoutUrl: 'https://qr.sepay.vn/img?acc=123456789&bank=MBBank&amount=50000&des=SEPAYPARKING1730000000000veh12345',
                        bankName: 'MBBank',
                        accountNumber: '123456789',
                        accountName: 'SMART CAMPUS',
                        transferDescription: 'SEPAYPARKING1730000000000veh12345',
                    });
                    expect(fetchSpy).not.toHaveBeenCalled();
                    expect(prisma.paymentTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
                        data: expect.objectContaining({
                            provider: 'sepay',
                            providerOrderId: 'SEPAYPARKING1730000000000veh12345',
                        }),
                    }));
                    expect(prisma.paymentTransaction.update).toHaveBeenCalledWith(expect.objectContaining({
                        where: { id: 'payment-1' },
                        data: expect.objectContaining({
                            checkoutUrl: 'https://qr.sepay.vn/img?acc=123456789&bank=MBBank&amount=50000&des=SEPAYPARKING1730000000000veh12345',
                        }),
                    }));
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects payment creation for a vehicle that belongs to another user', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.vehicle.findUnique.mockResolvedValue({
                        id: 'veh12345',
                        userId: 'user-2',
                        plateNumber: '51F-123.45',
                        subscription: {
                            id: 'sub-1',
                            monthlyFee: 50000,
                            status: 'inactive',
                            startDate: null,
                            endDate: null,
                            lastPaymentAt: null,
                        },
                    });
                    return [4 /*yield*/, expect(service.createMomoPayment('user-1', 'veh12345')).rejects.toBeInstanceOf(common_1.ForbiddenException)];
                case 1:
                    _a.sent();
                    expect(prisma.paymentTransaction.create).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('marks a webhook as paid and renews the subscription', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.paymentTransaction.findUnique.mockResolvedValue({
                        id: 'payment-1',
                        status: 'pending',
                        providerOrderId: 'ORDER-1',
                        requestId: 'REQ-1',
                        amount: 50000,
                        subscriptionId: 'sub-1',
                        subscription: {
                            startDate: new Date('2026-04-01T00:00:00.000Z'),
                            endDate: new Date('2026-05-01T00:00:00.000Z'),
                        },
                    });
                    prisma.paymentTransaction.update.mockResolvedValue({});
                    prisma.parkingSubscription.update.mockResolvedValue({});
                    return [4 /*yield*/, service.handleMomoWebhook({
                            orderId: 'ORDER-1',
                            resultCode: 0,
                            message: 'success',
                        })];
                case 1:
                    result = _a.sent();
                    expect(result).toEqual({
                        acknowledged: true,
                        status: 'paid',
                        transactionId: 'payment-1',
                    });
                    expect(prisma.paymentTransaction.update).toHaveBeenCalledWith(expect.objectContaining({
                        where: { id: 'payment-1' },
                        data: expect.objectContaining({ status: 'paid' }),
                    }));
                    expect(prisma.parkingSubscription.update).toHaveBeenCalledWith(expect.objectContaining({
                        where: { id: 'sub-1' },
                        data: expect.objectContaining({ status: 'active' }),
                    }));
                    return [2 /*return*/];
            }
        });
    }); });
    it('marks a webhook as failed when MoMo returns a non-zero result code', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.paymentTransaction.findUnique.mockResolvedValue({
                        id: 'payment-1',
                        status: 'pending',
                        providerOrderId: 'ORDER-1',
                        requestId: 'REQ-1',
                        amount: 50000,
                        subscriptionId: 'sub-1',
                        subscription: {
                            startDate: null,
                            endDate: null,
                        },
                    });
                    prisma.paymentTransaction.update.mockResolvedValue({});
                    return [4 /*yield*/, service.handleMomoWebhook({
                            requestId: 'ORDER-1',
                            resultCode: 1,
                            message: 'failed',
                        })];
                case 1:
                    result = _a.sent();
                    expect(result).toEqual({
                        acknowledged: true,
                        status: 'failed',
                        transactionId: 'payment-1',
                    });
                    expect(prisma.paymentTransaction.update).toHaveBeenCalledWith(expect.objectContaining({
                        where: { id: 'payment-1' },
                        data: expect.objectContaining({ status: 'failed' }),
                    }));
                    expect(prisma.parkingSubscription.update).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('returns early for an already paid transaction', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.paymentTransaction.findUnique.mockResolvedValue({
                        id: 'payment-1',
                        status: 'paid',
                        providerOrderId: 'ORDER-1',
                        requestId: 'REQ-1',
                        amount: 50000,
                        subscriptionId: 'sub-1',
                        subscription: {
                            startDate: null,
                            endDate: null,
                        },
                    });
                    return [4 /*yield*/, service.handleMomoWebhook({
                            orderId: 'ORDER-1',
                            resultCode: 0,
                        })];
                case 1:
                    result = _a.sent();
                    expect(result).toEqual({
                        acknowledged: true,
                        status: 'paid',
                        transactionId: 'payment-1',
                    });
                    expect(prisma.paymentTransaction.update).not.toHaveBeenCalled();
                    expect(prisma.parkingSubscription.update).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('records SePay webhook events before marking a transaction paid', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.paymentWebhookEvent.create.mockResolvedValue({});
                    prisma.paymentTransaction.findUnique.mockResolvedValue({
                        id: 'payment-1',
                        status: 'pending',
                        providerOrderId: 'SEPAYPARKING1730000000000veh12345',
                        requestId: 'SEPAYPARKING1730000000000veh12345',
                        amount: 50000,
                        subscriptionId: 'sub-1',
                        subscription: {
                            startDate: null,
                            endDate: null,
                        },
                    });
                    prisma.paymentTransaction.update.mockResolvedValue({});
                    prisma.parkingSubscription.update.mockResolvedValue({});
                    return [4 /*yield*/, service.handleSepayWebhook({
                            id: 92704,
                            code: 'SEPAYPARKING1730000000000veh12345',
                            transferType: 'in',
                            transferAmount: 50000,
                        }, 'Apikey sepay-secret')];
                case 1:
                    result = _a.sent();
                    expect(result).toEqual({
                        success: true,
                        status: 'paid',
                        transactionId: 'payment-1',
                    });
                    expect(prisma.paymentWebhookEvent.create).toHaveBeenCalledWith({
                        data: {
                            provider: 'sepay',
                            providerEventId: '92704',
                            providerOrderId: 'SEPAYPARKING1730000000000veh12345',
                            payload: {
                                id: 92704,
                                code: 'SEPAYPARKING1730000000000veh12345',
                                transferType: 'in',
                                transferAmount: 50000,
                            },
                        },
                    });
                    expect(prisma.paymentTransaction.update).toHaveBeenCalledWith(expect.objectContaining({
                        where: { id: 'payment-1' },
                        data: expect.objectContaining({ status: 'paid' }),
                    }));
                    return [2 /*return*/];
            }
        });
    }); });
    it('falls back to transfer content when SePay webhook code is null', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.paymentWebhookEvent.create.mockResolvedValue({});
                    prisma.paymentTransaction.findUnique.mockResolvedValue({
                        id: 'payment-1',
                        status: 'pending',
                        providerOrderId: 'SEPAYPARKING1730000000000veh12345',
                        requestId: 'SEPAYPARKING1730000000000veh12345',
                        amount: 50000,
                        subscriptionId: 'sub-1',
                        subscription: {
                            startDate: null,
                            endDate: null,
                        },
                    });
                    prisma.paymentTransaction.update.mockResolvedValue({});
                    prisma.parkingSubscription.update.mockResolvedValue({});
                    return [4 /*yield*/, service.handleSepayWebhook({
                            id: 92705,
                            code: null,
                            content: 'Thanh toan don SEPAYPARKING1730000000000veh12345',
                            transferType: 'in',
                            transferAmount: 50000,
                        }, 'Apikey sepay-secret')];
                case 1:
                    result = _a.sent();
                    expect(result).toEqual({
                        success: true,
                        status: 'paid',
                        transactionId: 'payment-1',
                    });
                    expect(prisma.paymentWebhookEvent.create).toHaveBeenCalledWith({
                        data: {
                            provider: 'sepay',
                            providerEventId: '92705',
                            providerOrderId: 'SEPAYPARKING1730000000000veh12345',
                            payload: {
                                id: 92705,
                                code: null,
                                content: 'Thanh toan don SEPAYPARKING1730000000000veh12345',
                                transferType: 'in',
                                transferAmount: 50000,
                            },
                        },
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('returns success without processing duplicate SePay webhook events', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.paymentWebhookEvent.create.mockRejectedValue(new client_1.Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
                        code: 'P2002',
                        clientVersion: '6.1.0',
                    }));
                    return [4 /*yield*/, service.handleSepayWebhook({
                            id: 92704,
                            code: 'SEPAYPARKING1730000000000veh12345',
                            transferType: 'in',
                            transferAmount: 50000,
                        }, 'Apikey sepay-secret')];
                case 1:
                    result = _a.sent();
                    expect(result).toEqual({ success: true, duplicate: true });
                    expect(prisma.paymentTransaction.findUnique).not.toHaveBeenCalled();
                    expect(prisma.paymentTransaction.update).not.toHaveBeenCalled();
                    expect(prisma.parkingSubscription.update).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
});
