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
exports.DeleteNotificationsQueryDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_transformer_1 = require("class-transformer");
var class_validator_1 = require("class-validator");
var ALERT_CATEGORIES = [
    'general',
    'academic',
    'payment',
    'emergency',
];
function toOptionalBoolean(value) {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        var normalized = value.trim().toLowerCase();
        if (normalized === 'true') {
            return true;
        }
        if (normalized === 'false') {
            return false;
        }
    }
    return value;
}
var DeleteNotificationsQueryDto = function () {
    var _a;
    var _category_decorators;
    var _category_initializers = [];
    var _category_extraInitializers = [];
    var _unreadOnly_decorators;
    var _unreadOnly_initializers = [];
    var _unreadOnly_extraInitializers = [];
    return _a = /** @class */ (function () {
            function DeleteNotificationsQueryDto() {
                this.category = __runInitializers(this, _category_initializers, void 0);
                this.unreadOnly = (__runInitializers(this, _category_extraInitializers), __runInitializers(this, _unreadOnly_initializers, void 0));
                __runInitializers(this, _unreadOnly_extraInitializers);
            }
            return DeleteNotificationsQueryDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _category_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: ALERT_CATEGORIES }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(ALERT_CATEGORIES)];
            _unreadOnly_decorators = [(0, swagger_1.ApiPropertyOptional)({ type: Boolean }), (0, class_transformer_1.Transform)(function (_b) {
                    var value = _b.value;
                    return toOptionalBoolean(value);
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            __esDecorate(null, null, _category_decorators, { kind: "field", name: "category", static: false, private: false, access: { has: function (obj) { return "category" in obj; }, get: function (obj) { return obj.category; }, set: function (obj, value) { obj.category = value; } }, metadata: _metadata }, _category_initializers, _category_extraInitializers);
            __esDecorate(null, null, _unreadOnly_decorators, { kind: "field", name: "unreadOnly", static: false, private: false, access: { has: function (obj) { return "unreadOnly" in obj; }, get: function (obj) { return obj.unreadOnly; }, set: function (obj, value) { obj.unreadOnly = value; } }, metadata: _metadata }, _unreadOnly_initializers, _unreadOnly_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.DeleteNotificationsQueryDto = DeleteNotificationsQueryDto;
