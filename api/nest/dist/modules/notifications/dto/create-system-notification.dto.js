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
exports.CreateSystemNotificationDto = exports.NotificationAudienceDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var shared_1 = require("@smart-campus/shared");
var class_transformer_1 = require("class-transformer");
var class_validator_1 = require("class-validator");
var NOTIFICATION_AUDIENCE_SCOPES = ['all', 'roles', 'class_section'];
var NotificationAudienceDto = function () {
    var _a;
    var _scope_decorators;
    var _scope_initializers = [];
    var _scope_extraInitializers = [];
    var _roles_decorators;
    var _roles_initializers = [];
    var _roles_extraInitializers = [];
    var _classSectionId_decorators;
    var _classSectionId_initializers = [];
    var _classSectionId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function NotificationAudienceDto() {
                this.scope = __runInitializers(this, _scope_initializers, void 0);
                this.roles = (__runInitializers(this, _scope_extraInitializers), __runInitializers(this, _roles_initializers, void 0));
                this.classSectionId = (__runInitializers(this, _roles_extraInitializers), __runInitializers(this, _classSectionId_initializers, void 0));
                __runInitializers(this, _classSectionId_extraInitializers);
            }
            return NotificationAudienceDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _scope_decorators = [(0, swagger_1.ApiProperty)({ enum: NOTIFICATION_AUDIENCE_SCOPES, example: 'roles' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsIn)(NOTIFICATION_AUDIENCE_SCOPES)];
            _roles_decorators = [(0, swagger_1.ApiPropertyOptional)({ isArray: true, enum: shared_1.ACTIVE_USER_ROLES }), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(shared_1.ACTIVE_USER_ROLES, { each: true })];
            _classSectionId_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'class-section-id' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _scope_decorators, { kind: "field", name: "scope", static: false, private: false, access: { has: function (obj) { return "scope" in obj; }, get: function (obj) { return obj.scope; }, set: function (obj, value) { obj.scope = value; } }, metadata: _metadata }, _scope_initializers, _scope_extraInitializers);
            __esDecorate(null, null, _roles_decorators, { kind: "field", name: "roles", static: false, private: false, access: { has: function (obj) { return "roles" in obj; }, get: function (obj) { return obj.roles; }, set: function (obj, value) { obj.roles = value; } }, metadata: _metadata }, _roles_initializers, _roles_extraInitializers);
            __esDecorate(null, null, _classSectionId_decorators, { kind: "field", name: "classSectionId", static: false, private: false, access: { has: function (obj) { return "classSectionId" in obj; }, get: function (obj) { return obj.classSectionId; }, set: function (obj, value) { obj.classSectionId = value; } }, metadata: _metadata }, _classSectionId_initializers, _classSectionId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.NotificationAudienceDto = NotificationAudienceDto;
var CreateSystemNotificationDto = function () {
    var _a;
    var _title_decorators;
    var _title_initializers = [];
    var _title_extraInitializers = [];
    var _body_decorators;
    var _body_initializers = [];
    var _body_extraInitializers = [];
    var _type_decorators;
    var _type_initializers = [];
    var _type_extraInitializers = [];
    var _data_decorators;
    var _data_initializers = [];
    var _data_extraInitializers = [];
    var _audience_decorators;
    var _audience_initializers = [];
    var _audience_extraInitializers = [];
    var _roles_decorators;
    var _roles_initializers = [];
    var _roles_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateSystemNotificationDto() {
                this.title = __runInitializers(this, _title_initializers, void 0);
                this.body = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _body_initializers, void 0));
                this.type = (__runInitializers(this, _body_extraInitializers), __runInitializers(this, _type_initializers, void 0));
                this.data = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _data_initializers, void 0));
                this.audience = (__runInitializers(this, _data_extraInitializers), __runInitializers(this, _audience_initializers, void 0));
                this.roles = (__runInitializers(this, _audience_extraInitializers), __runInitializers(this, _roles_initializers, void 0));
                __runInitializers(this, _roles_extraInitializers);
            }
            return CreateSystemNotificationDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _title_decorators = [(0, swagger_1.ApiProperty)({ example: 'Campus reminder' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _body_decorators = [(0, swagger_1.ApiProperty)({ example: 'The main entrance will close at 10 PM today.' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _type_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'general' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _data_decorators = [(0, swagger_1.ApiPropertyOptional)({ type: 'object', additionalProperties: true }), (0, class_validator_1.IsObject)(), (0, class_validator_1.IsOptional)()];
            _audience_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    type: NotificationAudienceDto,
                    example: { scope: 'roles', roles: [shared_1.ACTIVE_USER_ROLES[0]] },
                }), (0, class_validator_1.ValidateNested)(), (0, class_transformer_1.Type)(function () { return NotificationAudienceDto; }), (0, class_validator_1.IsOptional)()];
            _roles_decorators = [(0, swagger_1.ApiPropertyOptional)({ isArray: true, enum: shared_1.ACTIVE_USER_ROLES }), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(shared_1.ACTIVE_USER_ROLES, { each: true })];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _body_decorators, { kind: "field", name: "body", static: false, private: false, access: { has: function (obj) { return "body" in obj; }, get: function (obj) { return obj.body; }, set: function (obj, value) { obj.body = value; } }, metadata: _metadata }, _body_initializers, _body_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: function (obj) { return "type" in obj; }, get: function (obj) { return obj.type; }, set: function (obj, value) { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _data_decorators, { kind: "field", name: "data", static: false, private: false, access: { has: function (obj) { return "data" in obj; }, get: function (obj) { return obj.data; }, set: function (obj, value) { obj.data = value; } }, metadata: _metadata }, _data_initializers, _data_extraInitializers);
            __esDecorate(null, null, _audience_decorators, { kind: "field", name: "audience", static: false, private: false, access: { has: function (obj) { return "audience" in obj; }, get: function (obj) { return obj.audience; }, set: function (obj, value) { obj.audience = value; } }, metadata: _metadata }, _audience_initializers, _audience_extraInitializers);
            __esDecorate(null, null, _roles_decorators, { kind: "field", name: "roles", static: false, private: false, access: { has: function (obj) { return "roles" in obj; }, get: function (obj) { return obj.roles; }, set: function (obj, value) { obj.roles = value; } }, metadata: _metadata }, _roles_initializers, _roles_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateSystemNotificationDto = CreateSystemNotificationDto;
