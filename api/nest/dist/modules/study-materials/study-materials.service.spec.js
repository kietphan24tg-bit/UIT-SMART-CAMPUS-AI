"use strict";
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
var client_1 = require("@prisma/client");
var study_materials_service_1 = require("./study-materials.service");
describe('StudyMaterialsService', function () {
    var prisma = {
        studyMaterial: {
            findMany: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findUnique: jest.fn(),
        },
    };
    var storageService = {
        uploadStudyMaterialFile: jest.fn(),
    };
    var service;
    beforeEach(function () {
        jest.clearAllMocks();
        service = new study_materials_service_1.StudyMaterialsService(prisma, storageService);
    });
    it('lists materials with uploader info and ownership flags', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.studyMaterial.findMany.mockResolvedValue([
                        {
                            id: 'material-1',
                            title: 'De thi giai tich',
                            description: 'Nam 2025',
                            category: client_1.StudyMaterialCategory.exam,
                            fileUrl: 'https://cdn.example.com/material-1.pdf',
                            storageKey: 'study-materials/student-1/material-1.pdf',
                            fileName: 'Copy%20of%20Gi%C3%A1o%20tr%C3%ACnh.pdf',
                            mimeType: 'application/pdf',
                            fileSizeBytes: 1024,
                            uploaderId: 'student-1',
                            createdAt: new Date('2026-06-02T00:00:00.000Z'),
                            updatedAt: new Date('2026-06-02T00:00:00.000Z'),
                            uploader: {
                                id: 'student-1',
                                firstName: 'An',
                                lastName: 'Nguyen',
                                studentId: '22520001',
                                role: client_1.Role.student,
                            },
                        },
                    ]);
                    prisma.studyMaterial.count.mockResolvedValue(1);
                    return [4 /*yield*/, service.list('student-1', client_1.Role.student, {
                            page: 1,
                            limit: 20,
                        })];
                case 1:
                    result = _a.sent();
                    expect(result.items).toHaveLength(1);
                    expect(result.items[0]).toMatchObject({
                        id: 'material-1',
                        fileName: 'Copy of Giáo trình.pdf',
                        uploader: {
                            fullName: 'Nguyen An',
                        },
                        canEdit: true,
                        canDelete: true,
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('creates a material through storage and persists decoded file metadata', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    storageService.uploadStudyMaterialFile.mockResolvedValue({
                        key: 'study-materials/lecturer-1/file.docx',
                        fileUrl: 'https://cdn.example.com/study-materials/lecturer-1/file.docx',
                    });
                    prisma.studyMaterial.create.mockResolvedValue({
                        id: 'material-2',
                        title: 'Giao trinh he dieu hanh',
                        description: null,
                        category: client_1.StudyMaterialCategory.textbook,
                        fileUrl: 'https://cdn.example.com/study-materials/lecturer-1/file.docx',
                        storageKey: 'study-materials/lecturer-1/file.docx',
                        fileName: 'Giáo trình hệ điều hành.docx',
                        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        fileSizeBytes: 2048,
                        uploaderId: 'lecturer-1',
                        createdAt: new Date('2026-06-02T00:00:00.000Z'),
                        updatedAt: new Date('2026-06-02T00:00:00.000Z'),
                        uploader: {
                            id: 'lecturer-1',
                            firstName: 'Lan',
                            lastName: 'Tran',
                            studentId: null,
                            role: client_1.Role.lecturer,
                        },
                    });
                    return [4 /*yield*/, service.create('lecturer-1', client_1.Role.lecturer, {
                            category: client_1.StudyMaterialCategory.textbook,
                            title: 'Giao trinh he dieu hanh',
                        }, {
                            buffer: Buffer.from('doc'),
                            mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            size: 2048,
                            originalname: 'Gi%C3%A1o%20tr%C3%ACnh%20h%E1%BB%87%20%C4%91i%E1%BB%81u%20h%C3%A0nh.docx',
                        })];
                case 1:
                    result = _a.sent();
                    expect(storageService.uploadStudyMaterialFile).toHaveBeenCalledWith('lecturer-1', expect.objectContaining({
                        originalname: 'Gi%C3%A1o%20tr%C3%ACnh%20h%E1%BB%87%20%C4%91i%E1%BB%81u%20h%C3%A0nh.docx',
                    }));
                    expect(prisma.studyMaterial.create).toHaveBeenCalledWith(expect.objectContaining({
                        data: expect.objectContaining({
                            fileName: 'Giáo trình hệ điều hành.docx',
                        }),
                    }));
                    expect(result.fileName).toBe('Giáo trình hệ điều hành.docx');
                    expect(result.uploader.fullName).toBe('Tran Lan');
                    return [2 /*return*/];
            }
        });
    }); });
    it('normalizes decoded file names when updating uploaded files', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.studyMaterial.findUnique.mockResolvedValue({
                        id: 'material-5',
                        title: 'Tai lieu cu',
                        description: null,
                        category: client_1.StudyMaterialCategory.textbook,
                        fileName: 'tai-lieu-cu.pdf',
                        mimeType: 'application/pdf',
                        fileSizeBytes: 1024,
                        uploaderId: 'lecturer-1',
                    });
                    storageService.uploadStudyMaterialFile.mockResolvedValue({
                        key: 'study-materials/lecturer-1/file-new.pdf',
                        fileUrl: 'https://cdn.example.com/study-materials/lecturer-1/file-new.pdf',
                    });
                    prisma.studyMaterial.update.mockResolvedValue({
                        id: 'material-5',
                        title: 'Tai lieu cu',
                        description: null,
                        category: client_1.StudyMaterialCategory.textbook,
                        fileUrl: 'https://cdn.example.com/study-materials/lecturer-1/file-new.pdf',
                        storageKey: 'study-materials/lecturer-1/file-new.pdf',
                        fileName: 'Cấu trúc dữ liệu và giải thuật.pdf',
                        mimeType: 'application/pdf',
                        fileSizeBytes: 2048,
                        uploaderId: 'lecturer-1',
                        createdAt: new Date('2026-06-02T00:00:00.000Z'),
                        updatedAt: new Date('2026-06-03T00:00:00.000Z'),
                        uploader: {
                            id: 'lecturer-1',
                            firstName: 'Lan',
                            lastName: 'Tran',
                            studentId: null,
                            role: client_1.Role.lecturer,
                        },
                    });
                    return [4 /*yield*/, service.update('material-5', 'lecturer-1', client_1.Role.lecturer, {}, {
                            buffer: Buffer.from('pdf'),
                            mimetype: 'application/pdf',
                            size: 2048,
                            originalname: 'C%E1%BA%A5u%20tr%C3%BAc%20d%E1%BB%AF%20li%E1%BB%87u%20v%C3%A0%20gi%E1%BA%A3i%20thu%E1%BA%ADt.pdf',
                        })];
                case 1:
                    result = _a.sent();
                    expect(prisma.studyMaterial.update).toHaveBeenCalledWith(expect.objectContaining({
                        data: expect.objectContaining({
                            fileName: 'Cấu trúc dữ liệu và giải thuật.pdf',
                        }),
                    }));
                    expect(result.fileName).toBe('Cấu trúc dữ liệu và giải thuật.pdf');
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects updates from non-owner non-admin users', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.studyMaterial.findUnique.mockResolvedValue({
                        id: 'material-3',
                        title: 'Tai lieu',
                        description: null,
                        category: client_1.StudyMaterialCategory.other,
                        fileName: 'tai-lieu.pdf',
                        mimeType: 'application/pdf',
                        fileSizeBytes: 512,
                        uploaderId: 'student-1',
                    });
                    return [4 /*yield*/, expect(service.update('material-3', 'student-2', client_1.Role.student, {
                            title: 'Tai lieu moi',
                        })).rejects.toBeInstanceOf(common_1.ForbiddenException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('allows admin to delete materials of other users', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.studyMaterial.findUnique.mockResolvedValue({
                        id: 'material-4',
                        title: 'De cuong',
                        description: null,
                        category: client_1.StudyMaterialCategory.other,
                        fileName: 'de-cuong.pdf',
                        mimeType: 'application/pdf',
                        fileSizeBytes: 512,
                        uploaderId: 'student-1',
                    });
                    prisma.studyMaterial.delete.mockResolvedValue({ id: 'material-4' });
                    return [4 /*yield*/, service.remove('material-4', 'admin-1', client_1.Role.admin)];
                case 1:
                    result = _a.sent();
                    expect(prisma.studyMaterial.delete).toHaveBeenCalledWith({
                        where: { id: 'material-4' },
                    });
                    expect(result).toEqual({ id: 'material-4', deleted: true });
                    return [2 /*return*/];
            }
        });
    }); });
    it('throws not found when deleting missing material', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.studyMaterial.findUnique.mockResolvedValue(null);
                    return [4 /*yield*/, expect(service.remove('missing', 'admin-1', client_1.Role.admin)).rejects.toBeInstanceOf(common_1.NotFoundException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
