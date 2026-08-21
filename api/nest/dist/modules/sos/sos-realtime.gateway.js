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
exports.SosRealtimeGateway = exports.SOS_REALTIME_NAMESPACE = void 0;
var common_1 = require("@nestjs/common");
var websockets_1 = require("@nestjs/websockets");
exports.SOS_REALTIME_NAMESPACE = '/sos-live';
var SOS_REALTIME_ROOM = 'sos:feed';
var SosRealtimeGateway = function () {
    var _classDecorators = [(0, websockets_1.WebSocketGateway)({
            namespace: exports.SOS_REALTIME_NAMESPACE,
            cors: {
                origin: '*',
            },
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _server_decorators;
    var _server_initializers = [];
    var _server_extraInitializers = [];
    var _handleSubscribe_decorators;
    var SosRealtimeGateway = _classThis = /** @class */ (function () {
        function SosRealtimeGateway_1() {
            this.logger = (__runInitializers(this, _instanceExtraInitializers), new common_1.Logger(SosRealtimeGateway.name));
            this.server = __runInitializers(this, _server_initializers, void 0);
            __runInitializers(this, _server_extraInitializers);
        }
        SosRealtimeGateway_1.prototype.handleSubscribe = function (client, _payload) {
            void client.join(SOS_REALTIME_ROOM);
            this.logger.debug("Client ".concat(client.id, " subscribed to ").concat(SOS_REALTIME_ROOM));
            client.emit('sos:subscribed', { scope: 'feed' });
        };
        SosRealtimeGateway_1.prototype.publish = function (event, payload) {
            var _a, _b;
            (_a = this.server) === null || _a === void 0 ? void 0 : _a.to(SOS_REALTIME_ROOM).emit(event, payload);
            (_b = this.server) === null || _b === void 0 ? void 0 : _b.to(SOS_REALTIME_ROOM).emit('sos:updated', payload);
        };
        return SosRealtimeGateway_1;
    }());
    __setFunctionName(_classThis, "SosRealtimeGateway");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _server_decorators = [(0, websockets_1.WebSocketServer)()];
        _handleSubscribe_decorators = [(0, websockets_1.SubscribeMessage)('sos:subscribe')];
        __esDecorate(_classThis, null, _handleSubscribe_decorators, { kind: "method", name: "handleSubscribe", static: false, private: false, access: { has: function (obj) { return "handleSubscribe" in obj; }, get: function (obj) { return obj.handleSubscribe; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, null, _server_decorators, { kind: "field", name: "server", static: false, private: false, access: { has: function (obj) { return "server" in obj; }, get: function (obj) { return obj.server; }, set: function (obj, value) { obj.server = value; } }, metadata: _metadata }, _server_initializers, _server_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SosRealtimeGateway = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SosRealtimeGateway = _classThis;
}();
exports.SosRealtimeGateway = SosRealtimeGateway;
