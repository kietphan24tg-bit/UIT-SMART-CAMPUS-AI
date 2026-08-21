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
exports.CanteenService = void 0;
var node_crypto_1 = require("node:crypto");
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var MOMO_SANDBOX_ENDPOINT = 'https://test-payment.momo.vn/v2/gateway/api/create';
var SEPAY_DEFAULT_QR_BASE_URL = 'https://qr.sepay.vn/img';
function toInputJson(value) {
    return value;
}
function makeOrderCode() {
    var now = new Date();
    var compact = "".concat(now.getFullYear()).concat(String(now.getMonth() + 1).padStart(2, '0')).concat(String(now.getDate()).padStart(2, '0')).concat(String(now.getHours()).padStart(2, '0')).concat(String(now.getMinutes()).padStart(2, '0')).concat(String(now.getSeconds()).padStart(2, '0'));
    var suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return "CTN-".concat(compact, "-").concat(suffix);
}
function slugify(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
}
function buildInternalSlug(name) {
    var base = slugify(name) || 'item';
    var suffix = Math.random().toString(36).slice(2, 8);
    return "".concat(base, "-").concat(suffix);
}
var CanteenService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var CanteenService = _classThis = /** @class */ (function () {
        function CanteenService_1(prisma, configService, avatarStorageService) {
            this.prisma = prisma;
            this.configService = configService;
            this.avatarStorageService = avatarStorageService;
        }
        CanteenService_1.prototype.getCatalog = function () {
            return __awaiter(this, void 0, void 0, function () {
                var categories;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.canteenCategory.findMany({
                                where: { isActive: true },
                                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                                include: {
                                    products: {
                                        where: { isActive: true },
                                        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                                    },
                                },
                            })];
                        case 1:
                            categories = _a.sent();
                            return [2 /*return*/, categories.map(function (category) { return ({
                                    id: category.id,
                                    name: category.name,
                                    description: category.description,
                                    products: category.products.map(function (product) { return ({
                                        id: product.id,
                                        name: product.name,
                                        description: product.description,
                                        imageUrl: product.imageUrl,
                                        price: product.price,
                                        stock: product.stock,
                                    }); }),
                                }); })];
                    }
                });
            });
        };
        CanteenService_1.prototype.getAdminCatalog = function () {
            return __awaiter(this, arguments, void 0, function (includeInactive) {
                var categories;
                if (includeInactive === void 0) { includeInactive = false; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.canteenCategory.findMany({
                                where: includeInactive ? undefined : { isActive: true },
                                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                                include: {
                                    products: {
                                        where: includeInactive ? undefined : { isActive: true },
                                        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                                    },
                                },
                            })];
                        case 1:
                            categories = _a.sent();
                            return [2 /*return*/, categories.map(function (category) { return ({
                                    id: category.id,
                                    name: category.name,
                                    description: category.description,
                                    sortOrder: category.sortOrder,
                                    isActive: category.isActive,
                                    products: category.products.map(function (product) { return ({
                                        id: product.id,
                                        categoryId: product.categoryId,
                                        name: product.name,
                                        description: product.description,
                                        imageUrl: product.imageUrl,
                                        price: product.price,
                                        stock: product.stock,
                                        sortOrder: product.sortOrder,
                                        isActive: product.isActive,
                                    }); }),
                                }); })];
                    }
                });
            });
        };
        CanteenService_1.prototype.createCategory = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var error_1;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            _d.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.prisma.canteenCategory.create({
                                    data: {
                                        name: dto.name.trim(),
                                        slug: buildInternalSlug(dto.name.trim()),
                                        description: ((_a = dto.description) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                                        isActive: (_b = dto.isActive) !== null && _b !== void 0 ? _b : true,
                                        sortOrder: (_c = dto.sortOrder) !== null && _c !== void 0 ? _c : 0,
                                    },
                                })];
                        case 1: return [2 /*return*/, _d.sent()];
                        case 2:
                            error_1 = _d.sent();
                            this.rethrowCatalogConflict(error_1, 'Danh mục canteen');
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        CanteenService_1.prototype.updateCategory = function (categoryId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var error_2;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.assertCategoryExists(categoryId)];
                        case 1:
                            _b.sent();
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.prisma.canteenCategory.update({
                                    where: { id: categoryId },
                                    data: __assign(__assign(__assign(__assign({}, (dto.name !== undefined ? { name: dto.name.trim() } : {})), (dto.description !== undefined
                                        ? { description: ((_a = dto.description) === null || _a === void 0 ? void 0 : _a.trim()) || null }
                                        : {})), (dto.isActive !== undefined ? { isActive: dto.isActive } : {})), (dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {})),
                                })];
                        case 3: return [2 /*return*/, _b.sent()];
                        case 4:
                            error_2 = _b.sent();
                            this.rethrowCatalogConflict(error_2, 'Danh mục canteen');
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        CanteenService_1.prototype.removeCategory = function (categoryId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.assertCategoryExists(categoryId)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.prisma.canteenCategory.update({
                                    where: { id: categoryId },
                                    data: { isActive: false },
                                })];
                    }
                });
            });
        };
        CanteenService_1.prototype.createProduct = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var error_3;
                var _a, _b, _c, _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0: return [4 /*yield*/, this.assertCategoryExists(dto.categoryId)];
                        case 1:
                            _f.sent();
                            _f.label = 2;
                        case 2:
                            _f.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.prisma.canteenProduct.create({
                                    data: {
                                        categoryId: dto.categoryId,
                                        name: dto.name.trim(),
                                        slug: buildInternalSlug(dto.name.trim()),
                                        description: ((_a = dto.description) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                                        imageUrl: ((_b = dto.imageUrl) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                                        price: dto.price,
                                        stock: (_c = dto.stock) !== null && _c !== void 0 ? _c : 0,
                                        isActive: (_d = dto.isActive) !== null && _d !== void 0 ? _d : true,
                                        sortOrder: (_e = dto.sortOrder) !== null && _e !== void 0 ? _e : 0,
                                    },
                                })];
                        case 3: return [2 /*return*/, _f.sent()];
                        case 4:
                            error_3 = _f.sent();
                            this.rethrowCatalogConflict(error_3, 'Sản phẩm canteen');
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        CanteenService_1.prototype.updateProduct = function (productId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var error_4;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.assertProductExists(productId)];
                        case 1:
                            _c.sent();
                            if (!dto.categoryId) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.assertCategoryExists(dto.categoryId)];
                        case 2:
                            _c.sent();
                            _c.label = 3;
                        case 3:
                            _c.trys.push([3, 5, , 6]);
                            return [4 /*yield*/, this.prisma.canteenProduct.update({
                                    where: { id: productId },
                                    data: __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({}, (dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {})), (dto.name !== undefined ? { name: dto.name.trim() } : {})), (dto.description !== undefined
                                        ? { description: ((_a = dto.description) === null || _a === void 0 ? void 0 : _a.trim()) || null }
                                        : {})), (dto.imageUrl !== undefined ? { imageUrl: ((_b = dto.imageUrl) === null || _b === void 0 ? void 0 : _b.trim()) || null } : {})), (dto.price !== undefined ? { price: dto.price } : {})), (dto.stock !== undefined ? { stock: dto.stock } : {})), (dto.isActive !== undefined ? { isActive: dto.isActive } : {})), (dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {})),
                                })];
                        case 4: return [2 /*return*/, _c.sent()];
                        case 5:
                            error_4 = _c.sent();
                            this.rethrowCatalogConflict(error_4, 'Sản phẩm canteen');
                            return [3 /*break*/, 6];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        CanteenService_1.prototype.uploadProductImage = function (actorId, file) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.avatarStorageService.uploadCanteenProductImage(actorId, file)];
                });
            });
        };
        CanteenService_1.prototype.removeProduct = function (productId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.assertProductExists(productId)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.prisma.canteenProduct.update({
                                    where: { id: productId },
                                    data: { isActive: false },
                                })];
                    }
                });
            });
        };
        CanteenService_1.prototype.createOrder = function (userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var productIds, products, productById, lineItems, totalAmount;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!dto.items.length) {
                                throw new common_1.BadRequestException('Đơn hàng phải có ít nhất một món');
                            }
                            productIds = __spreadArray([], new Set(dto.items.map(function (item) { return item.productId.trim(); })), true);
                            return [4 /*yield*/, this.prisma.canteenProduct.findMany({
                                    where: {
                                        id: { in: productIds },
                                        isActive: true,
                                    },
                                    select: {
                                        id: true,
                                        name: true,
                                        price: true,
                                        stock: true,
                                    },
                                })];
                        case 1:
                            products = _a.sent();
                            if (products.length !== productIds.length) {
                                throw new common_1.NotFoundException('Có sản phẩm không tồn tại hoặc đã ngừng bán');
                            }
                            productById = new Map(products.map(function (product) { return [product.id, product]; }));
                            lineItems = dto.items.map(function (item) {
                                var product = productById.get(item.productId.trim());
                                if (!product) {
                                    throw new common_1.NotFoundException('Có sản phẩm không hợp lệ');
                                }
                                if (product.stock < item.quantity) {
                                    throw new common_1.BadRequestException("S\u1EA3n ph\u1EA9m ".concat(product.name, " kh\u00F4ng \u0111\u1EE7 t\u1ED3n kho"));
                                }
                                return {
                                    productId: product.id,
                                    productName: product.name,
                                    unitPrice: product.price,
                                    quantity: item.quantity,
                                    lineTotal: product.price * item.quantity,
                                };
                            });
                            totalAmount = lineItems.reduce(function (sum, item) { return sum + item.lineTotal; }, 0);
                            return [2 /*return*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var order, _i, lineItems_1, item;
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0: return [4 /*yield*/, tx.canteenOrder.create({
                                                    data: {
                                                        orderCode: makeOrderCode(),
                                                        createdById: userId,
                                                        note: ((_a = dto.note) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                                                        totalAmount: totalAmount,
                                                        items: {
                                                            createMany: {
                                                                data: lineItems,
                                                            },
                                                        },
                                                    },
                                                })];
                                            case 1:
                                                order = _b.sent();
                                                _i = 0, lineItems_1 = lineItems;
                                                _b.label = 2;
                                            case 2:
                                                if (!(_i < lineItems_1.length)) return [3 /*break*/, 5];
                                                item = lineItems_1[_i];
                                                return [4 /*yield*/, tx.canteenProduct.update({
                                                        where: { id: item.productId },
                                                        data: { stock: { decrement: item.quantity } },
                                                    })];
                                            case 3:
                                                _b.sent();
                                                _b.label = 4;
                                            case 4:
                                                _i++;
                                                return [3 /*break*/, 2];
                                            case 5: return [2 /*return*/, order];
                                        }
                                    });
                                }); })];
                    }
                });
            });
        };
        CanteenService_1.prototype.listMyOrders = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var orders;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.canteenOrder.findMany({
                                where: { createdById: userId },
                                include: {
                                    items: true,
                                    payments: {
                                        orderBy: [{ createdAt: 'desc' }],
                                        take: 1,
                                    },
                                },
                                orderBy: [{ createdAt: 'desc' }],
                            })];
                        case 1:
                            orders = _a.sent();
                            return [2 /*return*/, orders.map(function (order) { return _this.mapOrder(order); })];
                    }
                });
            });
        };
        CanteenService_1.prototype.listAdminOrders = function (viewerRole) {
            return __awaiter(this, void 0, void 0, function () {
                var orders;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.canteenOrder.findMany({
                                include: {
                                    createdBy: {
                                        select: {
                                            id: true,
                                            email: true,
                                            firstName: true,
                                            lastName: true,
                                            role: true,
                                        },
                                    },
                                    completedBy: {
                                        select: {
                                            id: true,
                                            email: true,
                                            firstName: true,
                                            lastName: true,
                                            role: true,
                                        },
                                    },
                                    items: true,
                                    payments: {
                                        orderBy: [{ createdAt: 'desc' }],
                                        take: 1,
                                    },
                                },
                                orderBy: [{ createdAt: 'desc' }],
                            })];
                        case 1:
                            orders = _a.sent();
                            return [2 /*return*/, orders.map(function (order) { return (__assign(__assign({}, _this.mapOrder(order)), { requestedBy: _this.mapUser(order.createdBy), completedBy: order.completedBy ? _this.mapUser(order.completedBy) : null, viewerRole: viewerRole })); })];
                    }
                });
            });
        };
        CanteenService_1.prototype.deleteOrder = function (userId, orderId) {
            return __awaiter(this, void 0, void 0, function () {
                var order, deletableStatuses;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.canteenOrder.findUnique({
                                where: { id: orderId },
                                include: {
                                    items: true,
                                },
                            })];
                        case 1:
                            order = _a.sent();
                            if (!order) {
                                throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng');
                            }
                            if (order.createdById !== userId) {
                                throw new common_1.ForbiddenException('Báº¡n khÃ´ng cÃ³ quyá»n xÃ³a Ä‘Æ¡n hÃ ng nÃ y');
                            }
                            deletableStatuses = [
                                client_1.CanteenOrderStatus.pending_payment,
                                client_1.CanteenOrderStatus.payment_failed,
                            ];
                            if (!deletableStatuses.includes(order.status)) {
                                throw new common_1.BadRequestException('Chá»‰ cÃ³ thá»ƒ xÃ³a Ä‘Æ¡n chÆ°a thanh toÃ¡n hoáº·c thanh toÃ¡n lá»—i');
                            }
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var _i, _a, item;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                _i = 0, _a = order.items;
                                                _b.label = 1;
                                            case 1:
                                                if (!(_i < _a.length)) return [3 /*break*/, 4];
                                                item = _a[_i];
                                                return [4 /*yield*/, tx.canteenProduct.update({
                                                        where: { id: item.productId },
                                                        data: { stock: { increment: item.quantity } },
                                                    })];
                                            case 2:
                                                _b.sent();
                                                _b.label = 3;
                                            case 3:
                                                _i++;
                                                return [3 /*break*/, 1];
                                            case 4: return [4 /*yield*/, tx.canteenOrder.delete({
                                                    where: { id: order.id },
                                                })];
                                            case 5:
                                                _b.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, {
                                    id: order.id,
                                    deleted: true,
                                }];
                    }
                });
            });
        };
        CanteenService_1.prototype.deleteAdminOrder = function (orderId) {
            return __awaiter(this, void 0, void 0, function () {
                var order, restorableStatuses, shouldRestoreStock;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.canteenOrder.findUnique({
                                where: { id: orderId },
                                include: {
                                    items: true,
                                },
                            })];
                        case 1:
                            order = _a.sent();
                            if (!order) {
                                throw new common_1.NotFoundException('Không tìm thấy đơn hàng');
                            }
                            restorableStatuses = [
                                client_1.CanteenOrderStatus.pending_payment,
                                client_1.CanteenOrderStatus.payment_failed,
                                client_1.CanteenOrderStatus.cancelled,
                            ];
                            shouldRestoreStock = restorableStatuses.includes(order.status);
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var _i, _a, item;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                if (!shouldRestoreStock) return [3 /*break*/, 4];
                                                _i = 0, _a = order.items;
                                                _b.label = 1;
                                            case 1:
                                                if (!(_i < _a.length)) return [3 /*break*/, 4];
                                                item = _a[_i];
                                                return [4 /*yield*/, tx.canteenProduct.update({
                                                        where: { id: item.productId },
                                                        data: { stock: { increment: item.quantity } },
                                                    })];
                                            case 2:
                                                _b.sent();
                                                _b.label = 3;
                                            case 3:
                                                _i++;
                                                return [3 /*break*/, 1];
                                            case 4: return [4 /*yield*/, tx.canteenOrder.delete({
                                                    where: { id: order.id },
                                                })];
                                            case 5:
                                                _b.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, {
                                    id: order.id,
                                    deleted: true,
                                    restoredStock: shouldRestoreStock,
                                }];
                    }
                });
            });
        };
        CanteenService_1.prototype.completeOrder = function (orderId, actorId) {
            return __awaiter(this, void 0, void 0, function () {
                var order, updated, _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.prisma.canteenOrder.findUnique({
                                where: { id: orderId },
                                select: {
                                    id: true,
                                    createdById: true,
                                    status: true,
                                },
                            })];
                        case 1:
                            order = _c.sent();
                            if (!order) {
                                throw new common_1.NotFoundException('Không tìm thấy đơn hàng');
                            }
                            if (order.status !== client_1.CanteenOrderStatus.paid) {
                                throw new common_1.BadRequestException('Chỉ đơn hàng đã thanh toán mới được hoàn thành');
                            }
                            return [4 /*yield*/, this.prisma.canteenOrder.update({
                                    where: { id: order.id },
                                    data: {
                                        status: client_1.CanteenOrderStatus.completed,
                                        completedById: actorId,
                                        completedAt: new Date(),
                                    },
                                    include: {
                                        items: true,
                                        payments: {
                                            orderBy: [{ createdAt: 'desc' }],
                                            take: 1,
                                        },
                                    },
                                })];
                        case 2:
                            updated = _c.sent();
                            _a = this.notifyOrder;
                            _b = [[order.createdById]];
                            return [4 /*yield*/, this.getCanteenAdminUserIds()];
                        case 3: return [4 /*yield*/, _a.apply(this, [__spreadArray.apply(void 0, _b.concat([(_c.sent()), true])), 'canteen',
                                'Đơn canteen đã hoàn thành', "\u0110\u01A1n ".concat(updated.orderCode, " \u0111\u00E3 \u0111\u01B0\u1EE3c \u0111\u00E1nh d\u1EA5u ho\u00E0n th\u00E0nh."), { orderId: updated.id, status: updated.status }])];
                        case 4:
                            _c.sent();
                            return [2 /*return*/, this.mapOrder(updated)];
                    }
                });
            });
        };
        CanteenService_1.prototype.createMomoPayment = function (userId, orderId) {
            return __awaiter(this, void 0, void 0, function () {
                var order, payableStatuses, momoConfig, now, providerOrderId, requestId, transaction, checkout;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.canteenOrder.findUnique({
                                where: { id: orderId },
                                include: {
                                    items: true,
                                },
                            })];
                        case 1:
                            order = _a.sent();
                            if (!order) {
                                throw new common_1.NotFoundException('Không tìm thấy đơn hàng');
                            }
                            if (order.createdById !== userId) {
                                throw new common_1.ForbiddenException('Bạn không có quyền thanh toán đơn hàng này');
                            }
                            payableStatuses = [
                                client_1.CanteenOrderStatus.pending_payment,
                                client_1.CanteenOrderStatus.payment_failed,
                            ];
                            if (!payableStatuses.includes(order.status)) {
                                throw new common_1.BadRequestException('Đơn hàng không còn ở trạng thái cho phép thanh toán');
                            }
                            momoConfig = this.getMomoConfigOrThrow();
                            now = Date.now();
                            providerOrderId = "MOMO-CANTEEN-".concat(now, "-").concat(order.id.slice(0, 8));
                            requestId = "REQ-CANTEEN-".concat(now, "-").concat(order.id.slice(0, 8));
                            return [4 /*yield*/, this.prisma.canteenPaymentTransaction.create({
                                    data: {
                                        orderId: order.id,
                                        provider: 'momo',
                                        providerOrderId: providerOrderId,
                                        requestId: requestId,
                                        amount: order.totalAmount,
                                        status: 'pending',
                                        requestPayload: toInputJson({ orderId: order.id, orderCode: order.orderCode }),
                                    },
                                })];
                        case 2:
                            transaction = _a.sent();
                            return [4 /*yield*/, this.createSandboxCheckout("Thanh to\u00E1n canteen ".concat(order.orderCode), transaction, momoConfig)];
                        case 3:
                            checkout = _a.sent();
                            return [4 /*yield*/, this.prisma.canteenPaymentTransaction.update({
                                    where: { id: transaction.id },
                                    data: {
                                        checkoutUrl: checkout.checkoutUrl,
                                    },
                                })];
                        case 4:
                            _a.sent();
                            return [2 /*return*/, checkout];
                    }
                });
            });
        };
        CanteenService_1.prototype.createSepayPayment = function (userId, orderId) {
            return __awaiter(this, void 0, void 0, function () {
                var order, payableStatuses, sepayConfig, now, providerOrderId, checkoutUrl, transaction;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.canteenOrder.findUnique({
                                where: { id: orderId },
                                include: {
                                    items: true,
                                },
                            })];
                        case 1:
                            order = _a.sent();
                            if (!order) {
                                throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng');
                            }
                            if (order.createdById !== userId) {
                                throw new common_1.ForbiddenException('Báº¡n khÃ´ng cÃ³ quyá»n thanh toÃ¡n Ä‘Æ¡n hÃ ng nÃ y');
                            }
                            payableStatuses = [
                                client_1.CanteenOrderStatus.pending_payment,
                                client_1.CanteenOrderStatus.payment_failed,
                            ];
                            if (!payableStatuses.includes(order.status)) {
                                throw new common_1.BadRequestException('ÄÆ¡n hÃ ng khÃ´ng cÃ²n á»Ÿ tráº¡ng thÃ¡i cho phÃ©p thanh toÃ¡n');
                            }
                            sepayConfig = this.getSepayConfigOrThrow();
                            now = Date.now();
                            providerOrderId = "SEPAYCANTEEN".concat(now).concat(order.id.slice(0, 8).replace(/[^a-zA-Z0-9]/g, ''));
                            checkoutUrl = this.buildSepayCheckoutUrl(sepayConfig, order.totalAmount, providerOrderId);
                            return [4 /*yield*/, this.prisma.canteenPaymentTransaction.create({
                                    data: {
                                        orderId: order.id,
                                        provider: 'sepay',
                                        providerOrderId: providerOrderId,
                                        requestId: providerOrderId,
                                        amount: order.totalAmount,
                                        status: 'pending',
                                        requestPayload: toInputJson({
                                            orderId: order.id,
                                            orderCode: order.orderCode,
                                            bankName: sepayConfig.bankName,
                                            accountNumber: sepayConfig.accountNumber,
                                            transferDescription: providerOrderId,
                                        }),
                                    },
                                })];
                        case 2:
                            transaction = _a.sent();
                            return [4 /*yield*/, this.prisma.canteenPaymentTransaction.update({
                                    where: { id: transaction.id },
                                    data: {
                                        checkoutUrl: checkoutUrl,
                                        responsePayload: toInputJson({
                                            checkoutUrl: checkoutUrl,
                                            bankName: sepayConfig.bankName,
                                            accountNumber: sepayConfig.accountNumber,
                                            accountName: sepayConfig.accountName,
                                            transferDescription: providerOrderId,
                                            generatedAt: new Date().toISOString(),
                                        }),
                                    },
                                })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, {
                                    transactionId: transaction.id,
                                    provider: 'sepay',
                                    mode: 'qr',
                                    amount: order.totalAmount,
                                    orderId: providerOrderId,
                                    checkoutUrl: checkoutUrl,
                                    bankName: sepayConfig.bankName,
                                    accountNumber: sepayConfig.accountNumber,
                                    accountName: sepayConfig.accountName,
                                    transferDescription: providerOrderId,
                                }];
                    }
                });
            });
        };
        CanteenService_1.prototype.handleMomoWebhook = function (payload) {
            return __awaiter(this, void 0, void 0, function () {
                var orderToken, transaction, _a, resultCode, updated, _b, _c;
                var _this = this;
                var _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            orderToken = String(payload.orderId || payload.requestId || '').trim();
                            if (!orderToken) {
                                throw new common_1.BadRequestException('Webhook thiếu orderId');
                            }
                            return [4 /*yield*/, this.prisma.canteenPaymentTransaction.findUnique({
                                    where: { providerOrderId: orderToken },
                                })];
                        case 1:
                            if (!((_d = (_f.sent())) !== null && _d !== void 0)) return [3 /*break*/, 2];
                            _a = _d;
                            return [3 /*break*/, 4];
                        case 2: return [4 /*yield*/, this.prisma.canteenPaymentTransaction.findFirst({
                                where: { requestId: orderToken },
                            })];
                        case 3:
                            _a = (_f.sent());
                            _f.label = 4;
                        case 4:
                            transaction = _a;
                            if (!transaction) {
                                throw new common_1.NotFoundException('Không tìm thấy giao dịch thanh toán canteen');
                            }
                            if (transaction.status === 'paid') {
                                return [2 /*return*/, {
                                        acknowledged: true,
                                        status: transaction.status,
                                        transactionId: transaction.id,
                                    }];
                            }
                            resultCode = Number((_e = payload.resultCode) !== null && _e !== void 0 ? _e : -1);
                            if (!(resultCode === 0)) return [3 /*break*/, 8];
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var paidTx, paidOrder;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, tx.canteenPaymentTransaction.update({
                                                    where: { id: transaction.id },
                                                    data: {
                                                        status: 'paid',
                                                        paidAt: new Date(),
                                                        responsePayload: toInputJson(payload),
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
                        case 5:
                            updated = _f.sent();
                            _b = this.notifyOrder;
                            _c = [[updated.paidOrder.createdBy.id]];
                            return [4 /*yield*/, this.getCanteenAdminUserIds()];
                        case 6: return [4 /*yield*/, _b.apply(this, [__spreadArray.apply(void 0, _c.concat([(_f.sent()), true])), 'canteen',
                                'Đơn canteen đã thanh toán',
                                'Thanh toán đơn hàng canteen thành công.',
                                { orderId: updated.paidOrder.id, status: client_1.CanteenOrderStatus.paid }])];
                        case 7:
                            _f.sent();
                            return [2 /*return*/, {
                                    acknowledged: true,
                                    status: 'paid',
                                    transactionId: updated.paidTx.id,
                                }];
                        case 8: return [4 /*yield*/, this.prisma.$transaction([
                                this.prisma.canteenPaymentTransaction.update({
                                    where: { id: transaction.id },
                                    data: {
                                        status: 'failed',
                                        responsePayload: toInputJson(payload),
                                    },
                                }),
                                this.prisma.canteenOrder.update({
                                    where: { id: transaction.orderId },
                                    data: { status: client_1.CanteenOrderStatus.payment_failed },
                                }),
                            ])];
                        case 9:
                            _f.sent();
                            return [2 /*return*/, {
                                    acknowledged: true,
                                    status: 'failed',
                                    transactionId: transaction.id,
                                }];
                    }
                });
            });
        };
        CanteenService_1.prototype.mapOrder = function (order) {
            var _a, _b, _c, _d, _e, _f;
            return {
                id: order.id,
                orderCode: order.orderCode,
                status: order.status,
                totalAmount: order.totalAmount,
                note: order.note,
                createdAt: order.createdAt.toISOString(),
                updatedAt: order.updatedAt.toISOString(),
                completedAt: (_b = (_a = order.completedAt) === null || _a === void 0 ? void 0 : _a.toISOString()) !== null && _b !== void 0 ? _b : null,
                cancelledAt: (_d = (_c = order.cancelledAt) === null || _c === void 0 ? void 0 : _c.toISOString()) !== null && _d !== void 0 ? _d : null,
                items: order.items,
                latestPayment: order.payments[0]
                    ? {
                        id: order.payments[0].id,
                        status: order.payments[0].status,
                        amount: order.payments[0].amount,
                        checkoutUrl: order.payments[0].checkoutUrl,
                        createdAt: order.payments[0].createdAt.toISOString(),
                        paidAt: (_f = (_e = order.payments[0].paidAt) === null || _e === void 0 ? void 0 : _e.toISOString()) !== null && _f !== void 0 ? _f : null,
                    }
                    : null,
            };
        };
        CanteenService_1.prototype.mapUser = function (user) {
            return {
                id: user.id,
                email: user.email,
                fullName: "".concat(user.lastName, " ").concat(user.firstName).trim(),
                role: user.role,
            };
        };
        CanteenService_1.prototype.assertCategoryExists = function (categoryId) {
            return __awaiter(this, void 0, void 0, function () {
                var category;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.canteenCategory.findUnique({
                                where: { id: categoryId },
                                select: { id: true },
                            })];
                        case 1:
                            category = _a.sent();
                            if (!category) {
                                throw new common_1.NotFoundException('Không tìm thấy danh mục canteen');
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        CanteenService_1.prototype.assertProductExists = function (productId) {
            return __awaiter(this, void 0, void 0, function () {
                var product;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.canteenProduct.findUnique({
                                where: { id: productId },
                                select: { id: true },
                            })];
                        case 1:
                            product = _a.sent();
                            if (!product) {
                                throw new common_1.NotFoundException('Không tìm thấy sản phẩm canteen');
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        CanteenService_1.prototype.getCanteenAdminUserIds = function () {
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
        CanteenService_1.prototype.notifyOrder = function (userIds, type, title, body, data) {
            return __awaiter(this, void 0, void 0, function () {
                var uniqueUserIds;
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
                                        data: data ? toInputJson(data) : undefined,
                                    }); }),
                                })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        CanteenService_1.prototype.createSandboxCheckout = function (orderInfo, transaction, config) {
            return __awaiter(this, void 0, void 0, function () {
                var requestType, requestId, extraData, rawSignature, signature, payload, response, responseData, checkoutUrl;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            requestType = 'captureWallet';
                            requestId = transaction.requestId || transaction.providerOrderId;
                            extraData = '';
                            rawSignature = [
                                "accessKey=".concat(config.accessKey),
                                "amount=".concat(transaction.amount),
                                "extraData=".concat(extraData),
                                "ipnUrl=".concat(config.ipnUrl),
                                "orderId=".concat(transaction.providerOrderId),
                                "orderInfo=".concat(orderInfo),
                                "partnerCode=".concat(config.partnerCode),
                                "redirectUrl=".concat(config.redirectUrl),
                                "requestId=".concat(requestId),
                                "requestType=".concat(requestType),
                            ].join('&');
                            signature = (0, node_crypto_1.createHmac)('sha256', config.secretKey).update(rawSignature).digest('hex');
                            payload = {
                                partnerCode: config.partnerCode,
                                requestId: requestId,
                                amount: String(transaction.amount),
                                orderId: transaction.providerOrderId,
                                orderInfo: orderInfo,
                                redirectUrl: config.redirectUrl,
                                ipnUrl: config.ipnUrl,
                                lang: 'vi',
                                requestType: requestType,
                                autoCapture: true,
                                extraData: extraData,
                                signature: signature,
                            };
                            return [4 /*yield*/, fetch(MOMO_SANDBOX_ENDPOINT, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(payload),
                                })];
                        case 1:
                            response = _b.sent();
                            return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                        case 2:
                            responseData = (_b.sent());
                            checkoutUrl = String(responseData.payUrl || responseData.deeplink || '');
                            if (!(!response.ok || Number((_a = responseData.resultCode) !== null && _a !== void 0 ? _a : -1) !== 0 || !checkoutUrl)) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.prisma.canteenPaymentTransaction.update({
                                    where: { id: transaction.id },
                                    data: {
                                        status: 'failed',
                                        responsePayload: toInputJson(responseData),
                                    },
                                })];
                        case 3:
                            _b.sent();
                            throw new common_1.InternalServerErrorException(String(responseData.message || 'Không tạo được link thanh toán canteen'));
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
        CanteenService_1.prototype.getMomoConfigOrThrow = function () {
            var _a, _b, _c, _d, _e;
            var partnerCode = (_a = this.configService.get('MOMO_PARTNER_CODE')) === null || _a === void 0 ? void 0 : _a.trim();
            var accessKey = (_b = this.configService.get('MOMO_ACCESS_KEY')) === null || _b === void 0 ? void 0 : _b.trim();
            var secretKey = (_c = this.configService.get('MOMO_SECRET_KEY')) === null || _c === void 0 ? void 0 : _c.trim();
            var redirectUrl = (_d = this.configService.get('MOMO_REDIRECT_URL')) === null || _d === void 0 ? void 0 : _d.trim();
            var ipnUrl = (_e = this.configService.get('MOMO_IPN_URL')) === null || _e === void 0 ? void 0 : _e.trim();
            if (!partnerCode || !accessKey || !secretKey || !redirectUrl || !ipnUrl) {
                throw new common_1.InternalServerErrorException('Cấu hình MoMo chưa đầy đủ cho canteen. Hãy kiểm tra các biến MOMO_*.');
            }
            return {
                partnerCode: partnerCode,
                accessKey: accessKey,
                secretKey: secretKey,
                redirectUrl: redirectUrl,
                ipnUrl: ipnUrl,
            };
        };
        CanteenService_1.prototype.getSepayConfigOrThrow = function () {
            var _a, _b, _c, _d, _e, _f;
            var bankName = (_a = this.configService.get('SEPAY_BANK_NAME')) === null || _a === void 0 ? void 0 : _a.trim();
            var accountNumber = (_b = this.configService.get('SEPAY_ACCOUNT_NUMBER')) === null || _b === void 0 ? void 0 : _b.trim();
            var accountName = ((_c = this.configService.get('SEPAY_ACCOUNT_NAME')) === null || _c === void 0 ? void 0 : _c.trim()) || '';
            var webhookApiKey = ((_d = this.configService.get('SEPAY_WEBHOOK_API_KEY')) === null || _d === void 0 ? void 0 : _d.trim()) ||
                ((_e = this.configService.get('SEPAY_API_TOKEN')) === null || _e === void 0 ? void 0 : _e.trim()) ||
                '';
            var qrBaseUrl = ((_f = this.configService.get('SEPAY_QR_BASE_URL')) === null || _f === void 0 ? void 0 : _f.trim()) || SEPAY_DEFAULT_QR_BASE_URL;
            if (!bankName || !accountNumber || !webhookApiKey) {
                throw new common_1.InternalServerErrorException('Cấu hình SePay chưa đầy đủ cho canteen. Hãy kiểm tra SEPAY_BANK_NAME, SEPAY_ACCOUNT_NUMBER và SEPAY_WEBHOOK_API_KEY.');
            }
            return {
                bankName: bankName,
                accountNumber: accountNumber,
                accountName: accountName,
                webhookApiKey: webhookApiKey,
                qrBaseUrl: qrBaseUrl,
            };
        };
        CanteenService_1.prototype.buildSepayCheckoutUrl = function (config, amount, transferDescription) {
            var params = new URLSearchParams({
                acc: config.accountNumber,
                bank: config.bankName,
                amount: String(amount),
                des: transferDescription,
            });
            return "".concat(config.qrBaseUrl.replace(/\/$/, ''), "?").concat(params.toString());
        };
        CanteenService_1.prototype.rethrowCatalogConflict = function (error, entityLabel) {
            if (this.isUniqueConstraintError(error)) {
                throw new common_1.ConflictException("".concat(entityLabel, " \u0111\u00E3 t\u1ED3n t\u1EA1i"));
            }
            throw error;
        };
        CanteenService_1.prototype.isUniqueConstraintError = function (error) {
            return error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
        };
        return CanteenService_1;
    }());
    __setFunctionName(_classThis, "CanteenService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CanteenService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CanteenService = _classThis;
}();
exports.CanteenService = CanteenService;
