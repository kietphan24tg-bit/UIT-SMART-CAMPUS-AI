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
exports.SosController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var roles_guard_1 = require("../../common/guards/roles.guard");
var SosController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('SOS'), (0, common_1.Controller)('sos'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, swagger_1.ApiBearerAuth)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _create_decorators;
    var _listActive_decorators;
    var _listMine_decorators;
    var _cancel_decorators;
    var _resolve_decorators;
    var _route_decorators;
    var SosController = _classThis = /** @class */ (function () {
        function SosController_1(sosService) {
            this.sosService = (__runInitializers(this, _instanceExtraInitializers), sosService);
        }
        SosController_1.prototype.create = function (userId, dto) {
            return this.sosService.createRequest(userId, dto);
        };
        SosController_1.prototype.listActive = function () {
            return this.sosService.listActiveRequests();
        };
        SosController_1.prototype.listMine = function (userId) {
            return this.sosService.listMyRequests(userId);
        };
        SosController_1.prototype.cancel = function (userId, requestId) {
            return this.sosService.cancelRequest(userId, requestId);
        };
        SosController_1.prototype.resolve = function (userId, role, requestId) {
            return this.sosService.resolveRequest(userId, role, requestId);
        };
        SosController_1.prototype.route = function (requestId, query) {
            return this.sosService.getRoute(requestId, query.fromLat, query.fromLng);
        };
        return SosController_1;
    }());
    __setFunctionName(_classThis, "SosController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiOperation)({ summary: 'Create SOS request (snapshot location only)' })];
        _listActive_decorators = [(0, common_1.Get)('active'), (0, swagger_1.ApiOperation)({ summary: 'List active SOS requests' })];
        _listMine_decorators = [(0, common_1.Get)('me'), (0, swagger_1.ApiOperation)({ summary: 'List current user SOS history' })];
        _cancel_decorators = [(0, common_1.Patch)(':id/cancel'), (0, swagger_1.ApiOperation)({ summary: 'Cancel my active SOS request' })];
        _resolve_decorators = [(0, common_1.Patch)(':id/resolve'), (0, swagger_1.ApiOperation)({ summary: 'Resolve SOS request by requester/admin' })];
        _route_decorators = [(0, common_1.Get)(':id/route'), (0, swagger_1.ApiOperation)({ summary: 'Get route from viewer location to SOS location' }), (0, swagger_1.ApiQuery)({ name: 'fromLat', required: true, type: Number }), (0, swagger_1.ApiQuery)({ name: 'fromLng', required: true, type: Number })];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _listActive_decorators, { kind: "method", name: "listActive", static: false, private: false, access: { has: function (obj) { return "listActive" in obj; }, get: function (obj) { return obj.listActive; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _listMine_decorators, { kind: "method", name: "listMine", static: false, private: false, access: { has: function (obj) { return "listMine" in obj; }, get: function (obj) { return obj.listMine; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _cancel_decorators, { kind: "method", name: "cancel", static: false, private: false, access: { has: function (obj) { return "cancel" in obj; }, get: function (obj) { return obj.cancel; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _resolve_decorators, { kind: "method", name: "resolve", static: false, private: false, access: { has: function (obj) { return "resolve" in obj; }, get: function (obj) { return obj.resolve; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _route_decorators, { kind: "method", name: "route", static: false, private: false, access: { has: function (obj) { return "route" in obj; }, get: function (obj) { return obj.route; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SosController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SosController = _classThis;
}();
exports.SosController = SosController;
