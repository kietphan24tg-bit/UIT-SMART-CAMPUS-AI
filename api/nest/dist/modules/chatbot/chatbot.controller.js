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
exports.ChatbotController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var shared_1 = require("@smart-campus/shared");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var roles_guard_1 = require("../../common/guards/roles.guard");
var ChatbotController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Chatbot'), (0, common_1.Controller)('chatbot'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, swagger_1.ApiBearerAuth)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _query_decorators;
    var _sessions_decorators;
    var _messages_decorators;
    var _summary_decorators;
    var _capabilities_decorators;
    var _upsertKnowledge_decorators;
    var _syncKnowledge_decorators;
    var ChatbotController = _classThis = /** @class */ (function () {
        function ChatbotController_1(chatbotService) {
            this.chatbotService = (__runInitializers(this, _instanceExtraInitializers), chatbotService);
        }
        ChatbotController_1.prototype.query = function (userId, role, dto) {
            return this.chatbotService.query(userId, role, dto);
        };
        ChatbotController_1.prototype.sessions = function (userId) {
            return this.chatbotService.listSessions(userId);
        };
        ChatbotController_1.prototype.messages = function (userId, sessionId) {
            return this.chatbotService.getMessages(userId, sessionId);
        };
        ChatbotController_1.prototype.summary = function (userId, role, query) {
            var _a;
            return this.chatbotService.getSummary(userId, role, (_a = query.scope) !== null && _a !== void 0 ? _a : 'today');
        };
        ChatbotController_1.prototype.capabilities = function (role) {
            return this.chatbotService.getCapabilities(role);
        };
        ChatbotController_1.prototype.upsertKnowledge = function (dto) {
            return this.chatbotService.upsertKnowledgeDocument(dto);
        };
        ChatbotController_1.prototype.syncKnowledge = function () {
            return this.chatbotService.syncKnowledgeDocuments();
        };
        return ChatbotController_1;
    }());
    __setFunctionName(_classThis, "ChatbotController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _query_decorators = [(0, common_1.Post)('query'), (0, swagger_1.ApiOperation)({ summary: 'Query internal chatbot (orchestrated live data + knowledge)' })];
        _sessions_decorators = [(0, common_1.Get)('sessions'), (0, swagger_1.ApiOperation)({ summary: 'List chatbot sessions for current user' })];
        _messages_decorators = [(0, common_1.Get)('sessions/:id/messages'), (0, swagger_1.ApiOperation)({ summary: 'Get chatbot messages by session id' })];
        _summary_decorators = [(0, common_1.Get)('summary'), (0, swagger_1.ApiOperation)({ summary: 'Get role-aware chatbot summary without creating a chat turn' })];
        _capabilities_decorators = [(0, common_1.Get)('capabilities'), (0, swagger_1.ApiOperation)({ summary: 'Get chatbot capabilities and quick prompts for current role' })];
        _upsertKnowledge_decorators = [(0, common_1.Post)('knowledge'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Upsert knowledge document for internal retrieval' })];
        _syncKnowledge_decorators = [(0, common_1.Post)('knowledge/sync'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Sync built-in knowledge documents from chatbot domains' })];
        __esDecorate(_classThis, null, _query_decorators, { kind: "method", name: "query", static: false, private: false, access: { has: function (obj) { return "query" in obj; }, get: function (obj) { return obj.query; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _sessions_decorators, { kind: "method", name: "sessions", static: false, private: false, access: { has: function (obj) { return "sessions" in obj; }, get: function (obj) { return obj.sessions; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _messages_decorators, { kind: "method", name: "messages", static: false, private: false, access: { has: function (obj) { return "messages" in obj; }, get: function (obj) { return obj.messages; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _summary_decorators, { kind: "method", name: "summary", static: false, private: false, access: { has: function (obj) { return "summary" in obj; }, get: function (obj) { return obj.summary; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _capabilities_decorators, { kind: "method", name: "capabilities", static: false, private: false, access: { has: function (obj) { return "capabilities" in obj; }, get: function (obj) { return obj.capabilities; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _upsertKnowledge_decorators, { kind: "method", name: "upsertKnowledge", static: false, private: false, access: { has: function (obj) { return "upsertKnowledge" in obj; }, get: function (obj) { return obj.upsertKnowledge; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _syncKnowledge_decorators, { kind: "method", name: "syncKnowledge", static: false, private: false, access: { has: function (obj) { return "syncKnowledge" in obj; }, get: function (obj) { return obj.syncKnowledge; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ChatbotController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ChatbotController = _classThis;
}();
exports.ChatbotController = ChatbotController;
