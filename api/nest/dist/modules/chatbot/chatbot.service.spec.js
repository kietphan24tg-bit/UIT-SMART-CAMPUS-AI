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
var chatbot_domain_registry_1 = require("./chatbot.domain-registry");
var chatbot_knowledge_service_1 = require("./chatbot.knowledge.service");
var chatbot_live_domain_handlers_service_1 = require("./chatbot.live-domain-handlers.service");
var chatbot_orchestrator_service_1 = require("./chatbot.orchestrator.service");
var chatbot_service_1 = require("./chatbot.service");
describe('ChatbotService', function () {
    var prisma = {
        chatSession: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        chatMessage: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
        canteenOrder: {
            findFirst: jest.fn(),
            count: jest.fn(),
        },
        canteenCategory: {
            findMany: jest.fn(),
        },
        libraryLoan: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
        libraryLoanRequest: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
        libraryBook: {
            findMany: jest.fn(),
        },
        sosRequest: {
            findFirst: jest.fn(),
            count: jest.fn(),
        },
        classSection: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
        classEnrollment: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
        attendanceSession: {
            findMany: jest.fn(),
        },
        attendanceRecord: {
            findFirst: jest.fn(),
        },
        roomBooking: {
            findFirst: jest.fn(),
            count: jest.fn(),
        },
        event: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
        notification: {
            count: jest.fn(),
            findFirst: jest.fn(),
        },
        knowledgeChunk: {
            findMany: jest.fn(),
        },
        knowledgeDocument: {
            upsert: jest.fn(),
        },
        studyMaterial: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
        vehicle: {
            findMany: jest.fn(),
        },
        parkingSlot: {
            count: jest.fn(),
        },
        telemetrySnapshot: {
            findFirst: jest.fn(),
        },
        grade: {
            findMany: jest.fn(),
            aggregate: jest.fn(),
        },
        $transaction: jest.fn(),
    };
    var service;
    beforeEach(function () {
        jest.clearAllMocks();
        prisma.chatSession.create.mockResolvedValue({ id: 'session-1' });
        prisma.chatMessage.create.mockResolvedValue(undefined);
        prisma.$transaction.mockImplementation(function (callback) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, callback({
                        knowledgeDocument: prisma.knowledgeDocument,
                        knowledgeChunk: {
                            deleteMany: jest.fn(),
                            create: jest.fn(),
                        },
                    })];
            });
        }); });
        var registry = new chatbot_domain_registry_1.ChatbotDomainRegistry();
        var knowledge = new chatbot_knowledge_service_1.ChatbotKnowledgeService(prisma, registry);
        var liveHandlers = new chatbot_live_domain_handlers_service_1.ChatbotLiveDomainHandlersService(prisma, registry);
        var orchestrator = new chatbot_orchestrator_service_1.ChatbotOrchestratorService(registry, liveHandlers, knowledge);
        service = new chatbot_service_1.ChatbotService(prisma, orchestrator, registry, knowledge);
    });
    it('returns empty intent when message is blank', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, service.query('student-1', client_1.Role.student, {
                        message: '   ',
                    })];
                case 1:
                    result = _a.sent();
                    expect(result.intent).toBe('empty');
                    expect(prisma.chatSession.create).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('answers study materials queries before generic knowledge fallback', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.studyMaterial.findMany.mockResolvedValue([
                        {
                            id: 'material-1',
                            title: 'Đề thi cuối kỳ SE346',
                            description: 'Đề thi tham khảo',
                            category: 'exam',
                            fileName: 'se346-final.pdf',
                            uploader: { firstName: 'Minh', lastName: 'Nguyen' },
                        },
                    ]);
                    return [4 /*yield*/, service.query('student-1', client_1.Role.student, {
                            message: 'Cho minh xem tai lieu de thi moi',
                        })];
                case 1:
                    result = _a.sent();
                    expect(result.domain).toBe('study-materials');
                    expect(result.intent).toBe('study_materials_search');
                    expect(result.answer).toContain('Đề thi cuối kỳ SE346');
                    return [2 /*return*/];
            }
        });
    }); });
    it('builds student summary without admin-only routes', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.classEnrollment.findMany.mockResolvedValue([
                        {
                            classSection: {
                                course: { name: 'Toán rời rạc' },
                                meetings: [{ id: 'meeting-1', startTime: '07:30', endTime: '09:00', room: 'A101', dayOfWeek: new Date().getDay() }],
                            },
                        },
                    ]);
                    prisma.attendanceRecord.findFirst.mockResolvedValue(null);
                    prisma.notification.count.mockResolvedValue(2);
                    prisma.notification.findFirst.mockResolvedValue({
                        id: 'notif-1',
                        title: 'Bạn có thông báo học vụ mới',
                    });
                    prisma.canteenOrder.findFirst.mockResolvedValue(null);
                    return [4 /*yield*/, service.getSummary('student-1', client_1.Role.student, 'today')];
                case 1:
                    result = _a.sent();
                    expect(result.answerType).toBe('summary');
                    expect(result.actions.some(function (item) { return item.route === '/services/admin-tools'; })).toBe(false);
                    expect(result.answer).toContain('Toán rời rạc');
                    return [2 /*return*/];
            }
        });
    }); });
    it('forbids reading messages from a session owned by another user', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prisma.chatSession.findUnique.mockResolvedValue({
                        id: 'session-1',
                        userId: 'student-2',
                    });
                    return [4 /*yield*/, expect(service.getMessages('student-1', 'session-1')).rejects.toBeInstanceOf(common_1.ForbiddenException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('maps legacy deepLinks to friendly action labels when loading messages', function () { return __awaiter(void 0, void 0, void 0, function () {
        var messages;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    prisma.chatSession.findUnique.mockResolvedValue({
                        id: 'session-1',
                        userId: 'student-1',
                    });
                    prisma.chatMessage.findMany.mockResolvedValue([
                        {
                            id: 'msg-1',
                            role: 'assistant',
                            content: 'Bạn có một đơn canteen.',
                            intent: 'canteen_order_status',
                            confidence: 0.9,
                            citations: [],
                            deepLinks: ['/services/canteen'],
                            createdAt: new Date('2026-06-02T01:00:00.000Z'),
                        },
                    ]);
                    return [4 /*yield*/, service.getMessages('student-1', 'session-1')];
                case 1:
                    messages = _b.sent();
                    expect((_a = messages[0]) === null || _a === void 0 ? void 0 : _a.actions).toEqual([
                        { label: 'Mở canteen', route: '/services/canteen', kind: 'navigate' },
                    ]);
                    return [2 /*return*/];
            }
        });
    }); });
    it('returns admin capabilities with ops scope', function () {
        var capabilities = service.getCapabilities(client_1.Role.admin);
        expect(capabilities.summaryScopes.some(function (item) { return item.scope === 'ops'; })).toBe(true);
        expect(capabilities.quickPrompts.length).toBeGreaterThan(0);
    });
});
