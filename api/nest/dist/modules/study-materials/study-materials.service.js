"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
exports.StudyMaterialsService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var shared_1 = require("@smart-campus/shared");
var study_material_file_name_1 = require("./study-material-file-name");
function normalizePaging(page, limit) {
    var safePage = Number.isInteger(page) && page && page > 0 ? page : 1;
    var safeLimit = Number.isInteger(limit) && limit && limit > 0 ? Math.min(limit, 50) : 20;
    return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}
function isAdminRole(role) {
    return role === client_1.Role.admin || role === client_1.Role.super_admin;
}
function toOptionalTrimmedString(value) {
    var trimmed = value === null || value === void 0 ? void 0 : value.trim();
    return trimmed ? trimmed : null;
}
var StudyMaterialsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var StudyMaterialsService = _classThis = /** @class */ (function () {
        function StudyMaterialsService_1(prisma, storageService) {
            this.prisma = prisma;
            this.storageService = storageService;
        }
        StudyMaterialsService_1.prototype.list = function (actorId, actorRole, query) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, page, limit, skip, tokens, where, _b, items, total;
                var _this = this;
                var _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            _a = normalizePaging(query.page, query.limit), page = _a.page, limit = _a.limit, skip = _a.skip;
                            tokens = (_c = query.q) === null || _c === void 0 ? void 0 : _c.trim().split(/\s+/).map(function (token) { return token.trim(); }).filter(Boolean);
                            where = __assign(__assign({}, (query.category ? { category: query.category } : {})), ((tokens === null || tokens === void 0 ? void 0 : tokens.length)
                                ? {
                                    AND: tokens.map(function (token) { return ({
                                        OR: [
                                            { title: { contains: token, mode: 'insensitive' } },
                                            { description: { contains: token, mode: 'insensitive' } },
                                            { fileName: { contains: token, mode: 'insensitive' } },
                                            { uploader: { is: { firstName: { contains: token, mode: 'insensitive' } } } },
                                            { uploader: { is: { lastName: { contains: token, mode: 'insensitive' } } } },
                                            { uploader: { is: { email: { contains: token, mode: 'insensitive' } } } },
                                        ],
                                    }); }),
                                }
                                : {}));
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.studyMaterial.findMany({
                                        where: where,
                                        orderBy: [{ createdAt: 'desc' }],
                                        skip: skip,
                                        take: limit,
                                        include: {
                                            uploader: {
                                                select: {
                                                    id: true,
                                                    firstName: true,
                                                    lastName: true,
                                                    studentId: true,
                                                    role: true,
                                                },
                                            },
                                        },
                                    }),
                                    this.prisma.studyMaterial.count({ where: where }),
                                ])];
                        case 1:
                            _b = _d.sent(), items = _b[0], total = _b[1];
                            return [2 /*return*/, {
                                    items: items.map(function (item) { return _this.toRecord(item, actorId, actorRole); }),
                                    page: page,
                                    limit: limit,
                                    total: total,
                                    totalPages: Math.max(1, Math.ceil(total / limit)),
                                }];
                    }
                });
            });
        };
        StudyMaterialsService_1.prototype.create = function (actorId, actorRole, dto, file) {
            return __awaiter(this, void 0, void 0, function () {
                var title, uploaded, normalizedFileName, created;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            title = dto.title.trim();
                            if (!title) {
                                throw new common_1.BadRequestException('Tieu de tai lieu khong duoc de trong');
                            }
                            return [4 /*yield*/, this.storageService.uploadStudyMaterialFile(actorId, file)];
                        case 1:
                            uploaded = _a.sent();
                            normalizedFileName = (0, study_material_file_name_1.normalizeStudyMaterialFileName)(file.originalname, "study-material-".concat(Date.now()));
                            return [4 /*yield*/, this.prisma.studyMaterial.create({
                                    data: {
                                        category: dto.category,
                                        title: title,
                                        description: toOptionalTrimmedString(dto.description),
                                        fileUrl: uploaded.fileUrl,
                                        storageKey: uploaded.key,
                                        fileName: normalizedFileName,
                                        mimeType: file.mimetype,
                                        fileSizeBytes: file.size,
                                        uploaderId: actorId,
                                    },
                                    include: {
                                        uploader: {
                                            select: {
                                                id: true,
                                                firstName: true,
                                                lastName: true,
                                                studentId: true,
                                                role: true,
                                            },
                                        },
                                    },
                                })];
                        case 2:
                            created = _a.sent();
                            return [2 /*return*/, this.toRecord(created, actorId, actorRole)];
                    }
                });
            });
        };
        StudyMaterialsService_1.prototype.update = function (materialId, actorId, actorRole, dto, file) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, nextTitle, uploaded, _a, normalizedFileName, updated;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.assertCanManageMaterial(materialId, actorId, actorRole)];
                        case 1:
                            existing = _d.sent();
                            nextTitle = dto.title !== undefined ? dto.title.trim() : existing.title;
                            if (!nextTitle) {
                                throw new common_1.BadRequestException('Tieu de tai lieu khong duoc de trong');
                            }
                            if (!file) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.storageService.uploadStudyMaterialFile(existing.uploaderId, file)];
                        case 2:
                            _a = _d.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            _a = null;
                            _d.label = 4;
                        case 4:
                            uploaded = _a;
                            normalizedFileName = file
                                ? (0, study_material_file_name_1.normalizeStudyMaterialFileName)(file.originalname, existing.fileName)
                                : existing.fileName;
                            return [4 /*yield*/, this.prisma.studyMaterial.update({
                                    where: { id: materialId },
                                    data: __assign(__assign(__assign(__assign({}, (dto.category !== undefined ? { category: dto.category } : {})), (dto.title !== undefined ? { title: nextTitle } : {})), (dto.description !== undefined
                                        ? { description: toOptionalTrimmedString(dto.description) }
                                        : {})), (uploaded
                                        ? {
                                            fileUrl: uploaded.fileUrl,
                                            storageKey: uploaded.key,
                                            fileName: normalizedFileName,
                                            mimeType: (_b = file === null || file === void 0 ? void 0 : file.mimetype) !== null && _b !== void 0 ? _b : existing.mimeType,
                                            fileSizeBytes: (_c = file === null || file === void 0 ? void 0 : file.size) !== null && _c !== void 0 ? _c : existing.fileSizeBytes,
                                        }
                                        : {})),
                                    include: {
                                        uploader: {
                                            select: {
                                                id: true,
                                                firstName: true,
                                                lastName: true,
                                                studentId: true,
                                                role: true,
                                            },
                                        },
                                    },
                                })];
                        case 5:
                            updated = _d.sent();
                            return [2 /*return*/, this.toRecord(updated, actorId, actorRole)];
                    }
                });
            });
        };
        StudyMaterialsService_1.prototype.remove = function (materialId, actorId, actorRole) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.assertCanManageMaterial(materialId, actorId, actorRole)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.studyMaterial.delete({
                                    where: { id: materialId },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { id: materialId, deleted: true }];
                    }
                });
            });
        };
        StudyMaterialsService_1.prototype.assertCanManageMaterial = function (materialId, actorId, actorRole) {
            return __awaiter(this, void 0, void 0, function () {
                var material;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.studyMaterial.findUnique({
                                where: { id: materialId },
                                select: {
                                    id: true,
                                    title: true,
                                    description: true,
                                    category: true,
                                    fileName: true,
                                    mimeType: true,
                                    fileSizeBytes: true,
                                    uploaderId: true,
                                },
                            })];
                        case 1:
                            material = _a.sent();
                            if (!material) {
                                throw new common_1.NotFoundException('Khong tim thay tai lieu');
                            }
                            if (material.uploaderId !== actorId && !isAdminRole(actorRole)) {
                                throw new common_1.ForbiddenException('Ban khong co quyen chinh sua tai lieu nay');
                            }
                            return [2 /*return*/, material];
                    }
                });
            });
        };
        StudyMaterialsService_1.prototype.toRecord = function (material, actorId, actorRole) {
            var canManage = material.uploaderId === actorId || isAdminRole(actorRole);
            return {
                id: material.id,
                title: material.title,
                description: material.description,
                category: material.category,
                fileUrl: material.fileUrl,
                storageKey: material.storageKey,
                fileName: (0, study_material_file_name_1.decodeStudyMaterialFileName)(material.fileName),
                mimeType: material.mimeType,
                fileSizeBytes: material.fileSizeBytes,
                uploaderId: material.uploaderId,
                createdAt: material.createdAt.toISOString(),
                updatedAt: material.updatedAt.toISOString(),
                uploader: {
                    id: material.uploader.id,
                    studentId: material.uploader.studentId,
                    fullName: (0, shared_1.formatFullName)(material.uploader.firstName, material.uploader.lastName),
                    role: material.uploader.role,
                },
                canEdit: canManage,
                canDelete: canManage,
            };
        };
        return StudyMaterialsService_1;
    }());
    __setFunctionName(_classThis, "StudyMaterialsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        StudyMaterialsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return StudyMaterialsService = _classThis;
}();
exports.StudyMaterialsService = StudyMaterialsService;
