"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.ListLibraryBooksQueryDto = exports.ListLibraryLoanRequestsQueryDto = exports.CreateLibraryLoanRequestDto = exports.CreateReservationDto = exports.CheckoutLibraryLoanDto = exports.UpdateLibraryCopyDto = exports.CreateLibraryCopyDto = exports.UpdateLibraryBookDto = exports.CreateLibraryBookDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var client_1 = require("@prisma/client");
var class_validator_1 = require("class-validator");
var CreateLibraryBookDto = function () {
    var _a;
    var _title_decorators;
    var _title_initializers = [];
    var _title_extraInitializers = [];
    var _authors_decorators;
    var _authors_initializers = [];
    var _authors_extraInitializers = [];
    var _subtitle_decorators;
    var _subtitle_initializers = [];
    var _subtitle_extraInitializers = [];
    var _openLibraryId_decorators;
    var _openLibraryId_initializers = [];
    var _openLibraryId_extraInitializers = [];
    var _isbn13_decorators;
    var _isbn13_initializers = [];
    var _isbn13_extraInitializers = [];
    var _subjects_decorators;
    var _subjects_initializers = [];
    var _subjects_extraInitializers = [];
    var _publisher_decorators;
    var _publisher_initializers = [];
    var _publisher_extraInitializers = [];
    var _publishedAt_decorators;
    var _publishedAt_initializers = [];
    var _publishedAt_extraInitializers = [];
    var _language_decorators;
    var _language_initializers = [];
    var _language_extraInitializers = [];
    var _coverUrl_decorators;
    var _coverUrl_initializers = [];
    var _coverUrl_extraInitializers = [];
    var _description_decorators;
    var _description_initializers = [];
    var _description_extraInitializers = [];
    var _shelfCode_decorators;
    var _shelfCode_initializers = [];
    var _shelfCode_extraInitializers = [];
    var _isActive_decorators;
    var _isActive_initializers = [];
    var _isActive_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateLibraryBookDto() {
                this.title = __runInitializers(this, _title_initializers, void 0);
                this.authors = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _authors_initializers, void 0));
                this.subtitle = (__runInitializers(this, _authors_extraInitializers), __runInitializers(this, _subtitle_initializers, void 0));
                this.openLibraryId = (__runInitializers(this, _subtitle_extraInitializers), __runInitializers(this, _openLibraryId_initializers, void 0));
                this.isbn13 = (__runInitializers(this, _openLibraryId_extraInitializers), __runInitializers(this, _isbn13_initializers, void 0));
                this.subjects = (__runInitializers(this, _isbn13_extraInitializers), __runInitializers(this, _subjects_initializers, void 0));
                this.publisher = (__runInitializers(this, _subjects_extraInitializers), __runInitializers(this, _publisher_initializers, void 0));
                this.publishedAt = (__runInitializers(this, _publisher_extraInitializers), __runInitializers(this, _publishedAt_initializers, void 0));
                this.language = (__runInitializers(this, _publishedAt_extraInitializers), __runInitializers(this, _language_initializers, void 0));
                this.coverUrl = (__runInitializers(this, _language_extraInitializers), __runInitializers(this, _coverUrl_initializers, void 0));
                this.description = (__runInitializers(this, _coverUrl_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                this.shelfCode = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _shelfCode_initializers, void 0));
                this.isActive = (__runInitializers(this, _shelfCode_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
                __runInitializers(this, _isActive_extraInitializers);
            }
            return CreateLibraryBookDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _title_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsString)()];
            _authors_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsString)()];
            _subtitle_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _openLibraryId_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _isbn13_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _subjects_decorators = [(0, swagger_1.ApiPropertyOptional)({ type: [String] }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true })];
            _publisher_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _publishedAt_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _language_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _coverUrl_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _description_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _shelfCode_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _isActive_decorators = [(0, swagger_1.ApiPropertyOptional)({ default: true }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _authors_decorators, { kind: "field", name: "authors", static: false, private: false, access: { has: function (obj) { return "authors" in obj; }, get: function (obj) { return obj.authors; }, set: function (obj, value) { obj.authors = value; } }, metadata: _metadata }, _authors_initializers, _authors_extraInitializers);
            __esDecorate(null, null, _subtitle_decorators, { kind: "field", name: "subtitle", static: false, private: false, access: { has: function (obj) { return "subtitle" in obj; }, get: function (obj) { return obj.subtitle; }, set: function (obj, value) { obj.subtitle = value; } }, metadata: _metadata }, _subtitle_initializers, _subtitle_extraInitializers);
            __esDecorate(null, null, _openLibraryId_decorators, { kind: "field", name: "openLibraryId", static: false, private: false, access: { has: function (obj) { return "openLibraryId" in obj; }, get: function (obj) { return obj.openLibraryId; }, set: function (obj, value) { obj.openLibraryId = value; } }, metadata: _metadata }, _openLibraryId_initializers, _openLibraryId_extraInitializers);
            __esDecorate(null, null, _isbn13_decorators, { kind: "field", name: "isbn13", static: false, private: false, access: { has: function (obj) { return "isbn13" in obj; }, get: function (obj) { return obj.isbn13; }, set: function (obj, value) { obj.isbn13 = value; } }, metadata: _metadata }, _isbn13_initializers, _isbn13_extraInitializers);
            __esDecorate(null, null, _subjects_decorators, { kind: "field", name: "subjects", static: false, private: false, access: { has: function (obj) { return "subjects" in obj; }, get: function (obj) { return obj.subjects; }, set: function (obj, value) { obj.subjects = value; } }, metadata: _metadata }, _subjects_initializers, _subjects_extraInitializers);
            __esDecorate(null, null, _publisher_decorators, { kind: "field", name: "publisher", static: false, private: false, access: { has: function (obj) { return "publisher" in obj; }, get: function (obj) { return obj.publisher; }, set: function (obj, value) { obj.publisher = value; } }, metadata: _metadata }, _publisher_initializers, _publisher_extraInitializers);
            __esDecorate(null, null, _publishedAt_decorators, { kind: "field", name: "publishedAt", static: false, private: false, access: { has: function (obj) { return "publishedAt" in obj; }, get: function (obj) { return obj.publishedAt; }, set: function (obj, value) { obj.publishedAt = value; } }, metadata: _metadata }, _publishedAt_initializers, _publishedAt_extraInitializers);
            __esDecorate(null, null, _language_decorators, { kind: "field", name: "language", static: false, private: false, access: { has: function (obj) { return "language" in obj; }, get: function (obj) { return obj.language; }, set: function (obj, value) { obj.language = value; } }, metadata: _metadata }, _language_initializers, _language_extraInitializers);
            __esDecorate(null, null, _coverUrl_decorators, { kind: "field", name: "coverUrl", static: false, private: false, access: { has: function (obj) { return "coverUrl" in obj; }, get: function (obj) { return obj.coverUrl; }, set: function (obj, value) { obj.coverUrl = value; } }, metadata: _metadata }, _coverUrl_initializers, _coverUrl_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _shelfCode_decorators, { kind: "field", name: "shelfCode", static: false, private: false, access: { has: function (obj) { return "shelfCode" in obj; }, get: function (obj) { return obj.shelfCode; }, set: function (obj, value) { obj.shelfCode = value; } }, metadata: _metadata }, _shelfCode_initializers, _shelfCode_extraInitializers);
            __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: function (obj) { return "isActive" in obj; }, get: function (obj) { return obj.isActive; }, set: function (obj, value) { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateLibraryBookDto = CreateLibraryBookDto;
var UpdateLibraryBookDto = /** @class */ (function (_super) {
    __extends(UpdateLibraryBookDto, _super);
    function UpdateLibraryBookDto() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return UpdateLibraryBookDto;
}((0, swagger_1.PartialType)(CreateLibraryBookDto)));
exports.UpdateLibraryBookDto = UpdateLibraryBookDto;
var CreateLibraryCopyDto = function () {
    var _a;
    var _copyCode_decorators;
    var _copyCode_initializers = [];
    var _copyCode_extraInitializers = [];
    var _conditionNote_decorators;
    var _conditionNote_initializers = [];
    var _conditionNote_extraInitializers = [];
    var _acquiredAt_decorators;
    var _acquiredAt_initializers = [];
    var _acquiredAt_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateLibraryCopyDto() {
                this.copyCode = __runInitializers(this, _copyCode_initializers, void 0);
                this.conditionNote = (__runInitializers(this, _copyCode_extraInitializers), __runInitializers(this, _conditionNote_initializers, void 0));
                this.acquiredAt = (__runInitializers(this, _conditionNote_extraInitializers), __runInitializers(this, _acquiredAt_initializers, void 0));
                __runInitializers(this, _acquiredAt_extraInitializers);
            }
            return CreateLibraryCopyDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _copyCode_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsString)()];
            _conditionNote_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _acquiredAt_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _copyCode_decorators, { kind: "field", name: "copyCode", static: false, private: false, access: { has: function (obj) { return "copyCode" in obj; }, get: function (obj) { return obj.copyCode; }, set: function (obj, value) { obj.copyCode = value; } }, metadata: _metadata }, _copyCode_initializers, _copyCode_extraInitializers);
            __esDecorate(null, null, _conditionNote_decorators, { kind: "field", name: "conditionNote", static: false, private: false, access: { has: function (obj) { return "conditionNote" in obj; }, get: function (obj) { return obj.conditionNote; }, set: function (obj, value) { obj.conditionNote = value; } }, metadata: _metadata }, _conditionNote_initializers, _conditionNote_extraInitializers);
            __esDecorate(null, null, _acquiredAt_decorators, { kind: "field", name: "acquiredAt", static: false, private: false, access: { has: function (obj) { return "acquiredAt" in obj; }, get: function (obj) { return obj.acquiredAt; }, set: function (obj, value) { obj.acquiredAt = value; } }, metadata: _metadata }, _acquiredAt_initializers, _acquiredAt_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateLibraryCopyDto = CreateLibraryCopyDto;
var UpdateLibraryCopyDto = /** @class */ (function (_super) {
    __extends(UpdateLibraryCopyDto, _super);
    function UpdateLibraryCopyDto() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return UpdateLibraryCopyDto;
}((0, swagger_1.PartialType)(CreateLibraryCopyDto)));
exports.UpdateLibraryCopyDto = UpdateLibraryCopyDto;
var CheckoutLibraryLoanDto = function () {
    var _a;
    var _borrowerId_decorators;
    var _borrowerId_initializers = [];
    var _borrowerId_extraInitializers = [];
    var _copyId_decorators;
    var _copyId_initializers = [];
    var _copyId_extraInitializers = [];
    var _note_decorators;
    var _note_initializers = [];
    var _note_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CheckoutLibraryLoanDto() {
                this.borrowerId = __runInitializers(this, _borrowerId_initializers, void 0);
                this.copyId = (__runInitializers(this, _borrowerId_extraInitializers), __runInitializers(this, _copyId_initializers, void 0));
                this.note = (__runInitializers(this, _copyId_extraInitializers), __runInitializers(this, _note_initializers, void 0));
                __runInitializers(this, _note_extraInitializers);
            }
            return CheckoutLibraryLoanDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _borrowerId_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsString)()];
            _copyId_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _note_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _borrowerId_decorators, { kind: "field", name: "borrowerId", static: false, private: false, access: { has: function (obj) { return "borrowerId" in obj; }, get: function (obj) { return obj.borrowerId; }, set: function (obj, value) { obj.borrowerId = value; } }, metadata: _metadata }, _borrowerId_initializers, _borrowerId_extraInitializers);
            __esDecorate(null, null, _copyId_decorators, { kind: "field", name: "copyId", static: false, private: false, access: { has: function (obj) { return "copyId" in obj; }, get: function (obj) { return obj.copyId; }, set: function (obj, value) { obj.copyId = value; } }, metadata: _metadata }, _copyId_initializers, _copyId_extraInitializers);
            __esDecorate(null, null, _note_decorators, { kind: "field", name: "note", static: false, private: false, access: { has: function (obj) { return "note" in obj; }, get: function (obj) { return obj.note; }, set: function (obj, value) { obj.note = value; } }, metadata: _metadata }, _note_initializers, _note_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CheckoutLibraryLoanDto = CheckoutLibraryLoanDto;
var CreateReservationDto = function () {
    var _a;
    var _bookId_decorators;
    var _bookId_initializers = [];
    var _bookId_extraInitializers = [];
    var _note_decorators;
    var _note_initializers = [];
    var _note_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateReservationDto() {
                this.bookId = __runInitializers(this, _bookId_initializers, void 0);
                this.note = (__runInitializers(this, _bookId_extraInitializers), __runInitializers(this, _note_initializers, void 0));
                __runInitializers(this, _note_extraInitializers);
            }
            return CreateReservationDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _bookId_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsString)()];
            _note_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _bookId_decorators, { kind: "field", name: "bookId", static: false, private: false, access: { has: function (obj) { return "bookId" in obj; }, get: function (obj) { return obj.bookId; }, set: function (obj, value) { obj.bookId = value; } }, metadata: _metadata }, _bookId_initializers, _bookId_extraInitializers);
            __esDecorate(null, null, _note_decorators, { kind: "field", name: "note", static: false, private: false, access: { has: function (obj) { return "note" in obj; }, get: function (obj) { return obj.note; }, set: function (obj, value) { obj.note = value; } }, metadata: _metadata }, _note_initializers, _note_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateReservationDto = CreateReservationDto;
var CreateLibraryLoanRequestDto = function () {
    var _a;
    var _bookId_decorators;
    var _bookId_initializers = [];
    var _bookId_extraInitializers = [];
    var _copyId_decorators;
    var _copyId_initializers = [];
    var _copyId_extraInitializers = [];
    var _note_decorators;
    var _note_initializers = [];
    var _note_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateLibraryLoanRequestDto() {
                this.bookId = __runInitializers(this, _bookId_initializers, void 0);
                this.copyId = (__runInitializers(this, _bookId_extraInitializers), __runInitializers(this, _copyId_initializers, void 0));
                this.note = (__runInitializers(this, _copyId_extraInitializers), __runInitializers(this, _note_initializers, void 0));
                __runInitializers(this, _note_extraInitializers);
            }
            return CreateLibraryLoanRequestDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _bookId_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsString)()];
            _copyId_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsString)()];
            _note_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _bookId_decorators, { kind: "field", name: "bookId", static: false, private: false, access: { has: function (obj) { return "bookId" in obj; }, get: function (obj) { return obj.bookId; }, set: function (obj, value) { obj.bookId = value; } }, metadata: _metadata }, _bookId_initializers, _bookId_extraInitializers);
            __esDecorate(null, null, _copyId_decorators, { kind: "field", name: "copyId", static: false, private: false, access: { has: function (obj) { return "copyId" in obj; }, get: function (obj) { return obj.copyId; }, set: function (obj, value) { obj.copyId = value; } }, metadata: _metadata }, _copyId_initializers, _copyId_extraInitializers);
            __esDecorate(null, null, _note_decorators, { kind: "field", name: "note", static: false, private: false, access: { has: function (obj) { return "note" in obj; }, get: function (obj) { return obj.note; }, set: function (obj, value) { obj.note = value; } }, metadata: _metadata }, _note_initializers, _note_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateLibraryLoanRequestDto = CreateLibraryLoanRequestDto;
var ListLibraryLoanRequestsQueryDto = function () {
    var _a;
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ListLibraryLoanRequestsQueryDto() {
                this.status = __runInitializers(this, _status_initializers, void 0);
                __runInitializers(this, _status_extraInitializers);
            }
            return ListLibraryLoanRequestsQueryDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _status_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: client_1.LibraryLoanRequestStatus }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(client_1.LibraryLoanRequestStatus)];
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ListLibraryLoanRequestsQueryDto = ListLibraryLoanRequestsQueryDto;
var ListLibraryBooksQueryDto = function () {
    var _a;
    var _q_decorators;
    var _q_initializers = [];
    var _q_extraInitializers = [];
    var _subject_decorators;
    var _subject_initializers = [];
    var _subject_extraInitializers = [];
    var _page_decorators;
    var _page_initializers = [];
    var _page_extraInitializers = [];
    var _limit_decorators;
    var _limit_initializers = [];
    var _limit_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ListLibraryBooksQueryDto() {
                this.q = __runInitializers(this, _q_initializers, void 0);
                this.subject = (__runInitializers(this, _q_extraInitializers), __runInitializers(this, _subject_initializers, void 0));
                this.page = (__runInitializers(this, _subject_extraInitializers), __runInitializers(this, _page_initializers, void 0));
                this.limit = (__runInitializers(this, _page_extraInitializers), __runInitializers(this, _limit_initializers, void 0));
                __runInitializers(this, _limit_extraInitializers);
            }
            return ListLibraryBooksQueryDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _q_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _subject_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _page_decorators = [(0, swagger_1.ApiPropertyOptional)({ default: 1 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1)];
            _limit_decorators = [(0, swagger_1.ApiPropertyOptional)({ default: 20 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1)];
            __esDecorate(null, null, _q_decorators, { kind: "field", name: "q", static: false, private: false, access: { has: function (obj) { return "q" in obj; }, get: function (obj) { return obj.q; }, set: function (obj, value) { obj.q = value; } }, metadata: _metadata }, _q_initializers, _q_extraInitializers);
            __esDecorate(null, null, _subject_decorators, { kind: "field", name: "subject", static: false, private: false, access: { has: function (obj) { return "subject" in obj; }, get: function (obj) { return obj.subject; }, set: function (obj, value) { obj.subject = value; } }, metadata: _metadata }, _subject_initializers, _subject_extraInitializers);
            __esDecorate(null, null, _page_decorators, { kind: "field", name: "page", static: false, private: false, access: { has: function (obj) { return "page" in obj; }, get: function (obj) { return obj.page; }, set: function (obj, value) { obj.page = value; } }, metadata: _metadata }, _page_initializers, _page_extraInitializers);
            __esDecorate(null, null, _limit_decorators, { kind: "field", name: "limit", static: false, private: false, access: { has: function (obj) { return "limit" in obj; }, get: function (obj) { return obj.limit; }, set: function (obj, value) { obj.limit = value; } }, metadata: _metadata }, _limit_initializers, _limit_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ListLibraryBooksQueryDto = ListLibraryBooksQueryDto;
