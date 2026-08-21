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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
var common_1 = require("@nestjs/common");
var shared_1 = require("@smart-campus/shared");
var avatar_upload_constants_1 = require("../storage/avatar-upload.constants");
var EMAIL_ALREADY_REGISTERED_MESSAGE = 'Email đã được đăng ký.';
var STUDENT_ID_ALREADY_REGISTERED_MESSAGE = 'MSSV đã được đăng ký.';
var USER_ALREADY_EXISTS_MESSAGE = 'Tài khoản đã tồn tại.';
var CANNOT_UPDATE_OWN_ROLE_MESSAGE = 'Không thể tự thay đổi vai trò của chính mình.';
var CANNOT_UPDATE_OWN_ACTIVE_STATE_MESSAGE = 'Không thể tự vô hiệu hóa chính mình.';
var CANNOT_DELETE_OWN_ACCOUNT_MESSAGE = 'Không thể tự xóa chính tài khoản đang đăng nhập.';
var UsersService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var UsersService = _classThis = /** @class */ (function () {
        function UsersService_1(prisma, avatarStorageService) {
            this.prisma = prisma;
            this.avatarStorageService = avatarStorageService;
            this.userSelect = {
                id: true,
                email: true,
                studentId: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                role: true,
                faculty: true,
                major: true,
                yearOfAdmission: true,
                phone: true,
                dateOfBirth: true,
                address: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            };
        }
        UsersService_1.prototype.create = function (data_1) {
            return __awaiter(this, arguments, void 0, function (data, client) {
                var existing, error_1, targets;
                if (client === void 0) { client = this.prisma; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, client.user.findUnique({
                                where: { email: data.email },
                            })];
                        case 1:
                            existing = _a.sent();
                            if (existing) {
                                throw new common_1.ConflictException(EMAIL_ALREADY_REGISTERED_MESSAGE);
                            }
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, client.user.create({
                                    data: data,
                                    select: {
                                        id: true,
                                        email: true,
                                        studentId: true,
                                        firstName: true,
                                        lastName: true,
                                        role: true,
                                        createdAt: true,
                                    },
                                })];
                        case 3: return [2 /*return*/, _a.sent()];
                        case 4:
                            error_1 = _a.sent();
                            if (this.isUniqueConstraintError(error_1)) {
                                targets = this.getUniqueConstraintTargets(error_1);
                                if (targets.includes('email')) {
                                    throw new common_1.ConflictException(EMAIL_ALREADY_REGISTERED_MESSAGE);
                                }
                                if (targets.includes('studentid') || targets.includes('student_id')) {
                                    throw new common_1.ConflictException(STUDENT_ID_ALREADY_REGISTERED_MESSAGE);
                                }
                                throw new common_1.ConflictException(USER_ALREADY_EXISTS_MESSAGE);
                            }
                            throw error_1;
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        UsersService_1.prototype.findAll = function () {
            return __awaiter(this, arguments, void 0, function (query) {
                var page, limit, skip, search, tokens, where, _a, items, total;
                var _b, _c, _d, _e;
                if (query === void 0) { query = {}; }
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            page = Math.max((_b = query.page) !== null && _b !== void 0 ? _b : shared_1.PAGINATION_DEFAULTS.PAGE, shared_1.PAGINATION_DEFAULTS.PAGE);
                            limit = Math.min(Math.max((_c = query.limit) !== null && _c !== void 0 ? _c : 25, 1), shared_1.PAGINATION_DEFAULTS.MAX_LIMIT);
                            skip = (page - 1) * limit;
                            search = (_d = query.search) === null || _d === void 0 ? void 0 : _d.trim();
                            tokens = (_e = search === null || search === void 0 ? void 0 : search.split(/\s+/).filter(Boolean)) !== null && _e !== void 0 ? _e : [];
                            where = this.buildFindAllWhere(tokens);
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.user.findMany({
                                        where: where,
                                        orderBy: { createdAt: 'desc' },
                                        skip: skip,
                                        take: limit,
                                        select: this.userSelect,
                                    }),
                                    this.prisma.user.count({ where: where }),
                                ])];
                        case 1:
                            _a = _f.sent(), items = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    items: items,
                                    meta: {
                                        total: total,
                                        page: page,
                                        limit: limit,
                                        totalPages: Math.max(1, Math.ceil(total / limit)),
                                    },
                                }];
                    }
                });
            });
        };
        UsersService_1.prototype.findById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.user.findUnique({
                                where: { id: id },
                                select: this.userSelect,
                            })];
                        case 1:
                            user = _a.sent();
                            if (!user) {
                                throw new common_1.NotFoundException('User not found');
                            }
                            return [2 /*return*/, user];
                    }
                });
            });
        };
        UsersService_1.prototype.updateProfile = function (id, data) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findById(id)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.prisma.user.update({
                                    where: { id: id },
                                    data: data,
                                    select: {
                                        id: true,
                                        email: true,
                                        firstName: true,
                                        lastName: true,
                                        phone: true,
                                        address: true,
                                        avatarUrl: true,
                                        updatedAt: true,
                                    },
                                })];
                    }
                });
            });
        };
        UsersService_1.prototype.updateAvatar = function (id, file) {
            return __awaiter(this, void 0, void 0, function () {
                var uploadedAsset;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findById(id)];
                        case 1:
                            _a.sent();
                            this.assertValidAvatarFile(file);
                            return [4 /*yield*/, this.avatarStorageService.uploadAvatar(id, file)];
                        case 2:
                            uploadedAsset = _a.sent();
                            return [2 /*return*/, this.prisma.user.update({
                                    where: { id: id },
                                    data: { avatarUrl: uploadedAsset.avatarUrl },
                                    select: {
                                        id: true,
                                        email: true,
                                        firstName: true,
                                        lastName: true,
                                        phone: true,
                                        address: true,
                                        avatarUrl: true,
                                        updatedAt: true,
                                    },
                                })];
                    }
                });
            });
        };
        UsersService_1.prototype.updateRole = function (id, role, actorId) {
            return __awaiter(this, void 0, void 0, function () {
                var user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (actorId && actorId === id) {
                                throw new common_1.BadRequestException(CANNOT_UPDATE_OWN_ROLE_MESSAGE);
                            }
                            return [4 /*yield*/, this.findById(id)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.user.update({
                                    where: { id: id },
                                    data: { role: role },
                                    select: this.userSelect,
                                })];
                        case 2:
                            user = _a.sent();
                            return [4 /*yield*/, this.prisma.refreshToken.deleteMany({ where: { userId: id } })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, user];
                    }
                });
            });
        };
        UsersService_1.prototype.updateActive = function (id, isActive, actorId) {
            return __awaiter(this, void 0, void 0, function () {
                var user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (actorId && actorId === id) {
                                throw new common_1.BadRequestException(CANNOT_UPDATE_OWN_ACTIVE_STATE_MESSAGE);
                            }
                            return [4 /*yield*/, this.findById(id)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.user.update({
                                    where: { id: id },
                                    data: { isActive: isActive },
                                    select: this.userSelect,
                                })];
                        case 2:
                            user = _a.sent();
                            return [4 /*yield*/, this.prisma.refreshToken.deleteMany({ where: { userId: id } })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, user];
                    }
                });
            });
        };
        UsersService_1.prototype.deleteUser = function (id, actorId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (actorId && actorId === id) {
                                throw new common_1.BadRequestException(CANNOT_DELETE_OWN_ACCOUNT_MESSAGE);
                            }
                            return [4 /*yield*/, this.findById(id)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.user.delete({
                                    where: { id: id },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { id: id, deleted: true }];
                    }
                });
            });
        };
        UsersService_1.prototype.assertValidAvatarFile = function (file) {
            if (!(file === null || file === void 0 ? void 0 : file.buffer) || !file.size) {
                throw new common_1.BadRequestException('Avatar file is required');
            }
            if (file.size > avatar_upload_constants_1.MAX_AVATAR_UPLOAD_SIZE_BYTES) {
                throw new common_1.BadRequestException('Avatar image must be 5 MB or smaller');
            }
            if (!avatar_upload_constants_1.ALLOWED_AVATAR_MIME_TYPES.has(file.mimetype)) {
                throw new common_1.BadRequestException('Only JPEG, PNG, and WebP images are allowed');
            }
        };
        UsersService_1.prototype.isUniqueConstraintError = function (error) {
            return (typeof error === 'object' &&
                error !== null &&
                'code' in error &&
                error.code === 'P2002');
        };
        UsersService_1.prototype.getUniqueConstraintTargets = function (error) {
            if (typeof error !== 'object' ||
                error === null ||
                !('meta' in error) ||
                typeof error.meta !== 'object' ||
                error.meta === null ||
                !('target' in error.meta) ||
                !Array.isArray(error.meta.target)) {
                return [];
            }
            return error.meta.target
                .filter(function (target) { return typeof target === 'string'; })
                .map(function (target) { return target.toLowerCase(); });
        };
        UsersService_1.prototype.buildFindAllWhere = function (tokens) {
            if (tokens.length === 0) {
                return undefined;
            }
            return {
                AND: tokens.map(function (token) { return ({
                    OR: [
                        { firstName: { contains: token, mode: 'insensitive' } },
                        { lastName: { contains: token, mode: 'insensitive' } },
                        { email: { contains: token, mode: 'insensitive' } },
                        { studentId: { contains: token, mode: 'insensitive' } },
                    ],
                }); }),
            };
        };
        return UsersService_1;
    }());
    __setFunctionName(_classThis, "UsersService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UsersService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UsersService = _classThis;
}();
exports.UsersService = UsersService;
