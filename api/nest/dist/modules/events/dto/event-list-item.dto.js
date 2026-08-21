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
exports.EventListItemDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var EventListItemDto = function () {
    var _a;
    var _slug_decorators;
    var _slug_initializers = [];
    var _slug_extraInitializers = [];
    var _title_decorators;
    var _title_initializers = [];
    var _title_extraInitializers = [];
    var _sourceUrl_decorators;
    var _sourceUrl_initializers = [];
    var _sourceUrl_extraInitializers = [];
    var _dateLabel_decorators;
    var _dateLabel_initializers = [];
    var _dateLabel_extraInitializers = [];
    var _excerpt_decorators;
    var _excerpt_initializers = [];
    var _excerpt_extraInitializers = [];
    var _thumbnailUrl_decorators;
    var _thumbnailUrl_initializers = [];
    var _thumbnailUrl_extraInitializers = [];
    return _a = /** @class */ (function () {
            function EventListItemDto() {
                this.slug = __runInitializers(this, _slug_initializers, void 0);
                this.title = (__runInitializers(this, _slug_extraInitializers), __runInitializers(this, _title_initializers, void 0));
                this.sourceUrl = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _sourceUrl_initializers, void 0));
                this.dateLabel = (__runInitializers(this, _sourceUrl_extraInitializers), __runInitializers(this, _dateLabel_initializers, void 0));
                this.excerpt = (__runInitializers(this, _dateLabel_extraInitializers), __runInitializers(this, _excerpt_initializers, void 0));
                this.thumbnailUrl = (__runInitializers(this, _excerpt_extraInitializers), __runInitializers(this, _thumbnailUrl_initializers, void 0));
                __runInitializers(this, _thumbnailUrl_extraInitializers);
            }
            return EventListItemDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _slug_decorators = [(0, swagger_1.ApiProperty)({ example: 'uitseminar-worldquant-x-uit-xu-huong-viec-lam-trong-linh-vuc-cntt' })];
            _title_decorators = [(0, swagger_1.ApiProperty)()];
            _sourceUrl_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'https://www.uit.edu.vn/bai-viet/uitseminar-worldquant-x-uit-xu-huong-viec-lam-trong-linh-vuc-cntt',
                })];
            _dateLabel_decorators = [(0, swagger_1.ApiProperty)({ example: '17-04-2026' })];
            _excerpt_decorators = [(0, swagger_1.ApiProperty)()];
            _thumbnailUrl_decorators = [(0, swagger_1.ApiProperty)()];
            __esDecorate(null, null, _slug_decorators, { kind: "field", name: "slug", static: false, private: false, access: { has: function (obj) { return "slug" in obj; }, get: function (obj) { return obj.slug; }, set: function (obj, value) { obj.slug = value; } }, metadata: _metadata }, _slug_initializers, _slug_extraInitializers);
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _sourceUrl_decorators, { kind: "field", name: "sourceUrl", static: false, private: false, access: { has: function (obj) { return "sourceUrl" in obj; }, get: function (obj) { return obj.sourceUrl; }, set: function (obj, value) { obj.sourceUrl = value; } }, metadata: _metadata }, _sourceUrl_initializers, _sourceUrl_extraInitializers);
            __esDecorate(null, null, _dateLabel_decorators, { kind: "field", name: "dateLabel", static: false, private: false, access: { has: function (obj) { return "dateLabel" in obj; }, get: function (obj) { return obj.dateLabel; }, set: function (obj, value) { obj.dateLabel = value; } }, metadata: _metadata }, _dateLabel_initializers, _dateLabel_extraInitializers);
            __esDecorate(null, null, _excerpt_decorators, { kind: "field", name: "excerpt", static: false, private: false, access: { has: function (obj) { return "excerpt" in obj; }, get: function (obj) { return obj.excerpt; }, set: function (obj, value) { obj.excerpt = value; } }, metadata: _metadata }, _excerpt_initializers, _excerpt_extraInitializers);
            __esDecorate(null, null, _thumbnailUrl_decorators, { kind: "field", name: "thumbnailUrl", static: false, private: false, access: { has: function (obj) { return "thumbnailUrl" in obj; }, get: function (obj) { return obj.thumbnailUrl; }, set: function (obj, value) { obj.thumbnailUrl = value; } }, metadata: _metadata }, _thumbnailUrl_initializers, _thumbnailUrl_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.EventListItemDto = EventListItemDto;
