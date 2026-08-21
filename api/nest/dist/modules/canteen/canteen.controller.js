"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanteenController = void 0;
var common_1 = require("@nestjs/common");
var platform_express_1 = require("@nestjs/platform-express");
var swagger_1 = require("@nestjs/swagger");
var shared_1 = require("@smart-campus/shared");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var roles_guard_1 = require("../../common/guards/roles.guard");
var avatar_upload_constants_1 = require("../storage/avatar-upload.constants");
var productImageUploadPipe = new common_1.ParseFilePipeBuilder()
    .addFileTypeValidator({
    fileType: /^(image\/jpeg|image\/jpg|image\/png|image\/webp)$/,
})
    .addMaxSizeValidator({
    maxSize: avatar_upload_constants_1.MAX_AVATAR_UPLOAD_SIZE_BYTES,
})
    .build({
    fileIsRequired: true,
    errorHttpStatusCode: common_1.HttpStatus.BAD_REQUEST,
});
var CanteenController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Canteen'), (0, common_1.Controller)('canteen')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getCatalog_decorators;
    var _getAdminCatalog_decorators;
    var _createOrder_decorators;
    var _listMyOrders_decorators;
    var _listAdminOrders_decorators;
    var _deleteOrder_decorators;
    var _deleteAdminOrder_decorators;
    var _completeOrder_decorators;
    var _createPayment_decorators;
    var _createSepayPayment_decorators;
    var _handleMomoWebhook_decorators;
    var _handleReturn_decorators;
    var _createCategory_decorators;
    var _updateCategory_decorators;
    var _removeCategory_decorators;
    var _createProduct_decorators;
    var _updateProduct_decorators;
    var _uploadProductImage_decorators;
    var _removeProduct_decorators;
    var CanteenController = _classThis = /** @class */ (function () {
        function CanteenController_1(canteenService) {
            this.canteenService = (__runInitializers(this, _instanceExtraInitializers), canteenService);
        }
        CanteenController_1.prototype.getCatalog = function () {
            return this.canteenService.getCatalog();
        };
        CanteenController_1.prototype.getAdminCatalog = function (includeInactive) {
            return this.canteenService.getAdminCatalog(includeInactive === 'true');
        };
        CanteenController_1.prototype.createOrder = function (userId, dto) {
            return this.canteenService.createOrder(userId, dto);
        };
        CanteenController_1.prototype.listMyOrders = function (userId) {
            return this.canteenService.listMyOrders(userId);
        };
        CanteenController_1.prototype.listAdminOrders = function (role) {
            return this.canteenService.listAdminOrders(role);
        };
        CanteenController_1.prototype.deleteOrder = function (userId, orderId) {
            return this.canteenService.deleteOrder(userId, orderId);
        };
        CanteenController_1.prototype.deleteAdminOrder = function (orderId) {
            return this.canteenService.deleteAdminOrder(orderId);
        };
        CanteenController_1.prototype.completeOrder = function (orderId, actorId) {
            return this.canteenService.completeOrder(orderId, actorId);
        };
        CanteenController_1.prototype.createPayment = function (userId, orderId) {
            return this.canteenService.createMomoPayment(userId, orderId);
        };
        CanteenController_1.prototype.createSepayPayment = function (userId, orderId) {
            return this.canteenService.createSepayPayment(userId, orderId);
        };
        CanteenController_1.prototype.handleMomoWebhook = function (payload) {
            return this.canteenService.handleMomoWebhook(payload);
        };
        CanteenController_1.prototype.handleReturn = function () {
            return {
                ok: true,
                message: 'Thanh toán canteen đã xử lý. Bạn có thể quay lại ứng dụng.',
            };
        };
        CanteenController_1.prototype.createCategory = function (dto) {
            return this.canteenService.createCategory(dto);
        };
        CanteenController_1.prototype.updateCategory = function (categoryId, dto) {
            return this.canteenService.updateCategory(categoryId, dto);
        };
        CanteenController_1.prototype.removeCategory = function (categoryId) {
            return this.canteenService.removeCategory(categoryId);
        };
        CanteenController_1.prototype.createProduct = function (dto) {
            return this.canteenService.createProduct(dto);
        };
        CanteenController_1.prototype.updateProduct = function (productId, dto) {
            return this.canteenService.updateProduct(productId, dto);
        };
        CanteenController_1.prototype.uploadProductImage = function (actorId, file) {
            return this.canteenService.uploadProductImage(actorId, file);
        };
        CanteenController_1.prototype.removeProduct = function (productId) {
            return this.canteenService.removeProduct(productId);
        };
        return CanteenController_1;
    }());
    __setFunctionName(_classThis, "CanteenController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getCatalog_decorators = [(0, common_1.Get)('catalog'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Get active canteen catalog' })];
        _getAdminCatalog_decorators = [(0, common_1.Get)('catalog/admin'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.CANTEEN_ADMIN, shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Get canteen catalog for admin management' })];
        _createOrder_decorators = [(0, common_1.Post)('orders'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.STUDENT, shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Create canteen order' })];
        _listMyOrders_decorators = [(0, common_1.Get)('orders/me'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Get canteen orders of current user' })];
        _listAdminOrders_decorators = [(0, common_1.Get)('orders/admin'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.CANTEEN_ADMIN, shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Get canteen order list for management/audit' })];
        _deleteOrder_decorators = [(0, common_1.Delete)('orders/:id'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.STUDENT, shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Delete unpaid canteen order of current user' })];
        _deleteAdminOrder_decorators = [(0, common_1.Delete)('orders/admin/:id'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Delete canteen order history from admin management' })];
        _completeOrder_decorators = [(0, common_1.Patch)('orders/:id/complete'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.CANTEEN_ADMIN, shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Mark paid order as completed by canteen admin' })];
        _createPayment_decorators = [(0, common_1.Post)('orders/:id/pay'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.STUDENT, shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Create MoMo checkout for canteen order' })];
        _createSepayPayment_decorators = [(0, common_1.Post)('orders/:id/pay/sepay'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.STUDENT, shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Create SePay QR checkout for canteen order' })];
        _handleMomoWebhook_decorators = [(0, common_1.Post)('payments/momo/webhook'), (0, swagger_1.ApiOperation)({ summary: 'Handle MoMo webhook for canteen orders' })];
        _handleReturn_decorators = [(0, common_1.Get)('payments/momo/return'), (0, swagger_1.ApiOperation)({ summary: 'Handle MoMo redirect return for canteen orders' })];
        _createCategory_decorators = [(0, common_1.Post)('categories'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.CANTEEN_ADMIN, shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Create canteen category' })];
        _updateCategory_decorators = [(0, common_1.Patch)('categories/:id'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.CANTEEN_ADMIN, shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Update canteen category' })];
        _removeCategory_decorators = [(0, common_1.Delete)('categories/:id'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Disable canteen category' })];
        _createProduct_decorators = [(0, common_1.Post)('products'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.CANTEEN_ADMIN, shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Create canteen product' })];
        _updateProduct_decorators = [(0, common_1.Patch)('products/:id'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.CANTEEN_ADMIN, shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Update canteen product' })];
        _uploadProductImage_decorators = [(0, common_1.Post)('products/image'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.CANTEEN_ADMIN, shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', { limits: { fileSize: avatar_upload_constants_1.MAX_AVATAR_UPLOAD_SIZE_BYTES } })), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Upload canteen product image' }), (0, swagger_1.ApiConsumes)('multipart/form-data'), (0, swagger_1.ApiBody)({
                schema: {
                    type: 'object',
                    required: ['image'],
                    properties: {
                        image: {
                            type: 'string',
                            format: 'binary',
                        },
                    },
                },
            })];
        _removeProduct_decorators = [(0, common_1.Delete)('products/:id'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Disable canteen product' })];
        __esDecorate(_classThis, null, _getCatalog_decorators, { kind: "method", name: "getCatalog", static: false, private: false, access: { has: function (obj) { return "getCatalog" in obj; }, get: function (obj) { return obj.getCatalog; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAdminCatalog_decorators, { kind: "method", name: "getAdminCatalog", static: false, private: false, access: { has: function (obj) { return "getAdminCatalog" in obj; }, get: function (obj) { return obj.getAdminCatalog; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createOrder_decorators, { kind: "method", name: "createOrder", static: false, private: false, access: { has: function (obj) { return "createOrder" in obj; }, get: function (obj) { return obj.createOrder; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _listMyOrders_decorators, { kind: "method", name: "listMyOrders", static: false, private: false, access: { has: function (obj) { return "listMyOrders" in obj; }, get: function (obj) { return obj.listMyOrders; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _listAdminOrders_decorators, { kind: "method", name: "listAdminOrders", static: false, private: false, access: { has: function (obj) { return "listAdminOrders" in obj; }, get: function (obj) { return obj.listAdminOrders; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteOrder_decorators, { kind: "method", name: "deleteOrder", static: false, private: false, access: { has: function (obj) { return "deleteOrder" in obj; }, get: function (obj) { return obj.deleteOrder; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteAdminOrder_decorators, { kind: "method", name: "deleteAdminOrder", static: false, private: false, access: { has: function (obj) { return "deleteAdminOrder" in obj; }, get: function (obj) { return obj.deleteAdminOrder; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _completeOrder_decorators, { kind: "method", name: "completeOrder", static: false, private: false, access: { has: function (obj) { return "completeOrder" in obj; }, get: function (obj) { return obj.completeOrder; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createPayment_decorators, { kind: "method", name: "createPayment", static: false, private: false, access: { has: function (obj) { return "createPayment" in obj; }, get: function (obj) { return obj.createPayment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createSepayPayment_decorators, { kind: "method", name: "createSepayPayment", static: false, private: false, access: { has: function (obj) { return "createSepayPayment" in obj; }, get: function (obj) { return obj.createSepayPayment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleMomoWebhook_decorators, { kind: "method", name: "handleMomoWebhook", static: false, private: false, access: { has: function (obj) { return "handleMomoWebhook" in obj; }, get: function (obj) { return obj.handleMomoWebhook; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleReturn_decorators, { kind: "method", name: "handleReturn", static: false, private: false, access: { has: function (obj) { return "handleReturn" in obj; }, get: function (obj) { return obj.handleReturn; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createCategory_decorators, { kind: "method", name: "createCategory", static: false, private: false, access: { has: function (obj) { return "createCategory" in obj; }, get: function (obj) { return obj.createCategory; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateCategory_decorators, { kind: "method", name: "updateCategory", static: false, private: false, access: { has: function (obj) { return "updateCategory" in obj; }, get: function (obj) { return obj.updateCategory; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _removeCategory_decorators, { kind: "method", name: "removeCategory", static: false, private: false, access: { has: function (obj) { return "removeCategory" in obj; }, get: function (obj) { return obj.removeCategory; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createProduct_decorators, { kind: "method", name: "createProduct", static: false, private: false, access: { has: function (obj) { return "createProduct" in obj; }, get: function (obj) { return obj.createProduct; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateProduct_decorators, { kind: "method", name: "updateProduct", static: false, private: false, access: { has: function (obj) { return "updateProduct" in obj; }, get: function (obj) { return obj.updateProduct; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _uploadProductImage_decorators, { kind: "method", name: "uploadProductImage", static: false, private: false, access: { has: function (obj) { return "uploadProductImage" in obj; }, get: function (obj) { return obj.uploadProductImage; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _removeProduct_decorators, { kind: "method", name: "removeProduct", static: false, private: false, access: { has: function (obj) { return "removeProduct" in obj; }, get: function (obj) { return obj.removeProduct; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CanteenController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CanteenController = _classThis;
}();
exports.CanteenController = CanteenController;
