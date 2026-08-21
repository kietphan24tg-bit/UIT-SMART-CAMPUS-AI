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
var client_1 = require("@prisma/client");
var canteen_service_1 = require("./canteen.service");
describe('CanteenService', function () {
    var prisma = {
        $transaction: jest.fn(),
        canteenCategory: {
            create: jest.fn(),
            update: jest.fn(),
            findUnique: jest.fn(),
        },
        canteenProduct: {
            create: jest.fn(),
            update: jest.fn(),
            findUnique: jest.fn(),
        },
        canteenOrder: {
            findUnique: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
        },
        canteenPaymentTransaction: {
            create: jest.fn(),
            update: jest.fn(),
        },
    };
    var configService = {
        get: jest.fn(),
    };
    var storageService = {
        uploadCanteenProductImage: jest.fn(),
    };
    var service;
    var fetchSpy;
    beforeEach(function () {
        jest.clearAllMocks();
        jest.spyOn(Date, 'now').mockReturnValue(1730000000000);
        configService.get.mockImplementation(function (key) {
            var values = {
                SEPAY_API_TOKEN: 'sepay-token',
                SEPAY_BANK_ACCOUNT_UUID: 'bank-account-uuid',
                SEPAY_API_BASE_URL: 'https://userapi.sepay.vn/v2',
                SEPAY_BANK_NAME: 'MBBank',
                SEPAY_ACCOUNT_NUMBER: '123456789',
                SEPAY_ACCOUNT_NAME: 'SMART CAMPUS',
                SEPAY_WEBHOOK_API_KEY: 'sepay-secret',
                SEPAY_QR_BASE_URL: 'https://qr.sepay.vn/img',
            };
            return values[key];
        });
        fetchSpy = jest
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue({ ok: true, json: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, ({})];
            }); }); } });
        service = new canteen_service_1.CanteenService(prisma, configService, storageService);
        prisma.$transaction.mockImplementation(function (callback) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, callback(prisma)];
        }); }); });
    });
    afterEach(function () {
        jest.restoreAllMocks();
    });
    it('forbids payment creation when order is not owned by current user', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.canteenOrder.findUnique.mockResolvedValue({
                        id: 'order-1',
                        createdById: 'student-2',
                        status: client_1.CanteenOrderStatus.pending_payment,
                        totalAmount: 45000,
                        items: [],
                    });
                    return [4 /*yield*/, expect(service.createMomoPayment('student-1', 'order-1')).rejects.toBeInstanceOf(common_1.ForbiddenException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('uploads product image through storage service', function () { return __awaiter(void 0, void 0, void 0, function () {
        var file;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    file = {
                        buffer: Buffer.from('image-bytes'),
                        mimetype: 'image/jpeg',
                        size: 128,
                        originalname: 'product.jpg',
                    };
                    storageService.uploadCanteenProductImage.mockResolvedValue({
                        key: 'canteen-products/admin-1/product.jpg',
                        imageUrl: 'https://cdn.uit.edu.vn/canteen-products/admin-1/product.jpg',
                    });
                    return [4 /*yield*/, expect(service.uploadProductImage('admin-1', file)).resolves.toEqual({
                            key: 'canteen-products/admin-1/product.jpg',
                            imageUrl: 'https://cdn.uit.edu.vn/canteen-products/admin-1/product.jpg',
                        })];
                case 1:
                    _a.sent();
                    expect(storageService.uploadCanteenProductImage).toHaveBeenCalledWith('admin-1', file);
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects payment creation when order status is not payable', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.canteenOrder.findUnique.mockResolvedValue({
                        id: 'order-1',
                        createdById: 'student-1',
                        status: client_1.CanteenOrderStatus.paid,
                        totalAmount: 45000,
                        items: [],
                    });
                    return [4 /*yield*/, expect(service.createMomoPayment('student-1', 'order-1')).rejects.toBeInstanceOf(common_1.BadRequestException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('creates a SePay QR checkout for a payable order', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.canteenOrder.findUnique.mockResolvedValue({
                        id: 'order12345',
                        orderCode: 'CTN-1',
                        createdById: 'student-1',
                        status: client_1.CanteenOrderStatus.pending_payment,
                        totalAmount: 45000,
                        items: [],
                    });
                    prisma.canteenPaymentTransaction.create.mockImplementation(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                        var data = _b.data;
                        return __generator(this, function (_c) {
                            return [2 /*return*/, (__assign({ id: 'canteen-payment-1' }, data))];
                        });
                    }); });
                    prisma.canteenPaymentTransaction.update.mockResolvedValue({});
                    return [4 /*yield*/, service.createSepayPayment('student-1', 'order12345')];
                case 1:
                    result = _a.sent();
                    expect(result).toEqual({
                        transactionId: 'canteen-payment-1',
                        provider: 'sepay',
                        mode: 'qr',
                        amount: 45000,
                        orderId: 'SEPAYCANTEEN1730000000000order123',
                        checkoutUrl: 'https://qr.sepay.vn/img?acc=123456789&bank=MBBank&amount=45000&des=SEPAYCANTEEN1730000000000order123',
                        bankName: 'MBBank',
                        accountNumber: '123456789',
                        accountName: 'SMART CAMPUS',
                        transferDescription: 'SEPAYCANTEEN1730000000000order123',
                    });
                    expect(fetchSpy).not.toHaveBeenCalled();
                    expect(prisma.canteenPaymentTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
                        data: expect.objectContaining({
                            provider: 'sepay',
                            providerOrderId: 'SEPAYCANTEEN1730000000000order123',
                        }),
                    }));
                    expect(prisma.canteenPaymentTransaction.update).toHaveBeenCalledWith(expect.objectContaining({
                        where: { id: 'canteen-payment-1' },
                        data: expect.objectContaining({
                            checkoutUrl: 'https://qr.sepay.vn/img?acc=123456789&bank=MBBank&amount=45000&des=SEPAYCANTEEN1730000000000order123',
                        }),
                    }));
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects completing an order that is not paid', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.canteenOrder.findUnique.mockResolvedValue({
                        id: 'order-1',
                        createdById: 'student-1',
                        status: client_1.CanteenOrderStatus.pending_payment,
                    });
                    return [4 /*yield*/, expect(service.completeOrder('order-1', 'canteen-admin-1')).rejects.toBeInstanceOf(common_1.BadRequestException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('deletes a pending order of current user and restores stock', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.canteenOrder.findUnique.mockResolvedValue({
                        id: 'order-1',
                        createdById: 'student-1',
                        status: client_1.CanteenOrderStatus.pending_payment,
                        items: [
                            {
                                id: 'item-1',
                                productId: 'product-1',
                                quantity: 2,
                            },
                        ],
                    });
                    prisma.canteenProduct.update.mockResolvedValue({});
                    prisma.canteenOrder.delete.mockResolvedValue({});
                    return [4 /*yield*/, expect(service.deleteOrder('student-1', 'order-1')).resolves.toEqual({
                            id: 'order-1',
                            deleted: true,
                        })];
                case 1:
                    _a.sent();
                    expect(prisma.canteenProduct.update).toHaveBeenCalledWith({
                        where: { id: 'product-1' },
                        data: { stock: { increment: 2 } },
                    });
                    expect(prisma.canteenOrder.delete).toHaveBeenCalledWith({
                        where: { id: 'order-1' },
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects deleting a paid order', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.canteenOrder.findUnique.mockResolvedValue({
                        id: 'order-1',
                        createdById: 'student-1',
                        status: client_1.CanteenOrderStatus.paid,
                        items: [],
                    });
                    return [4 /*yield*/, expect(service.deleteOrder('student-1', 'order-1')).rejects.toBeInstanceOf(common_1.BadRequestException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects deleting an order owned by another user', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.canteenOrder.findUnique.mockResolvedValue({
                        id: 'order-1',
                        createdById: 'student-2',
                        status: client_1.CanteenOrderStatus.pending_payment,
                        items: [],
                    });
                    return [4 /*yield*/, expect(service.deleteOrder('student-1', 'order-1')).rejects.toBeInstanceOf(common_1.ForbiddenException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('allows admin history deletion and restores stock for unpaid orders', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.canteenOrder.findUnique.mockResolvedValue({
                        id: 'order-2',
                        status: client_1.CanteenOrderStatus.pending_payment,
                        items: [
                            {
                                id: 'item-2',
                                productId: 'product-2',
                                quantity: 3,
                            },
                        ],
                    });
                    prisma.canteenProduct.update.mockResolvedValue({});
                    prisma.canteenOrder.delete.mockResolvedValue({});
                    return [4 /*yield*/, expect(service.deleteAdminOrder('order-2')).resolves.toEqual({
                            id: 'order-2',
                            deleted: true,
                            restoredStock: true,
                        })];
                case 1:
                    _a.sent();
                    expect(prisma.canteenProduct.update).toHaveBeenCalledWith({
                        where: { id: 'product-2' },
                        data: { stock: { increment: 3 } },
                    });
                    expect(prisma.canteenOrder.delete).toHaveBeenCalledWith({
                        where: { id: 'order-2' },
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('allows admin history deletion without restoring stock for paid orders', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.canteenOrder.findUnique.mockResolvedValue({
                        id: 'order-3',
                        status: client_1.CanteenOrderStatus.completed,
                        items: [
                            {
                                id: 'item-3',
                                productId: 'product-3',
                                quantity: 1,
                            },
                        ],
                    });
                    prisma.canteenOrder.delete.mockResolvedValue({});
                    return [4 /*yield*/, expect(service.deleteAdminOrder('order-3')).resolves.toEqual({
                            id: 'order-3',
                            deleted: true,
                            restoredStock: false,
                        })];
                case 1:
                    _a.sent();
                    expect(prisma.canteenProduct.update).not.toHaveBeenCalled();
                    expect(prisma.canteenOrder.delete).toHaveBeenCalledWith({
                        where: { id: 'order-3' },
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects admin history deletion when order does not exist', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.canteenOrder.findUnique.mockResolvedValue(null);
                    return [4 /*yield*/, expect(service.deleteAdminOrder('missing-order')).rejects.toBeInstanceOf(common_1.NotFoundException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('maps duplicate category create conflict to conflict exception', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.canteenCategory.create.mockRejectedValue(new client_1.Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
                        code: 'P2002',
                        clientVersion: 'test',
                    }));
                    return [4 /*yield*/, expect(service.createCategory({
                            name: 'Drinks',
                        })).rejects.toBeInstanceOf(common_1.ConflictException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('maps duplicate product create conflict to conflict exception', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.canteenCategory.findUnique.mockResolvedValue({ id: 'category-1' });
                    prisma.canteenProduct.create.mockRejectedValue(new client_1.Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
                        code: 'P2002',
                        clientVersion: 'test',
                    }));
                    return [4 /*yield*/, expect(service.createProduct({
                            categoryId: 'category-1',
                            name: 'Milk Tea',
                            price: 25000,
                        })).rejects.toBeInstanceOf(common_1.ConflictException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
