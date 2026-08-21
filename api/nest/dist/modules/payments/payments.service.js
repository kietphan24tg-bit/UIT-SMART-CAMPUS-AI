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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
var node_crypto_1 = require("node:crypto");
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var MONTHLY_FEE_VND = 40000;
var MOMO_SANDBOX_ENDPOINT = 'https://test-payment.momo.vn/v2/gateway/api/create';
var SEPAY_DEFAULT_API_BASE_URL = 'https://userapi.sepay.vn/v2';
var SEPAY_DEFAULT_QR_BASE_URL = 'https://qr.sepay.vn/img';
function resolveMonthlyFee(value) {
    return typeof value === 'number' && value > 0 ? value : MONTHLY_FEE_VND;
}
var PaymentsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var PaymentsService = _classThis = /** @class */ (function () {
        function PaymentsService_1(prisma, configService) {
            this.prisma = prisma;
            this.configService = configService;
        }
        PaymentsService_1.prototype.createMomoPayment = function (userId, vehicleId) {
            return __awaiter(this, void 0, void 0, function () {
                var vehicle, momoConfig, subscription, _a, amount, now, orderId, requestId, transaction, checkout;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.prisma.vehicle.findUnique({
                                where: { id: vehicleId },
                                include: { subscription: true },
                            })];
                        case 1:
                            vehicle = _c.sent();
                            if (!vehicle) {
                                throw new common_1.NotFoundException('Không tìm thấy xe');
                            }
                            if (vehicle.userId !== userId) {
                                throw new common_1.ForbiddenException('Bạn không có quyền thanh toán cho xe này');
                            }
                            momoConfig = this.getMomoConfigOrThrow();
                            if (!((_b = vehicle.subscription) !== null && _b !== void 0)) return [3 /*break*/, 2];
                            _a = _b;
                            return [3 /*break*/, 4];
                        case 2: return [4 /*yield*/, this.prisma.parkingSubscription.create({
                                data: {
                                    vehicleId: vehicle.id,
                                    monthlyFee: MONTHLY_FEE_VND,
                                    status: 'inactive',
                                },
                            })];
                        case 3:
                            _a = (_c.sent());
                            _c.label = 4;
                        case 4:
                            subscription = _a;
                            amount = resolveMonthlyFee(subscription.monthlyFee);
                            now = Date.now();
                            orderId = "MOMO-".concat(now, "-").concat(vehicle.id.slice(0, 8));
                            requestId = "REQ-".concat(now, "-").concat(vehicle.id.slice(0, 8));
                            return [4 /*yield*/, this.prisma.paymentTransaction.create({
                                    data: {
                                        vehicleId: vehicle.id,
                                        subscriptionId: subscription.id,
                                        provider: 'momo',
                                        providerOrderId: orderId,
                                        requestId: requestId,
                                        amount: amount,
                                        status: 'pending',
                                        requestPayload: {
                                            orderId: orderId,
                                            requestId: requestId,
                                            vehicleId: vehicle.id,
                                            plateNumber: vehicle.plateNumber,
                                        },
                                    },
                                })];
                        case 5:
                            transaction = _c.sent();
                            return [4 /*yield*/, this.createSandboxCheckout(vehicle.plateNumber, transaction, momoConfig)];
                        case 6:
                            checkout = _c.sent();
                            return [4 /*yield*/, this.prisma.paymentTransaction.update({
                                    where: { id: transaction.id },
                                    data: {
                                        checkoutUrl: checkout.checkoutUrl,
                                        requestPayload: {
                                            orderId: orderId,
                                            requestId: requestId,
                                            vehicleId: vehicle.id,
                                            plateNumber: vehicle.plateNumber,
                                            mode: checkout.mode,
                                        },
                                    },
                                })];
                        case 7:
                            _c.sent();
                            return [2 /*return*/, checkout];
                    }
                });
            });
        };
        PaymentsService_1.prototype.createSepayPayment = function (userId, vehicleId) {
            return __awaiter(this, void 0, void 0, function () {
                var vehicle, sepayConfig, subscription, _a, amount, now, orderId, checkoutUrl, transaction;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.prisma.vehicle.findUnique({
                                where: { id: vehicleId },
                                include: { subscription: true },
                            })];
                        case 1:
                            vehicle = _c.sent();
                            if (!vehicle) {
                                throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y xe');
                            }
                            if (vehicle.userId !== userId) {
                                throw new common_1.ForbiddenException('Báº¡n khÃ´ng cÃ³ quyá»n thanh toÃ¡n cho xe nÃ y');
                            }
                            sepayConfig = this.getSepayConfigOrThrow();
                            if (!((_b = vehicle.subscription) !== null && _b !== void 0)) return [3 /*break*/, 2];
                            _a = _b;
                            return [3 /*break*/, 4];
                        case 2: return [4 /*yield*/, this.prisma.parkingSubscription.create({
                                data: {
                                    vehicleId: vehicle.id,
                                    monthlyFee: MONTHLY_FEE_VND,
                                    status: 'inactive',
                                },
                            })];
                        case 3:
                            _a = (_c.sent());
                            _c.label = 4;
                        case 4:
                            subscription = _a;
                            amount = resolveMonthlyFee(subscription.monthlyFee);
                            now = Date.now();
                            orderId = "SEPAYPARKING".concat(now).concat(vehicle.id.slice(0, 8).replace(/[^a-zA-Z0-9]/g, ''));
                            checkoutUrl = this.buildSepayCheckoutUrl(sepayConfig, amount, orderId);
                            return [4 /*yield*/, this.prisma.paymentTransaction.create({
                                    data: {
                                        vehicleId: vehicle.id,
                                        subscriptionId: subscription.id,
                                        provider: 'sepay',
                                        providerOrderId: orderId,
                                        requestId: orderId,
                                        amount: amount,
                                        status: 'pending',
                                        requestPayload: {
                                            orderId: orderId,
                                            vehicleId: vehicle.id,
                                            plateNumber: vehicle.plateNumber,
                                            bankName: sepayConfig.bankName,
                                            accountNumber: sepayConfig.accountNumber,
                                            transferDescription: orderId,
                                        },
                                    },
                                })];
                        case 5:
                            transaction = _c.sent();
                            return [4 /*yield*/, this.prisma.paymentTransaction.update({
                                    where: { id: transaction.id },
                                    data: {
                                        checkoutUrl: checkoutUrl,
                                        responsePayload: this.asJson({
                                            checkoutUrl: checkoutUrl,
                                            bankName: sepayConfig.bankName,
                                            accountNumber: sepayConfig.accountNumber,
                                            accountName: sepayConfig.accountName,
                                            transferDescription: orderId,
                                            generatedAt: new Date().toISOString(),
                                        }),
                                    },
                                })];
                        case 6:
                            _c.sent();
                            return [2 /*return*/, {
                                    transactionId: transaction.id,
                                    provider: 'sepay',
                                    mode: 'qr',
                                    amount: amount,
                                    orderId: orderId,
                                    checkoutUrl: checkoutUrl,
                                    bankName: sepayConfig.bankName,
                                    accountNumber: sepayConfig.accountNumber,
                                    accountName: sepayConfig.accountName,
                                    transferDescription: orderId,
                                }];
                    }
                });
            });
        };
        PaymentsService_1.prototype.handleMomoWebhook = function (payload) {
            return __awaiter(this, void 0, void 0, function () {
                var orderId, transaction, _a, resultCode;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            orderId = String(payload.orderId || payload.requestId || '');
                            if (!orderId) {
                                throw new common_1.NotFoundException('Webhook không có orderId');
                            }
                            return [4 /*yield*/, this.prisma.paymentTransaction.findUnique({
                                    where: { providerOrderId: orderId },
                                })];
                        case 1:
                            if (!((_b = (_d.sent())) !== null && _b !== void 0)) return [3 /*break*/, 2];
                            _a = _b;
                            return [3 /*break*/, 4];
                        case 2: return [4 /*yield*/, this.prisma.paymentTransaction.findFirst({
                                where: { requestId: orderId },
                            })];
                        case 3:
                            _a = (_d.sent());
                            _d.label = 4;
                        case 4:
                            transaction = _a;
                            if (!transaction) {
                                throw new common_1.NotFoundException('Không tìm thấy giao dịch');
                            }
                            if (transaction.status === 'paid') {
                                return [2 /*return*/, {
                                        acknowledged: true,
                                        status: transaction.status,
                                        transactionId: transaction.id,
                                    }];
                            }
                            resultCode = Number((_c = payload.resultCode) !== null && _c !== void 0 ? _c : -1);
                            if (!(resultCode === 0)) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.markTransactionPaid(transaction.id, payload)];
                        case 5:
                            _d.sent();
                            return [2 /*return*/, {
                                    acknowledged: true,
                                    status: 'paid',
                                    transactionId: transaction.id,
                                }];
                        case 6: return [4 /*yield*/, this.prisma.paymentTransaction.update({
                                where: { id: transaction.id },
                                data: {
                                    status: 'failed',
                                    responsePayload: this.asJson(payload),
                                },
                            })];
                        case 7:
                            _d.sent();
                            return [2 /*return*/, {
                                    acknowledged: true,
                                    status: 'failed',
                                    transactionId: transaction.id,
                                }];
                    }
                });
            });
        };
        PaymentsService_1.prototype.handleSepayWebhook = function (payload, authorization) {
            return __awaiter(this, void 0, void 0, function () {
                var orderCode, transferType, transferAmount, eventId, isNewEvent;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            this.assertSepayWebhookAuthorization(authorization);
                            orderCode = this.resolveSepayOrderCode(payload);
                            transferType = String(payload.transferType || '').trim().toLowerCase();
                            transferAmount = Number((_a = payload.transferAmount) !== null && _a !== void 0 ? _a : 0);
                            eventId = this.resolveSepayWebhookEventId(payload);
                            if (!orderCode) {
                                throw new common_1.BadRequestException('Webhook SePay thiáº¿u mÃ£ giao dá»‹ch');
                            }
                            if (!eventId) {
                                throw new common_1.BadRequestException('Webhook SePay thiáº¿u mÃ£ idempotency');
                            }
                            if (transferType !== 'in') {
                                return [2 /*return*/, { success: true, ignored: true }];
                            }
                            if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
                                throw new common_1.BadRequestException('Webhook SePay cÃ³ sá»‘ tiá»n khÃ´ng há»£p lá»‡');
                            }
                            return [4 /*yield*/, this.recordSepayWebhookEvent(eventId, orderCode, payload)];
                        case 1:
                            isNewEvent = _b.sent();
                            if (!isNewEvent) {
                                return [2 /*return*/, { success: true, duplicate: true }];
                            }
                            if (orderCode.startsWith('SEPAYPARKING')) {
                                return [2 /*return*/, this.handleSepayParkingWebhook(orderCode, transferAmount, payload)];
                            }
                            if (orderCode.startsWith('SEPAYCANTEEN')) {
                                return [2 /*return*/, this.handleSepayCanteenWebhook(orderCode, transferAmount, payload)];
                            }
                            throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y giao dá»‹ch SePay');
                    }
                });
            });
        };
        PaymentsService_1.prototype.createSandboxCheckout = function (plateNumber, transaction, momoConfig) {
            return __awaiter(this, void 0, void 0, function () {
                var requestType, requestId, extraData, orderInfo, rawSignature, signature, requestPayload, response, responseData, checkoutUrl;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            requestType = 'captureWallet';
                            requestId = transaction.requestId || transaction.providerOrderId;
                            extraData = '';
                            orderInfo = "Thanh to\u00E1n g\u1EEDi xe th\u00E1ng cho ".concat(plateNumber);
                            rawSignature = [
                                "accessKey=".concat(momoConfig.accessKey),
                                "amount=".concat(transaction.amount),
                                "extraData=".concat(extraData),
                                "ipnUrl=".concat(momoConfig.ipnUrl),
                                "orderId=".concat(transaction.providerOrderId),
                                "orderInfo=".concat(orderInfo),
                                "partnerCode=".concat(momoConfig.partnerCode),
                                "redirectUrl=".concat(momoConfig.redirectUrl),
                                "requestId=".concat(requestId),
                                "requestType=".concat(requestType),
                            ].join('&');
                            signature = (0, node_crypto_1.createHmac)('sha256', momoConfig.secretKey).update(rawSignature).digest('hex');
                            requestPayload = {
                                partnerCode: momoConfig.partnerCode,
                                requestId: requestId,
                                amount: String(transaction.amount),
                                orderId: transaction.providerOrderId,
                                orderInfo: orderInfo,
                                redirectUrl: momoConfig.redirectUrl,
                                ipnUrl: momoConfig.ipnUrl,
                                lang: 'vi',
                                requestType: requestType,
                                autoCapture: true,
                                extraData: extraData,
                                signature: signature,
                            };
                            return [4 /*yield*/, fetch(MOMO_SANDBOX_ENDPOINT, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(requestPayload),
                                })];
                        case 1:
                            response = _b.sent();
                            return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                        case 2:
                            responseData = (_b.sent());
                            checkoutUrl = String(responseData.payUrl || responseData.deeplink || '');
                            if (!(!response.ok || Number((_a = responseData.resultCode) !== null && _a !== void 0 ? _a : -1) !== 0 || !checkoutUrl)) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.prisma.paymentTransaction.update({
                                    where: { id: transaction.id },
                                    data: {
                                        status: 'failed',
                                        responsePayload: this.asJson(responseData),
                                    },
                                })];
                        case 3:
                            _b.sent();
                            throw new common_1.InternalServerErrorException(String(responseData.message || 'Không tạo được link thanh toán MoMo'));
                        case 4: return [2 /*return*/, {
                                transactionId: transaction.id,
                                provider: 'momo',
                                mode: 'sandbox',
                                amount: transaction.amount,
                                orderId: transaction.providerOrderId,
                                checkoutUrl: checkoutUrl,
                            }];
                    }
                });
            });
        };
        PaymentsService_1.prototype.markTransactionPaid = function (transactionId, responsePayload) {
            return __awaiter(this, void 0, void 0, function () {
                var transaction, now, currentEndDate, renewalBase, nextEndDate;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.prisma.paymentTransaction.findUnique({
                                where: { id: transactionId },
                                include: { subscription: true },
                            })];
                        case 1:
                            transaction = _c.sent();
                            if (!transaction) {
                                throw new common_1.NotFoundException('Không tìm thấy giao dịch');
                            }
                            if (!transaction.subscriptionId) {
                                throw new common_1.NotFoundException('Giao dịch chưa được liên kết với gói gửi xe');
                            }
                            now = new Date();
                            currentEndDate = (_a = transaction.subscription) === null || _a === void 0 ? void 0 : _a.endDate;
                            renewalBase = currentEndDate && currentEndDate > now ? currentEndDate : now;
                            nextEndDate = new Date(renewalBase.getTime() + 30 * 24 * 60 * 60 * 1000);
                            return [4 /*yield*/, this.prisma.$transaction([
                                    this.prisma.paymentTransaction.update({
                                        where: { id: transaction.id },
                                        data: {
                                            status: 'paid',
                                            paidAt: now,
                                            responsePayload: this.asJson(responsePayload),
                                        },
                                    }),
                                    this.prisma.parkingSubscription.update({
                                        where: { id: transaction.subscriptionId },
                                        data: {
                                            status: 'active',
                                            monthlyFee: transaction.amount,
                                            startDate: ((_b = transaction.subscription) === null || _b === void 0 ? void 0 : _b.endDate) &&
                                                transaction.subscription.endDate > now &&
                                                transaction.subscription.startDate
                                                ? transaction.subscription.startDate
                                                : now,
                                            endDate: nextEndDate,
                                            lastPaymentAt: now,
                                        },
                                    }),
                                ])];
                        case 2:
                            _c.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        PaymentsService_1.prototype.handleSepayParkingWebhook = function (orderCode, transferAmount, payload) {
            return __awaiter(this, void 0, void 0, function () {
                var transaction;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.paymentTransaction.findUnique({
                                where: { providerOrderId: orderCode },
                            })];
                        case 1:
                            transaction = _a.sent();
                            if (!transaction) {
                                throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y giao dá»‹ch SePay parking');
                            }
                            if (transaction.status === 'paid') {
                                return [2 /*return*/, { success: true, status: transaction.status, transactionId: transaction.id }];
                            }
                            if (!(transferAmount < transaction.amount)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.prisma.paymentTransaction.update({
                                    where: { id: transaction.id },
                                    data: {
                                        status: 'failed',
                                        responsePayload: this.asJson(payload),
                                    },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { success: true, status: 'failed', transactionId: transaction.id }];
                        case 3: return [4 /*yield*/, this.markTransactionPaid(transaction.id, payload)];
                        case 4:
                            _a.sent();
                            return [2 /*return*/, { success: true, status: 'paid', transactionId: transaction.id }];
                    }
                });
            });
        };
        PaymentsService_1.prototype.handleSepayCanteenWebhook = function (orderCode, transferAmount, payload) {
            return __awaiter(this, void 0, void 0, function () {
                var transaction, updated, _a, _b;
                var _this = this;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.prisma.canteenPaymentTransaction.findUnique({
                                where: { providerOrderId: orderCode },
                            })];
                        case 1:
                            transaction = _c.sent();
                            if (!transaction) {
                                throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y giao dá»‹ch SePay canteen');
                            }
                            if (transaction.status === 'paid') {
                                return [2 /*return*/, { success: true, status: transaction.status, transactionId: transaction.id }];
                            }
                            if (!(transferAmount < transaction.amount)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.prisma.$transaction([
                                    this.prisma.canteenPaymentTransaction.update({
                                        where: { id: transaction.id },
                                        data: {
                                            status: 'failed',
                                            responsePayload: this.asJson(payload),
                                        },
                                    }),
                                    this.prisma.canteenOrder.update({
                                        where: { id: transaction.orderId },
                                        data: { status: client_1.CanteenOrderStatus.payment_failed },
                                    }),
                                ])];
                        case 2:
                            _c.sent();
                            return [2 /*return*/, { success: true, status: 'failed', transactionId: transaction.id }];
                        case 3: return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                var paidTx, paidOrder;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, tx.canteenPaymentTransaction.update({
                                                where: { id: transaction.id },
                                                data: {
                                                    status: 'paid',
                                                    paidAt: new Date(),
                                                    responsePayload: this.asJson(payload),
                                                },
                                            })];
                                        case 1:
                                            paidTx = _a.sent();
                                            return [4 /*yield*/, tx.canteenOrder.update({
                                                    where: { id: transaction.orderId },
                                                    data: { status: client_1.CanteenOrderStatus.paid },
                                                    include: {
                                                        createdBy: {
                                                            select: { id: true },
                                                        },
                                                    },
                                                })];
                                        case 2:
                                            paidOrder = _a.sent();
                                            return [2 /*return*/, { paidTx: paidTx, paidOrder: paidOrder }];
                                    }
                                });
                            }); })];
                        case 4:
                            updated = _c.sent();
                            _a = this.notifyCanteenOrder;
                            _b = [[updated.paidOrder.createdBy.id]];
                            return [4 /*yield*/, this.getCanteenAdminUserIds()];
                        case 5: return [4 /*yield*/, _a.apply(this, [__spreadArray.apply(void 0, _b.concat([(_c.sent()), true])), 'canteen',
                                'ÄÆ¡n canteen Ä‘Ã£ thanh toÃ¡n',
                                'Thanh toÃ¡n Ä‘Æ¡n hÃ ng canteen thÃ nh cÃ´ng.',
                                { orderId: updated.paidOrder.id, status: client_1.CanteenOrderStatus.paid }])];
                        case 6:
                            _c.sent();
                            return [2 /*return*/, { success: true, status: 'paid', transactionId: updated.paidTx.id }];
                    }
                });
            });
        };
        PaymentsService_1.prototype.getMomoConfigOrThrow = function () {
            var _a, _b, _c, _d, _e;
            var partnerCode = (_a = this.configService.get('MOMO_PARTNER_CODE')) === null || _a === void 0 ? void 0 : _a.trim();
            var accessKey = (_b = this.configService.get('MOMO_ACCESS_KEY')) === null || _b === void 0 ? void 0 : _b.trim();
            var secretKey = (_c = this.configService.get('MOMO_SECRET_KEY')) === null || _c === void 0 ? void 0 : _c.trim();
            var redirectUrl = (_d = this.configService.get('MOMO_REDIRECT_URL')) === null || _d === void 0 ? void 0 : _d.trim();
            var ipnUrl = (_e = this.configService.get('MOMO_IPN_URL')) === null || _e === void 0 ? void 0 : _e.trim();
            if (!partnerCode || !accessKey || !secretKey || !redirectUrl || !ipnUrl) {
                throw new common_1.InternalServerErrorException('Cấu hình MoMo chưa đầy đủ. Hãy kiểm tra các biến MOMO_* trên backend.');
            }
            return {
                partnerCode: partnerCode,
                accessKey: accessKey,
                secretKey: secretKey,
                redirectUrl: redirectUrl,
                ipnUrl: ipnUrl,
            };
        };
        PaymentsService_1.prototype.getSepayConfigOrThrow = function () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            var apiToken = (_a = this.configService.get('SEPAY_API_TOKEN')) === null || _a === void 0 ? void 0 : _a.trim();
            var bankAccountUuid = (_b = this.configService.get('SEPAY_BANK_ACCOUNT_UUID')) === null || _b === void 0 ? void 0 : _b.trim();
            var bankName = (_c = this.configService.get('SEPAY_BANK_NAME')) === null || _c === void 0 ? void 0 : _c.trim();
            var accountNumber = (_d = this.configService.get('SEPAY_ACCOUNT_NUMBER')) === null || _d === void 0 ? void 0 : _d.trim();
            var accountName = ((_e = this.configService.get('SEPAY_ACCOUNT_NAME')) === null || _e === void 0 ? void 0 : _e.trim()) || '';
            var webhookApiKey = ((_f = this.configService.get('SEPAY_WEBHOOK_API_KEY')) === null || _f === void 0 ? void 0 : _f.trim()) || apiToken || '';
            var apiBaseUrl = ((_g = this.configService.get('SEPAY_API_BASE_URL')) === null || _g === void 0 ? void 0 : _g.trim()) || SEPAY_DEFAULT_API_BASE_URL;
            var vaPrefix = ((_h = this.configService.get('SEPAY_VA_PREFIX')) === null || _h === void 0 ? void 0 : _h.trim()) || '';
            var qrBaseUrl = ((_j = this.configService.get('SEPAY_QR_BASE_URL')) === null || _j === void 0 ? void 0 : _j.trim()) || SEPAY_DEFAULT_QR_BASE_URL;
            if (!bankName || !accountNumber || !webhookApiKey) {
                throw new common_1.InternalServerErrorException('Cấu hình SePay chưa đầy đủ. Hãy kiểm tra SEPAY_BANK_NAME, SEPAY_ACCOUNT_NUMBER và SEPAY_WEBHOOK_API_KEY trên backend.');
            }
            return {
                apiToken: apiToken || '',
                bankAccountUuid: bankAccountUuid || '',
                bankName: bankName,
                accountNumber: accountNumber,
                accountName: accountName,
                webhookApiKey: webhookApiKey,
                apiBaseUrl: apiBaseUrl,
                vaPrefix: vaPrefix,
                qrBaseUrl: qrBaseUrl,
            };
        };
        PaymentsService_1.prototype.buildSepayCheckoutUrl = function (config, amount, transferDescription) {
            var params = new URLSearchParams({
                acc: config.accountNumber,
                bank: config.bankName,
                amount: String(amount),
                des: transferDescription,
            });
            return "".concat(config.qrBaseUrl.replace(/\/$/, ''), "?").concat(params.toString());
        };
        PaymentsService_1.prototype.createSepayOrder = function (config, orderCode, amount, transactionId, markFailed) {
            return __awaiter(this, void 0, void 0, function () {
                var requestPayload, response, responseData, data, checkoutUrl;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            requestPayload = {
                                order_code: orderCode,
                                amount: amount,
                                with_qrcode: '1',
                                qrcode_template: 'compact',
                            };
                            if (config.vaPrefix) {
                                requestPayload.va_prefix = config.vaPrefix;
                            }
                            return [4 /*yield*/, fetch("".concat(config.apiBaseUrl.replace(/\/$/, ''), "/bank-accounts/").concat(config.bankAccountUuid, "/orders"), {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(config.apiToken),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(requestPayload),
                                })];
                        case 1:
                            response = _b.sent();
                            return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                        case 2:
                            responseData = (_b.sent());
                            data = ((_a = responseData.data) !== null && _a !== void 0 ? _a : {});
                            checkoutUrl = String(data.qr_code_url || data.qr_code || '');
                            if (!(!response.ok || responseData.status !== 'success' || !checkoutUrl)) return [3 /*break*/, 4];
                            return [4 /*yield*/, markFailed(responseData)];
                        case 3:
                            _b.sent();
                            throw new common_1.InternalServerErrorException(String(responseData.message || 'KhÃ´ng táº¡o Ä‘Æ°á»£c QR SePay'));
                        case 4: return [2 /*return*/, {
                                checkoutUrl: checkoutUrl,
                                data: data,
                                responseData: __assign(__assign({}, responseData), { localTransactionId: transactionId }),
                            }];
                    }
                });
            });
        };
        PaymentsService_1.prototype.assertSepayWebhookAuthorization = function (authorization) {
            var expectedKey = this.getSepayConfigOrThrow().webhookApiKey;
            var expectedAuthorization = "Apikey ".concat(expectedKey);
            if (!authorization || authorization.trim() !== expectedAuthorization) {
                throw new common_1.UnauthorizedException('Webhook SePay khÃ´ng há»£p lá»‡');
            }
        };
        PaymentsService_1.prototype.resolveSepayWebhookEventId = function (payload) {
            return String(payload.id || payload.referenceCode || '').trim();
        };
        PaymentsService_1.prototype.resolveSepayOrderCode = function (payload) {
            var directCode = String(payload.code || '').trim();
            if (directCode) {
                return directCode;
            }
            var textCandidates = [payload.content, payload.description]
                .map(function (value) { return (typeof value === 'string' ? value.trim() : ''); })
                .filter(Boolean);
            for (var _i = 0, textCandidates_1 = textCandidates; _i < textCandidates_1.length; _i++) {
                var candidate = textCandidates_1[_i];
                var match = candidate.match(/SEPAY(?:PARKING|CANTEEN)[A-Za-z0-9]+/i);
                if (match === null || match === void 0 ? void 0 : match[0]) {
                    return match[0];
                }
            }
            return '';
        };
        PaymentsService_1.prototype.recordSepayWebhookEvent = function (eventId, orderCode, payload) {
            return __awaiter(this, void 0, void 0, function () {
                var error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.prisma.paymentWebhookEvent.create({
                                    data: {
                                        provider: 'sepay',
                                        providerEventId: eventId,
                                        providerOrderId: orderCode,
                                        payload: this.asJson(payload),
                                    },
                                })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, true];
                        case 2:
                            error_1 = _a.sent();
                            if (this.isUniqueConstraintError(error_1)) {
                                return [2 /*return*/, false];
                            }
                            throw error_1;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        PaymentsService_1.prototype.getCanteenAdminUserIds = function () {
            return __awaiter(this, void 0, void 0, function () {
                var users;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.user.findMany({
                                where: {
                                    isActive: true,
                                    role: client_1.Role.canteen_admin,
                                },
                                select: { id: true },
                            })];
                        case 1:
                            users = _a.sent();
                            return [2 /*return*/, users.map(function (item) { return item.id; })];
                    }
                });
            });
        };
        PaymentsService_1.prototype.notifyCanteenOrder = function (userIds, type, title, body, data) {
            return __awaiter(this, void 0, void 0, function () {
                var uniqueUserIds;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            uniqueUserIds = __spreadArray([], new Set(userIds.filter(Boolean)), true);
                            if (!uniqueUserIds.length) {
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, this.prisma.notification.createMany({
                                    data: uniqueUserIds.map(function (userId) { return ({
                                        userId: userId,
                                        title: title,
                                        body: body,
                                        type: type,
                                        data: data ? _this.asJson(data) : undefined,
                                    }); }),
                                })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        PaymentsService_1.prototype.asJson = function (value) {
            return value;
        };
        PaymentsService_1.prototype.isUniqueConstraintError = function (error) {
            return error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
        };
        return PaymentsService_1;
    }());
    __setFunctionName(_classThis, "PaymentsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PaymentsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PaymentsService = _classThis;
}();
exports.PaymentsService = PaymentsService;
