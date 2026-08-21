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
exports.PaymentsController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var PaymentsController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Payments'), (0, common_1.Controller)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _createMomoPayment_decorators;
    var _createSepayPayment_decorators;
    var _handleMomoWebhook_decorators;
    var _handleSepayWebhook_decorators;
    var _handleMomoReturn_decorators;
    var PaymentsController = _classThis = /** @class */ (function () {
        function PaymentsController_1(paymentsService) {
            this.paymentsService = (__runInitializers(this, _instanceExtraInitializers), paymentsService);
        }
        PaymentsController_1.prototype.createMomoPayment = function (userId, vehicleId) {
            return this.paymentsService.createMomoPayment(userId, vehicleId);
        };
        PaymentsController_1.prototype.createSepayPayment = function (userId, vehicleId) {
            return this.paymentsService.createSepayPayment(userId, vehicleId);
        };
        PaymentsController_1.prototype.handleMomoWebhook = function (payload) {
            return this.paymentsService.handleMomoWebhook(payload);
        };
        PaymentsController_1.prototype.handleSepayWebhook = function (payload, authorization) {
            return this.paymentsService.handleSepayWebhook(payload, authorization);
        };
        PaymentsController_1.prototype.handleMomoReturn = function (resultCode, orderId) {
            var isSuccess = String(resultCode !== null && resultCode !== void 0 ? resultCode : '').trim() === '0';
            var safeOrderId = (orderId === null || orderId === void 0 ? void 0 : orderId.trim()) || 'không xác định';
            return isSuccess
                ? "Thanh to\u00E1n MoMo cho \u0111\u01A1n ".concat(safeOrderId, " \u0111\u00E3 \u0111\u01B0\u1EE3c ghi nh\u1EADn. B\u1EA1n c\u00F3 th\u1EC3 quay l\u1EA1i \u1EE9ng d\u1EE5ng.")
                : "MoMo \u0111\u00E3 chuy\u1EC3n h\u01B0\u1EDBng v\u1EC1 h\u1EC7 th\u1ED1ng. Giao d\u1ECBch ".concat(safeOrderId, " \u0111ang ch\u1EDD \u0111\u1ED3ng b\u1ED9 k\u1EBFt qu\u1EA3.");
        };
        return PaymentsController_1;
    }());
    __setFunctionName(_classThis, "PaymentsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createMomoPayment_decorators = [(0, common_1.Post)('parking/subscriptions/:vehicleId/payments/momo'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Create a MoMo payment for parking subscription' })];
        _createSepayPayment_decorators = [(0, common_1.Post)('parking/subscriptions/:vehicleId/payments/sepay'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Create a SePay QR payment for parking subscription' })];
        _handleMomoWebhook_decorators = [(0, common_1.Post)('payments/momo/webhook'), (0, swagger_1.ApiOperation)({ summary: 'Handle MoMo webhook callback' })];
        _handleSepayWebhook_decorators = [(0, common_1.Post)('payments/sepay/webhook'), (0, swagger_1.ApiOperation)({ summary: 'Handle SePay webhook callback' })];
        _handleMomoReturn_decorators = [(0, common_1.Get)('payments/momo/return'), (0, common_1.Header)('Content-Type', 'text/plain; charset=utf-8'), (0, swagger_1.ApiOperation)({ summary: 'Handle MoMo redirect return' })];
        __esDecorate(_classThis, null, _createMomoPayment_decorators, { kind: "method", name: "createMomoPayment", static: false, private: false, access: { has: function (obj) { return "createMomoPayment" in obj; }, get: function (obj) { return obj.createMomoPayment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createSepayPayment_decorators, { kind: "method", name: "createSepayPayment", static: false, private: false, access: { has: function (obj) { return "createSepayPayment" in obj; }, get: function (obj) { return obj.createSepayPayment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleMomoWebhook_decorators, { kind: "method", name: "handleMomoWebhook", static: false, private: false, access: { has: function (obj) { return "handleMomoWebhook" in obj; }, get: function (obj) { return obj.handleMomoWebhook; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleSepayWebhook_decorators, { kind: "method", name: "handleSepayWebhook", static: false, private: false, access: { has: function (obj) { return "handleSepayWebhook" in obj; }, get: function (obj) { return obj.handleSepayWebhook; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleMomoReturn_decorators, { kind: "method", name: "handleMomoReturn", static: false, private: false, access: { has: function (obj) { return "handleMomoReturn" in obj; }, get: function (obj) { return obj.handleMomoReturn; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PaymentsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PaymentsController = _classThis;
}();
exports.PaymentsController = PaymentsController;
