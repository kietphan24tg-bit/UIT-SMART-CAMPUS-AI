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
exports.LibraryController = void 0;
var common_1 = require("@nestjs/common");
var platform_express_1 = require("@nestjs/platform-express");
var swagger_1 = require("@nestjs/swagger");
var swagger_2 = require("@nestjs/swagger");
var client_1 = require("@prisma/client");
var shared_1 = require("@smart-campus/shared");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var roles_guard_1 = require("../../common/guards/roles.guard");
var avatar_upload_constants_1 = require("../storage/avatar-upload.constants");
var bookCoverUploadPipe = new common_1.ParseFilePipeBuilder()
    .addFileTypeValidator({
    fileType: /^(image\/jpeg|image\/jpg|image\/png|image\/webp)$/,
})
    .addMaxSizeValidator({
    maxSize: avatar_upload_constants_1.MAX_AVATAR_UPLOAD_SIZE_BYTES,
})
    .build({
    fileIsRequired: true,
    errorHttpStatusCode: common_1.HttpStatus.BAD_REQUEST,
});
var LibraryController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Library'), (0, common_1.Controller)('library'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, swagger_1.ApiBearerAuth)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _listBooks_decorators;
    var _getBook_decorators;
    var _getMyLoans_decorators;
    var _getMyLoanRequests_decorators;
    var _createLoanRequest_decorators;
    var _getLoanRequest_decorators;
    var _cancelLoanRequest_decorators;
    var _deleteLoanRequest_decorators;
    var _getMyReservations_decorators;
    var _createReservation_decorators;
    var _cancelReservation_decorators;
    var _renewLoan_decorators;
    var _deleteOwnLoan_decorators;
    var _createBook_decorators;
    var _getAdminBooks_decorators;
    var _uploadBookCover_decorators;
    var _updateBook_decorators;
    var _deleteBook_decorators;
    var _getAdminLoanRequests_decorators;
    var _approveLoanRequest_decorators;
    var _rejectLoanRequest_decorators;
    var _createCopy_decorators;
    var _updateCopy_decorators;
    var _deleteCopy_decorators;
    var _checkout_decorators;
    var _checkin_decorators;
    var _getAdminLoans_decorators;
    var _deleteLoan_decorators;
    var _markLost_decorators;
    var _markMaintenance_decorators;
    var LibraryController = _classThis = /** @class */ (function () {
        function LibraryController_1(libraryService) {
            this.libraryService = (__runInitializers(this, _instanceExtraInitializers), libraryService);
        }
        LibraryController_1.prototype.listBooks = function (query) {
            return this.libraryService.listBooks(query);
        };
        LibraryController_1.prototype.getBook = function (id) {
            return this.libraryService.getBook(id);
        };
        LibraryController_1.prototype.getMyLoans = function (userId) {
            return this.libraryService.listMyLoans(userId);
        };
        LibraryController_1.prototype.getMyLoanRequests = function (userId, query) {
            return this.libraryService.listMyLoanRequests(userId, query.status);
        };
        LibraryController_1.prototype.createLoanRequest = function (userId, dto) {
            return this.libraryService.createLoanRequest(userId, dto);
        };
        LibraryController_1.prototype.getLoanRequest = function (requestId, userId, role) {
            var isAdmin = role === client_1.Role.admin || role === client_1.Role.super_admin;
            return this.libraryService.getLoanRequest(requestId, userId, isAdmin);
        };
        LibraryController_1.prototype.cancelLoanRequest = function (requestId, userId) {
            return this.libraryService.cancelLoanRequest(requestId, userId);
        };
        LibraryController_1.prototype.deleteLoanRequest = function (requestId, userId) {
            return this.libraryService.deleteLoanRequest(requestId, userId);
        };
        LibraryController_1.prototype.getMyReservations = function (userId) {
            return this.libraryService.listMyReservations(userId);
        };
        LibraryController_1.prototype.createReservation = function (userId, dto) {
            return this.libraryService.createReservation(userId, dto);
        };
        LibraryController_1.prototype.cancelReservation = function (userId, role, reservationId) {
            var isAdmin = role === client_1.Role.admin || role === client_1.Role.super_admin;
            return this.libraryService.cancelReservation(userId, reservationId, isAdmin);
        };
        LibraryController_1.prototype.renewLoan = function (userId, role, loanId) {
            return this.libraryService.renewLoan(userId, role, loanId);
        };
        LibraryController_1.prototype.deleteOwnLoan = function (loanId, userId) {
            return this.libraryService.deleteReturnedLoan(loanId, userId, false);
        };
        LibraryController_1.prototype.createBook = function (dto) {
            return this.libraryService.createBook(dto);
        };
        LibraryController_1.prototype.getAdminBooks = function () {
            return this.libraryService.listAdminBooks();
        };
        LibraryController_1.prototype.uploadBookCover = function (actorId, file) {
            return this.libraryService.uploadBookCover(actorId, file);
        };
        LibraryController_1.prototype.updateBook = function (bookId, dto) {
            return this.libraryService.updateBook(bookId, dto);
        };
        LibraryController_1.prototype.deleteBook = function (bookId) {
            return this.libraryService.deleteBook(bookId);
        };
        LibraryController_1.prototype.getAdminLoanRequests = function (query) {
            return this.libraryService.listAdminLoanRequests(query.status);
        };
        LibraryController_1.prototype.approveLoanRequest = function (requestId, approverId) {
            return this.libraryService.approveLoanRequest(requestId, approverId);
        };
        LibraryController_1.prototype.rejectLoanRequest = function (requestId, approverId) {
            return this.libraryService.rejectLoanRequest(requestId, approverId);
        };
        LibraryController_1.prototype.createCopy = function (bookId, dto) {
            return this.libraryService.addCopy(bookId, dto);
        };
        LibraryController_1.prototype.updateCopy = function (copyId, dto) {
            return this.libraryService.updateCopy(copyId, dto);
        };
        LibraryController_1.prototype.deleteCopy = function (copyId) {
            return this.libraryService.deleteCopy(copyId);
        };
        LibraryController_1.prototype.checkout = function (dto) {
            return this.libraryService.checkout(dto);
        };
        LibraryController_1.prototype.checkin = function (loanId, note) {
            return this.libraryService.checkin(loanId, note);
        };
        LibraryController_1.prototype.getAdminLoans = function () {
            return this.libraryService.listAdminLoans();
        };
        LibraryController_1.prototype.deleteLoan = function (loanId) {
            return this.libraryService.deleteReturnedLoan(loanId, null, true);
        };
        LibraryController_1.prototype.markLost = function (copyId, conditionNote) {
            return this.libraryService.markCopyStatus(copyId, 'lost', conditionNote);
        };
        LibraryController_1.prototype.markMaintenance = function (copyId, conditionNote) {
            return this.libraryService.markCopyStatus(copyId, 'maintenance', conditionNote);
        };
        return LibraryController_1;
    }());
    __setFunctionName(_classThis, "LibraryController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _listBooks_decorators = [(0, common_1.Get)('books'), (0, swagger_1.ApiOperation)({ summary: 'List books for in-app library search' }), (0, swagger_1.ApiQuery)({ name: 'q', required: false, type: String }), (0, swagger_1.ApiQuery)({ name: 'subject', required: false, type: String }), (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number })];
        _getBook_decorators = [(0, common_1.Get)('books/:id'), (0, swagger_1.ApiOperation)({ summary: 'Get book detail with copy inventory' })];
        _getMyLoans_decorators = [(0, common_1.Get)('me/loans'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.STUDENT, shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiOperation)({ summary: 'Get current user loan history' })];
        _getMyLoanRequests_decorators = [(0, common_1.Get)('me/loan-requests'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.STUDENT, shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiOperation)({ summary: 'Get current user loan requests' }), (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: client_1.LibraryLoanRequestStatus })];
        _createLoanRequest_decorators = [(0, common_1.Post)('loan-requests'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.STUDENT, shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiOperation)({ summary: 'Create a library loan request' })];
        _getLoanRequest_decorators = [(0, common_1.Get)('loan-requests/:id'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.STUDENT, shared_1.USER_ROLES.LECTURER, shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Get library loan request detail' })];
        _cancelLoanRequest_decorators = [(0, common_1.Patch)('loan-requests/:id/cancel'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.STUDENT, shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiOperation)({ summary: 'Cancel a pending library loan request' })];
        _deleteLoanRequest_decorators = [(0, common_1.Delete)('loan-requests/:id'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.STUDENT, shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiOperation)({ summary: 'Delete an owned cancelled library loan request' })];
        _getMyReservations_decorators = [(0, common_1.Get)('me/reservations'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.STUDENT, shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiOperation)({ summary: 'Get current user reservations' })];
        _createReservation_decorators = [(0, common_1.Post)('reservations'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.STUDENT, shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiOperation)({ summary: 'Reserve a book' })];
        _cancelReservation_decorators = [(0, common_1.Delete)('reservations/:id'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.STUDENT, shared_1.USER_ROLES.LECTURER, shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Cancel reservation by requester or admin' })];
        _renewLoan_decorators = [(0, common_1.Patch)('loans/:id/renew'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.STUDENT, shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiOperation)({ summary: 'Renew a loan by borrower policy' })];
        _deleteOwnLoan_decorators = [(0, common_1.Delete)('loans/:id'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.STUDENT, shared_1.USER_ROLES.LECTURER), (0, swagger_1.ApiOperation)({ summary: 'Delete an owned returned loan record' })];
        _createBook_decorators = [(0, common_1.Post)('admin/books'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Create library book' })];
        _getAdminBooks_decorators = [(0, common_1.Get)('admin/books'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'List library books for admin management' })];
        _uploadBookCover_decorators = [(0, common_1.Post)('admin/books/cover'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('cover', { limits: { fileSize: avatar_upload_constants_1.MAX_AVATAR_UPLOAD_SIZE_BYTES } })), (0, swagger_1.ApiOperation)({ summary: 'Upload library book cover image' }), (0, swagger_2.ApiConsumes)('multipart/form-data'), (0, swagger_2.ApiBody)({
                schema: {
                    type: 'object',
                    required: ['cover'],
                    properties: {
                        cover: {
                            type: 'string',
                            format: 'binary',
                        },
                    },
                },
            })];
        _updateBook_decorators = [(0, common_1.Patch)('admin/books/:id'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Update library book' })];
        _deleteBook_decorators = [(0, common_1.Delete)('admin/books/:id'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Delete library book when no related data exists' })];
        _getAdminLoanRequests_decorators = [(0, common_1.Get)('admin/loan-requests'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Get library loan request queue for admin' }), (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: client_1.LibraryLoanRequestStatus })];
        _approveLoanRequest_decorators = [(0, common_1.Patch)('admin/loan-requests/:id/approve'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Approve a pending library loan request and create loan' })];
        _rejectLoanRequest_decorators = [(0, common_1.Patch)('admin/loan-requests/:id/reject'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Reject a pending library loan request' })];
        _createCopy_decorators = [(0, common_1.Post)('admin/books/:id/copies'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Create library copy' })];
        _updateCopy_decorators = [(0, common_1.Patch)('admin/copies/:id'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Update library copy metadata' })];
        _deleteCopy_decorators = [(0, common_1.Delete)('admin/copies/:id'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Delete library copy when no related data exists' })];
        _checkout_decorators = [(0, common_1.Post)('admin/check-out'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Check out copy to borrower' })];
        _checkin_decorators = [(0, common_1.Patch)('admin/loans/:id/check-in'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Check in a loan and release copy' })];
        _getAdminLoans_decorators = [(0, common_1.Get)('admin/loans'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'List active library loans for admin return processing' })];
        _deleteLoan_decorators = [(0, common_1.Delete)('admin/loans/:id'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Delete a returned loan record' })];
        _markLost_decorators = [(0, common_1.Patch)('admin/copies/:id/mark-lost'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Mark copy as lost' })];
        _markMaintenance_decorators = [(0, common_1.Patch)('admin/copies/:id/mark-maintenance'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Mark copy as maintenance' })];
        __esDecorate(_classThis, null, _listBooks_decorators, { kind: "method", name: "listBooks", static: false, private: false, access: { has: function (obj) { return "listBooks" in obj; }, get: function (obj) { return obj.listBooks; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBook_decorators, { kind: "method", name: "getBook", static: false, private: false, access: { has: function (obj) { return "getBook" in obj; }, get: function (obj) { return obj.getBook; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMyLoans_decorators, { kind: "method", name: "getMyLoans", static: false, private: false, access: { has: function (obj) { return "getMyLoans" in obj; }, get: function (obj) { return obj.getMyLoans; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMyLoanRequests_decorators, { kind: "method", name: "getMyLoanRequests", static: false, private: false, access: { has: function (obj) { return "getMyLoanRequests" in obj; }, get: function (obj) { return obj.getMyLoanRequests; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createLoanRequest_decorators, { kind: "method", name: "createLoanRequest", static: false, private: false, access: { has: function (obj) { return "createLoanRequest" in obj; }, get: function (obj) { return obj.createLoanRequest; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getLoanRequest_decorators, { kind: "method", name: "getLoanRequest", static: false, private: false, access: { has: function (obj) { return "getLoanRequest" in obj; }, get: function (obj) { return obj.getLoanRequest; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _cancelLoanRequest_decorators, { kind: "method", name: "cancelLoanRequest", static: false, private: false, access: { has: function (obj) { return "cancelLoanRequest" in obj; }, get: function (obj) { return obj.cancelLoanRequest; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteLoanRequest_decorators, { kind: "method", name: "deleteLoanRequest", static: false, private: false, access: { has: function (obj) { return "deleteLoanRequest" in obj; }, get: function (obj) { return obj.deleteLoanRequest; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMyReservations_decorators, { kind: "method", name: "getMyReservations", static: false, private: false, access: { has: function (obj) { return "getMyReservations" in obj; }, get: function (obj) { return obj.getMyReservations; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createReservation_decorators, { kind: "method", name: "createReservation", static: false, private: false, access: { has: function (obj) { return "createReservation" in obj; }, get: function (obj) { return obj.createReservation; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _cancelReservation_decorators, { kind: "method", name: "cancelReservation", static: false, private: false, access: { has: function (obj) { return "cancelReservation" in obj; }, get: function (obj) { return obj.cancelReservation; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _renewLoan_decorators, { kind: "method", name: "renewLoan", static: false, private: false, access: { has: function (obj) { return "renewLoan" in obj; }, get: function (obj) { return obj.renewLoan; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteOwnLoan_decorators, { kind: "method", name: "deleteOwnLoan", static: false, private: false, access: { has: function (obj) { return "deleteOwnLoan" in obj; }, get: function (obj) { return obj.deleteOwnLoan; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createBook_decorators, { kind: "method", name: "createBook", static: false, private: false, access: { has: function (obj) { return "createBook" in obj; }, get: function (obj) { return obj.createBook; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAdminBooks_decorators, { kind: "method", name: "getAdminBooks", static: false, private: false, access: { has: function (obj) { return "getAdminBooks" in obj; }, get: function (obj) { return obj.getAdminBooks; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _uploadBookCover_decorators, { kind: "method", name: "uploadBookCover", static: false, private: false, access: { has: function (obj) { return "uploadBookCover" in obj; }, get: function (obj) { return obj.uploadBookCover; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateBook_decorators, { kind: "method", name: "updateBook", static: false, private: false, access: { has: function (obj) { return "updateBook" in obj; }, get: function (obj) { return obj.updateBook; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteBook_decorators, { kind: "method", name: "deleteBook", static: false, private: false, access: { has: function (obj) { return "deleteBook" in obj; }, get: function (obj) { return obj.deleteBook; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAdminLoanRequests_decorators, { kind: "method", name: "getAdminLoanRequests", static: false, private: false, access: { has: function (obj) { return "getAdminLoanRequests" in obj; }, get: function (obj) { return obj.getAdminLoanRequests; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _approveLoanRequest_decorators, { kind: "method", name: "approveLoanRequest", static: false, private: false, access: { has: function (obj) { return "approveLoanRequest" in obj; }, get: function (obj) { return obj.approveLoanRequest; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _rejectLoanRequest_decorators, { kind: "method", name: "rejectLoanRequest", static: false, private: false, access: { has: function (obj) { return "rejectLoanRequest" in obj; }, get: function (obj) { return obj.rejectLoanRequest; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createCopy_decorators, { kind: "method", name: "createCopy", static: false, private: false, access: { has: function (obj) { return "createCopy" in obj; }, get: function (obj) { return obj.createCopy; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateCopy_decorators, { kind: "method", name: "updateCopy", static: false, private: false, access: { has: function (obj) { return "updateCopy" in obj; }, get: function (obj) { return obj.updateCopy; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteCopy_decorators, { kind: "method", name: "deleteCopy", static: false, private: false, access: { has: function (obj) { return "deleteCopy" in obj; }, get: function (obj) { return obj.deleteCopy; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _checkout_decorators, { kind: "method", name: "checkout", static: false, private: false, access: { has: function (obj) { return "checkout" in obj; }, get: function (obj) { return obj.checkout; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _checkin_decorators, { kind: "method", name: "checkin", static: false, private: false, access: { has: function (obj) { return "checkin" in obj; }, get: function (obj) { return obj.checkin; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAdminLoans_decorators, { kind: "method", name: "getAdminLoans", static: false, private: false, access: { has: function (obj) { return "getAdminLoans" in obj; }, get: function (obj) { return obj.getAdminLoans; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteLoan_decorators, { kind: "method", name: "deleteLoan", static: false, private: false, access: { has: function (obj) { return "deleteLoan" in obj; }, get: function (obj) { return obj.deleteLoan; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _markLost_decorators, { kind: "method", name: "markLost", static: false, private: false, access: { has: function (obj) { return "markLost" in obj; }, get: function (obj) { return obj.markLost; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _markMaintenance_decorators, { kind: "method", name: "markMaintenance", static: false, private: false, access: { has: function (obj) { return "markMaintenance" in obj; }, get: function (obj) { return obj.markMaintenance; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        LibraryController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return LibraryController = _classThis;
}();
exports.LibraryController = LibraryController;
