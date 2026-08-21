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
exports.UsersController = void 0;
var common_1 = require("@nestjs/common");
var platform_express_1 = require("@nestjs/platform-express");
var swagger_1 = require("@nestjs/swagger");
var shared_1 = require("@smart-campus/shared");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var roles_guard_1 = require("../../common/guards/roles.guard");
var avatar_upload_constants_1 = require("../storage/avatar-upload.constants");
var avatarUploadPipe = new common_1.ParseFilePipeBuilder()
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
var UsersController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Users'), (0, common_1.Controller)('users'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, swagger_1.ApiBearerAuth)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getProfile_decorators;
    var _updateProfile_decorators;
    var _uploadAvatar_decorators;
    var _getUsers_decorators;
    var _getUser_decorators;
    var _updateRole_decorators;
    var _updateActive_decorators;
    var _deleteUser_decorators;
    var UsersController = _classThis = /** @class */ (function () {
        function UsersController_1(usersService) {
            this.usersService = (__runInitializers(this, _instanceExtraInitializers), usersService);
        }
        UsersController_1.prototype.getProfile = function (userId) {
            return this.usersService.findById(userId);
        };
        UsersController_1.prototype.updateProfile = function (userId, dto) {
            return this.usersService.updateProfile(userId, dto);
        };
        UsersController_1.prototype.uploadAvatar = function (userId, file) {
            return this.usersService.updateAvatar(userId, file);
        };
        UsersController_1.prototype.getUsers = function (query) {
            return this.usersService.findAll(query);
        };
        UsersController_1.prototype.getUser = function (id) {
            return this.usersService.findById(id);
        };
        UsersController_1.prototype.updateRole = function (id, dto, actorId) {
            return this.usersService.updateRole(id, dto.role, actorId);
        };
        UsersController_1.prototype.updateActive = function (id, dto, actorId) {
            return this.usersService.updateActive(id, dto.isActive, actorId);
        };
        UsersController_1.prototype.deleteUser = function (id, actorId) {
            return this.usersService.deleteUser(id, actorId);
        };
        return UsersController_1;
    }());
    __setFunctionName(_classThis, "UsersController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getProfile_decorators = [(0, common_1.Get)('me'), (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' })];
        _updateProfile_decorators = [(0, common_1.Patch)('me'), (0, swagger_1.ApiOperation)({ summary: 'Update current user profile' })];
        _uploadAvatar_decorators = [(0, common_1.Post)('me/avatar'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('avatar', { limits: { fileSize: avatar_upload_constants_1.MAX_AVATAR_UPLOAD_SIZE_BYTES } })), (0, swagger_1.ApiOperation)({ summary: 'Upload current user avatar' }), (0, swagger_1.ApiConsumes)('multipart/form-data'), (0, swagger_1.ApiBody)({
                schema: {
                    type: 'object',
                    required: ['avatar'],
                    properties: {
                        avatar: {
                            type: 'string',
                            format: 'binary',
                        },
                    },
                },
            })];
        _getUsers_decorators = [(0, common_1.Get)(), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'List users for administrators' })];
        _getUser_decorators = [(0, common_1.Get)(':id'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Get a user by id for administrators' })];
        _updateRole_decorators = [(0, common_1.Patch)(':id/role'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Update a user role' })];
        _updateActive_decorators = [(0, common_1.Patch)(':id/active'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Enable or disable a user' })];
        _deleteUser_decorators = [(0, common_1.Delete)(':id'), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Delete a user account' })];
        __esDecorate(_classThis, null, _getProfile_decorators, { kind: "method", name: "getProfile", static: false, private: false, access: { has: function (obj) { return "getProfile" in obj; }, get: function (obj) { return obj.getProfile; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateProfile_decorators, { kind: "method", name: "updateProfile", static: false, private: false, access: { has: function (obj) { return "updateProfile" in obj; }, get: function (obj) { return obj.updateProfile; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _uploadAvatar_decorators, { kind: "method", name: "uploadAvatar", static: false, private: false, access: { has: function (obj) { return "uploadAvatar" in obj; }, get: function (obj) { return obj.uploadAvatar; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUsers_decorators, { kind: "method", name: "getUsers", static: false, private: false, access: { has: function (obj) { return "getUsers" in obj; }, get: function (obj) { return obj.getUsers; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUser_decorators, { kind: "method", name: "getUser", static: false, private: false, access: { has: function (obj) { return "getUser" in obj; }, get: function (obj) { return obj.getUser; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateRole_decorators, { kind: "method", name: "updateRole", static: false, private: false, access: { has: function (obj) { return "updateRole" in obj; }, get: function (obj) { return obj.updateRole; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateActive_decorators, { kind: "method", name: "updateActive", static: false, private: false, access: { has: function (obj) { return "updateActive" in obj; }, get: function (obj) { return obj.updateActive; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteUser_decorators, { kind: "method", name: "deleteUser", static: false, private: false, access: { has: function (obj) { return "deleteUser" in obj; }, get: function (obj) { return obj.deleteUser; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UsersController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UsersController = _classThis;
}();
exports.UsersController = UsersController;
