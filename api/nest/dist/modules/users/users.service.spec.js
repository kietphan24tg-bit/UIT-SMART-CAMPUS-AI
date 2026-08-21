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
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("@nestjs/common");
var testing_1 = require("@nestjs/testing");
var prisma_service_1 = require("../../database/prisma.service");
var avatar_storage_service_1 = require("../storage/avatar-storage.service");
var avatar_upload_constants_1 = require("../storage/avatar-upload.constants");
var users_service_1 = require("./users.service");
describe('UsersService', function () {
    var service;
    var prisma;
    var avatarStorageService;
    var mockUser = {
        id: 'user-1',
        email: 'test@uit.edu.vn',
        studentId: '22520001',
        firstName: 'Nguyen',
        lastName: 'Van A',
        avatarUrl: null,
        role: 'student',
        faculty: 'SE',
        major: 'Software Engineering',
        yearOfAdmission: 2022,
        phone: null,
        dateOfBirth: null,
        address: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var module;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, testing_1.Test.createTestingModule({
                        providers: [
                            users_service_1.UsersService,
                            {
                                provide: avatar_storage_service_1.AvatarStorageService,
                                useValue: {
                                    uploadAvatar: jest.fn(),
                                },
                            },
                            {
                                provide: prisma_service_1.PrismaService,
                                useValue: {
                                    user: {
                                        findMany: jest.fn(),
                                        count: jest.fn(),
                                        findUnique: jest.fn(),
                                        create: jest.fn(),
                                        update: jest.fn(),
                                        delete: jest.fn(),
                                    },
                                    refreshToken: {
                                        deleteMany: jest.fn(),
                                    },
                                },
                            },
                        ],
                    }).compile()];
                case 1:
                    module = _a.sent();
                    service = module.get(users_service_1.UsersService);
                    prisma = module.get(prisma_service_1.PrismaService);
                    avatarStorageService = module.get(avatar_storage_service_1.AvatarStorageService);
                    return [2 /*return*/];
            }
        });
    }); });
    describe('create', function () {
        it('should create a new user when email does not exist', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(null);
                        prisma.user.create.mockResolvedValue({
                            id: 'user-1',
                            email: 'new@uit.edu.vn',
                            studentId: '22520002',
                            firstName: 'Tran',
                            lastName: 'Van B',
                            role: 'student',
                            createdAt: new Date(),
                        });
                        return [4 /*yield*/, service.create({
                                email: 'new@uit.edu.vn',
                                passwordHash: 'hashed',
                                studentId: '22520002',
                                firstName: 'Tran',
                                lastName: 'Van B',
                            })];
                    case 1:
                        result = _a.sent();
                        expect(result.email).toBe('new@uit.edu.vn');
                        expect(prisma.user.create).toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw ConflictException when email already exists', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(mockUser);
                        return [4 /*yield*/, expect(service.create({
                                email: 'test@uit.edu.vn',
                                passwordHash: 'hashed',
                                firstName: 'A',
                                lastName: 'B',
                            })).rejects.toThrow(common_1.ConflictException)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, expect(service.create({
                                email: 'test@uit.edu.vn',
                                passwordHash: 'hashed',
                                firstName: 'A',
                                lastName: 'B',
                            })).rejects.toThrow('Email đã được đăng ký.')];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should translate duplicated student id into a localized conflict message', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(null);
                        prisma.user.create.mockRejectedValue({
                            code: 'P2002',
                            meta: { target: ['student_id'] },
                        });
                        return [4 /*yield*/, expect(service.create({
                                email: 'new@uit.edu.vn',
                                passwordHash: 'hashed',
                                studentId: '22520001',
                                firstName: 'A',
                                lastName: 'B',
                            })).rejects.toThrow(common_1.ConflictException)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, expect(service.create({
                                email: 'new@uit.edu.vn',
                                passwordHash: 'hashed',
                                studentId: '22520001',
                                firstName: 'A',
                                lastName: 'B',
                            })).rejects.toThrow('MSSV đã được đăng ký.')];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('findAll', function () {
        it('should return the administrator user list with pagination metadata', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findMany.mockResolvedValue([mockUser]);
                        prisma.user.count.mockResolvedValue(1);
                        return [4 /*yield*/, service.findAll()];
                    case 1:
                        result = _a.sent();
                        expect(prisma.user.findMany).toHaveBeenCalled();
                        expect(prisma.user.count).toHaveBeenCalled();
                        expect(result.items).toHaveLength(1);
                        expect(result.meta).toEqual({
                            total: 1,
                            page: 1,
                            limit: 25,
                            totalPages: 1,
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('findById', function () {
        it('should return user when found', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(mockUser);
                        return [4 /*yield*/, service.findById('user-1')];
                    case 1:
                        result = _a.sent();
                        expect(result.id).toBe('user-1');
                        expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'user-1' } }));
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw NotFoundException when user not found', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(null);
                        return [4 /*yield*/, expect(service.findById('nonexistent')).rejects.toThrow(common_1.NotFoundException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('updateProfile', function () {
        it('should update and return user profile', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(mockUser);
                        prisma.user.update.mockResolvedValue(__assign(__assign({}, mockUser), { firstName: 'Updated' }));
                        return [4 /*yield*/, service.updateProfile('user-1', {
                                firstName: 'Updated',
                            })];
                    case 1:
                        result = _a.sent();
                        expect(result.firstName).toBe('Updated');
                        expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
                            where: { id: 'user-1' },
                            data: { firstName: 'Updated' },
                        }));
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw NotFoundException when user does not exist', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(null);
                        return [4 /*yield*/, expect(service.updateProfile('nonexistent', { firstName: 'X' })).rejects.toThrow(common_1.NotFoundException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('updateRole', function () {
        it('should update role and revoke refresh tokens', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(mockUser);
                        prisma.user.update.mockResolvedValue(__assign(__assign({}, mockUser), { role: 'admin' }));
                        prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
                        return [4 /*yield*/, service.updateRole('user-2', 'admin', 'admin-1')];
                    case 1:
                        result = _a.sent();
                        expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
                            where: { id: 'user-2' },
                            data: { role: 'admin' },
                        }));
                        expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-2' } });
                        expect(result.role).toBe('admin');
                        return [2 /*return*/];
                }
            });
        }); });
        it('should block self role updates', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(service.updateRole('admin-1', 'admin', 'admin-1')).rejects.toThrow(common_1.BadRequestException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('updateActive', function () {
        it('should update active state and revoke refresh tokens', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(mockUser);
                        prisma.user.update.mockResolvedValue(__assign(__assign({}, mockUser), { isActive: false }));
                        prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
                        return [4 /*yield*/, service.updateActive('user-2', false, 'admin-1')];
                    case 1:
                        result = _a.sent();
                        expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
                            where: { id: 'user-2' },
                            data: { isActive: false },
                        }));
                        expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-2' } });
                        expect(result.isActive).toBe(false);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should block self deactivation', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(service.updateActive('admin-1', false, 'admin-1')).rejects.toThrow(common_1.BadRequestException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('updateAvatar', function () {
        it('should upload avatar and persist avatarUrl', function () { return __awaiter(void 0, void 0, void 0, function () {
            var file, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        file = {
                            buffer: Buffer.from('avatar-bytes'),
                            mimetype: 'image/png',
                            size: 12,
                            originalname: 'avatar.png',
                        };
                        prisma.user.findUnique.mockResolvedValue(mockUser);
                        avatarStorageService.uploadAvatar.mockResolvedValue({
                            key: 'avatars/user-1/avatar.png',
                            avatarUrl: 'https://cdn.uit.edu.vn/avatars/user-1/avatar.png',
                        });
                        prisma.user.update.mockResolvedValue(__assign(__assign({}, mockUser), { avatarUrl: 'https://cdn.uit.edu.vn/avatars/user-1/avatar.png' }));
                        return [4 /*yield*/, service.updateAvatar('user-1', file)];
                    case 1:
                        result = _a.sent();
                        expect(avatarStorageService.uploadAvatar).toHaveBeenCalledWith('user-1', file);
                        expect(result.avatarUrl).toBe('https://cdn.uit.edu.vn/avatars/user-1/avatar.png');
                        return [2 /*return*/];
                }
            });
        }); });
        it('should reject unsupported mime types', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(mockUser);
                        return [4 /*yield*/, expect(service.updateAvatar('user-1', {
                                buffer: Buffer.from('avatar-bytes'),
                                mimetype: 'application/pdf',
                                size: 12,
                                originalname: 'avatar.pdf',
                            })).rejects.toThrow('Only JPEG, PNG, and WebP images are allowed')];
                    case 1:
                        _a.sent();
                        expect(avatarStorageService.uploadAvatar).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should reject oversized files', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(mockUser);
                        return [4 /*yield*/, expect(service.updateAvatar('user-1', {
                                buffer: Buffer.alloc(avatar_upload_constants_1.MAX_AVATAR_UPLOAD_SIZE_BYTES + 1),
                                mimetype: 'image/png',
                                size: avatar_upload_constants_1.MAX_AVATAR_UPLOAD_SIZE_BYTES + 1,
                                originalname: 'avatar.png',
                            })).rejects.toThrow('Avatar image must be 5 MB or smaller')];
                    case 1:
                        _a.sent();
                        expect(avatarStorageService.uploadAvatar).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('deleteUser', function () {
        it('should delete the user record and rely on cascading relations', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prisma.user.findUnique.mockResolvedValue(mockUser);
                        prisma.user.delete.mockResolvedValue(mockUser);
                        return [4 /*yield*/, service.deleteUser('user-2', 'admin-1')];
                    case 1:
                        result = _a.sent();
                        expect(prisma.user.delete).toHaveBeenCalledWith({
                            where: { id: 'user-2' },
                        });
                        expect(result).toEqual({ id: 'user-2', deleted: true });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should block self deletion', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(service.deleteUser('admin-1', 'admin-1')).rejects.toThrow(common_1.BadRequestException)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
