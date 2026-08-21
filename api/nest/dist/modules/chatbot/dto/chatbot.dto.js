"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetChatbotSummaryDto = exports.UpsertKnowledgeDocumentDto = exports.QueryChatbotDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var QueryChatbotDto = function () {
    var _a;
    var _message_decorators;
    var _message_initializers = [];
    var _message_extraInitializers = [];
    var _sessionId_decorators;
    var _sessionId_initializers = [];
    var _sessionId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function QueryChatbotDto() {
                this.message = __runInitializers(this, _message_initializers, void 0);
                this.sessionId = (__runInitializers(this, _message_extraInitializers), __runInitializers(this, _sessionId_initializers, void 0));
                __runInitializers(this, _sessionId_extraInitializers);
            }
            return QueryChatbotDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _message_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsString)()];
            _sessionId_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _message_decorators, { kind: "field", name: "message", static: false, private: false, access: { has: function (obj) { return "message" in obj; }, get: function (obj) { return obj.message; }, set: function (obj, value) { obj.message = value; } }, metadata: _metadata }, _message_initializers, _message_extraInitializers);
            __esDecorate(null, null, _sessionId_decorators, { kind: "field", name: "sessionId", static: false, private: false, access: { has: function (obj) { return "sessionId" in obj; }, get: function (obj) { return obj.sessionId; }, set: function (obj, value) { obj.sessionId = value; } }, metadata: _metadata }, _sessionId_initializers, _sessionId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.QueryChatbotDto = QueryChatbotDto;
var UpsertKnowledgeDocumentDto = function () {
    var _a;
    var _slug_decorators;
    var _slug_initializers = [];
    var _slug_extraInitializers = [];
    var _title_decorators;
    var _title_initializers = [];
    var _title_extraInitializers = [];
    var _source_decorators;
    var _source_initializers = [];
    var _source_extraInitializers = [];
    var _sourceUrl_decorators;
    var _sourceUrl_initializers = [];
    var _sourceUrl_extraInitializers = [];
    var _contentText_decorators;
    var _contentText_initializers = [];
    var _contentText_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpsertKnowledgeDocumentDto() {
                this.slug = __runInitializers(this, _slug_initializers, void 0);
                this.title = (__runInitializers(this, _slug_extraInitializers), __runInitializers(this, _title_initializers, void 0));
                this.source = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _source_initializers, void 0));
                this.sourceUrl = (__runInitializers(this, _source_extraInitializers), __runInitializers(this, _sourceUrl_initializers, void 0));
                this.contentText = (__runInitializers(this, _sourceUrl_extraInitializers), __runInitializers(this, _contentText_initializers, void 0));
                __runInitializers(this, _contentText_extraInitializers);
            }
            return UpsertKnowledgeDocumentDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _slug_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsString)()];
            _title_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsString)()];
            _source_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _sourceUrl_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _contentText_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _slug_decorators, { kind: "field", name: "slug", static: false, private: false, access: { has: function (obj) { return "slug" in obj; }, get: function (obj) { return obj.slug; }, set: function (obj, value) { obj.slug = value; } }, metadata: _metadata }, _slug_initializers, _slug_extraInitializers);
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _source_decorators, { kind: "field", name: "source", static: false, private: false, access: { has: function (obj) { return "source" in obj; }, get: function (obj) { return obj.source; }, set: function (obj, value) { obj.source = value; } }, metadata: _metadata }, _source_initializers, _source_extraInitializers);
            __esDecorate(null, null, _sourceUrl_decorators, { kind: "field", name: "sourceUrl", static: false, private: false, access: { has: function (obj) { return "sourceUrl" in obj; }, get: function (obj) { return obj.sourceUrl; }, set: function (obj, value) { obj.sourceUrl = value; } }, metadata: _metadata }, _sourceUrl_initializers, _sourceUrl_extraInitializers);
            __esDecorate(null, null, _contentText_decorators, { kind: "field", name: "contentText", static: false, private: false, access: { has: function (obj) { return "contentText" in obj; }, get: function (obj) { return obj.contentText; }, set: function (obj, value) { obj.contentText = value; } }, metadata: _metadata }, _contentText_initializers, _contentText_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpsertKnowledgeDocumentDto = UpsertKnowledgeDocumentDto;
var GetChatbotSummaryDto = function () {
    var _a;
    var _scope_decorators;
    var _scope_initializers = [];
    var _scope_extraInitializers = [];
    return _a = /** @class */ (function () {
            function GetChatbotSummaryDto() {
                this.scope = __runInitializers(this, _scope_initializers, void 0);
                __runInitializers(this, _scope_extraInitializers);
            }
            return GetChatbotSummaryDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _scope_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    enum: ['today', 'work', 'ops'],
                    default: 'today',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.IsIn)(['today', 'work', 'ops'])];
            __esDecorate(null, null, _scope_decorators, { kind: "field", name: "scope", static: false, private: false, access: { has: function (obj) { return "scope" in obj; }, get: function (obj) { return obj.scope; }, set: function (obj, value) { obj.scope = value; } }, metadata: _metadata }, _scope_initializers, _scope_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.GetChatbotSummaryDto = GetChatbotSummaryDto;
