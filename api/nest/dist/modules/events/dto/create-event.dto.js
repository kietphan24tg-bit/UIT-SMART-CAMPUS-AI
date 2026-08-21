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
exports.CreateEventDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var client_1 = require("@prisma/client");
var class_validator_1 = require("class-validator");
var CreateEventDto = function () {
    var _a;
    var _slug_decorators;
    var _slug_initializers = [];
    var _slug_extraInitializers = [];
    var _title_decorators;
    var _title_initializers = [];
    var _title_extraInitializers = [];
    var _excerpt_decorators;
    var _excerpt_initializers = [];
    var _excerpt_extraInitializers = [];
    var _location_decorators;
    var _location_initializers = [];
    var _location_extraInitializers = [];
    var _contentHtml_decorators;
    var _contentHtml_initializers = [];
    var _contentHtml_extraInitializers = [];
    var _coverImageUrl_decorators;
    var _coverImageUrl_initializers = [];
    var _coverImageUrl_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _category_decorators;
    var _category_initializers = [];
    var _category_extraInitializers = [];
    var _startAt_decorators;
    var _startAt_initializers = [];
    var _startAt_extraInitializers = [];
    var _endAt_decorators;
    var _endAt_initializers = [];
    var _endAt_extraInitializers = [];
    var _maxAttendees_decorators;
    var _maxAttendees_initializers = [];
    var _maxAttendees_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateEventDto() {
                this.slug = __runInitializers(this, _slug_initializers, void 0);
                this.title = (__runInitializers(this, _slug_extraInitializers), __runInitializers(this, _title_initializers, void 0));
                this.excerpt = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _excerpt_initializers, void 0));
                this.location = (__runInitializers(this, _excerpt_extraInitializers), __runInitializers(this, _location_initializers, void 0));
                this.contentHtml = (__runInitializers(this, _location_extraInitializers), __runInitializers(this, _contentHtml_initializers, void 0));
                this.coverImageUrl = (__runInitializers(this, _contentHtml_extraInitializers), __runInitializers(this, _coverImageUrl_initializers, void 0));
                this.status = (__runInitializers(this, _coverImageUrl_extraInitializers), __runInitializers(this, _status_initializers, void 0));
                this.category = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _category_initializers, void 0));
                this.startAt = (__runInitializers(this, _category_extraInitializers), __runInitializers(this, _startAt_initializers, void 0));
                this.endAt = (__runInitializers(this, _startAt_extraInitializers), __runInitializers(this, _endAt_initializers, void 0));
                this.maxAttendees = (__runInitializers(this, _endAt_extraInitializers), __runInitializers(this, _maxAttendees_initializers, void 0));
                __runInitializers(this, _maxAttendees_extraInitializers);
            }
            return CreateEventDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _slug_decorators = [(0, swagger_1.ApiProperty)({ example: 'hoi-thao-iot-se346' }), (0, class_validator_1.IsString)()];
            _title_decorators = [(0, swagger_1.ApiProperty)({ example: 'Hoi thao IoT cho do an' }), (0, class_validator_1.IsString)()];
            _excerpt_decorators = [(0, swagger_1.ApiProperty)({ example: 'Tom tat ngan gon ve noi dung su kien' }), (0, class_validator_1.IsString)()];
            _location_decorators = [(0, swagger_1.ApiProperty)({ example: 'Phong E4.1' }), (0, class_validator_1.IsString)()];
            _contentHtml_decorators = [(0, swagger_1.ApiProperty)({ example: '<p>Noi dung HTML</p>' }), (0, class_validator_1.IsString)()];
            _coverImageUrl_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'https://www.uit.edu.vn/sites/vi/files/banner_uit_1.png' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _status_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: client_1.EventStatus, default: client_1.EventStatus.open }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(client_1.EventStatus)];
            _category_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: client_1.EventCategory, default: client_1.EventCategory.workshop }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(client_1.EventCategory)];
            _startAt_decorators = [(0, swagger_1.ApiProperty)({ example: '2026-04-28T08:30:00.000Z' }), (0, class_validator_1.IsDateString)()];
            _endAt_decorators = [(0, swagger_1.ApiProperty)({ example: '2026-04-28T10:30:00.000Z' }), (0, class_validator_1.IsDateString)()];
            _maxAttendees_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 80 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1)];
            __esDecorate(null, null, _slug_decorators, { kind: "field", name: "slug", static: false, private: false, access: { has: function (obj) { return "slug" in obj; }, get: function (obj) { return obj.slug; }, set: function (obj, value) { obj.slug = value; } }, metadata: _metadata }, _slug_initializers, _slug_extraInitializers);
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _excerpt_decorators, { kind: "field", name: "excerpt", static: false, private: false, access: { has: function (obj) { return "excerpt" in obj; }, get: function (obj) { return obj.excerpt; }, set: function (obj, value) { obj.excerpt = value; } }, metadata: _metadata }, _excerpt_initializers, _excerpt_extraInitializers);
            __esDecorate(null, null, _location_decorators, { kind: "field", name: "location", static: false, private: false, access: { has: function (obj) { return "location" in obj; }, get: function (obj) { return obj.location; }, set: function (obj, value) { obj.location = value; } }, metadata: _metadata }, _location_initializers, _location_extraInitializers);
            __esDecorate(null, null, _contentHtml_decorators, { kind: "field", name: "contentHtml", static: false, private: false, access: { has: function (obj) { return "contentHtml" in obj; }, get: function (obj) { return obj.contentHtml; }, set: function (obj, value) { obj.contentHtml = value; } }, metadata: _metadata }, _contentHtml_initializers, _contentHtml_extraInitializers);
            __esDecorate(null, null, _coverImageUrl_decorators, { kind: "field", name: "coverImageUrl", static: false, private: false, access: { has: function (obj) { return "coverImageUrl" in obj; }, get: function (obj) { return obj.coverImageUrl; }, set: function (obj, value) { obj.coverImageUrl = value; } }, metadata: _metadata }, _coverImageUrl_initializers, _coverImageUrl_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _category_decorators, { kind: "field", name: "category", static: false, private: false, access: { has: function (obj) { return "category" in obj; }, get: function (obj) { return obj.category; }, set: function (obj, value) { obj.category = value; } }, metadata: _metadata }, _category_initializers, _category_extraInitializers);
            __esDecorate(null, null, _startAt_decorators, { kind: "field", name: "startAt", static: false, private: false, access: { has: function (obj) { return "startAt" in obj; }, get: function (obj) { return obj.startAt; }, set: function (obj, value) { obj.startAt = value; } }, metadata: _metadata }, _startAt_initializers, _startAt_extraInitializers);
            __esDecorate(null, null, _endAt_decorators, { kind: "field", name: "endAt", static: false, private: false, access: { has: function (obj) { return "endAt" in obj; }, get: function (obj) { return obj.endAt; }, set: function (obj, value) { obj.endAt = value; } }, metadata: _metadata }, _endAt_initializers, _endAt_extraInitializers);
            __esDecorate(null, null, _maxAttendees_decorators, { kind: "field", name: "maxAttendees", static: false, private: false, access: { has: function (obj) { return "maxAttendees" in obj; }, get: function (obj) { return obj.maxAttendees; }, set: function (obj, value) { obj.maxAttendees = value; } }, metadata: _metadata }, _maxAttendees_initializers, _maxAttendees_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateEventDto = CreateEventDto;
