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
exports.ChatbotLiveDomainHandlersService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var chatbot_utils_1 = require("./chatbot.utils");
var MATERIAL_CATEGORY_LABELS = {
    exam: 'Đề thi',
    textbook: 'Giáo trình',
    other: 'Tài liệu khác',
};
function getLoanRequestStatusLabel(status) {
    switch (status) {
        case client_1.LibraryLoanRequestStatus.approved:
            return 'đã duyệt';
        case client_1.LibraryLoanRequestStatus.rejected:
            return 'bị từ chối';
        case client_1.LibraryLoanRequestStatus.cancelled:
            return 'đã hủy';
        default:
            return 'đang chờ duyệt';
    }
}
function getSummaryHeading(scope) {
    switch (scope) {
        case 'today':
            return 'Tóm tắt hôm nay';
        case 'ops':
            return 'Snapshot vận hành';
        default:
            return 'Tóm tắt công việc';
    }
}
var ChatbotLiveDomainHandlersService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ChatbotLiveDomainHandlersService = _classThis = /** @class */ (function () {
        function ChatbotLiveDomainHandlersService_1(prisma, registry) {
            var _this = this;
            this.prisma = prisma;
            this.registry = registry;
            this.handlers = {
                general: this.createStaticHandler('general'),
                canteen: {
                    canHandle: function (context) {
                        return context.tokens.some(function (token) { return ['canteen', 'menu', 'mon', 'order', 'don'].includes(token); });
                    },
                    answer: function (context) { return _this.answerCanteen(context); },
                    buildSummary: function (context) { return _this.buildCanteenSummary(context); },
                    getSuggestedQuestions: function () { return [
                        'Đơn canteen gần nhất của tôi',
                        'Canteen hôm nay còn món gì?',
                        'Bao nhiêu đơn đã thanh toán đang chờ xử lý?',
                    ]; },
                },
                library: {
                    canHandle: function (context) {
                        return context.tokens.some(function (token) { return ['library', 'loan', 'book', 'sach', 'muon'].includes(token); });
                    },
                    answer: function (context) { return _this.answerLibrary(context); },
                    buildSummary: function (context) { return _this.buildLibrarySummary(context); },
                    getSuggestedQuestions: function () { return [
                        'Sách tôi đang mượn',
                        'Yêu cầu mượn gần nhất của tôi',
                        'Tìm sách clean code',
                    ]; },
                },
                schedule: {
                    canHandle: function (context) {
                        return context.tokens.some(function (token) { return ['schedule', 'lich', 'hoc', 'giang', 'tiet'].includes(token); });
                    },
                    answer: function (context) { return _this.answerSchedule(context); },
                    buildSummary: function (context) { return _this.buildScheduleSummary(context); },
                    getSuggestedQuestions: function (role) {
                        return role === client_1.Role.lecturer
                            ? ['Lịch dạy hôm nay', 'Tuần này tôi dạy lớp nào?', 'Lớp nào cần điểm danh?']
                            : ['Lịch học hôm nay', 'Tuần này tôi học môn gì?', 'Phòng học hôm nay ở đâu?'];
                    },
                },
                grades: {
                    canHandle: function (context) {
                        return context.tokens.some(function (token) { return ['diem', 'gpa', 'grade', 'bang'].includes(token); });
                    },
                    answer: function (context) { return _this.answerGrades(context); },
                    buildSummary: function (context) { return _this.buildGradesSummary(context); },
                    getSuggestedQuestions: function (role) {
                        return role === client_1.Role.lecturer
                            ? ['Tôi đang quản lý bao nhiêu lớp nhập điểm?', 'Mở sheet điểm lớp của tôi']
                            : ['GPA hiện tại của tôi', 'Môn mới có điểm là môn nào?', 'Bảng điểm hiện tại của tôi'];
                    },
                },
                attendance: {
                    canHandle: function (context) {
                        return context.tokens.some(function (token) { return ['attendance', 'diem', 'danh', 'checkin', 'qr'].includes(token); });
                    },
                    answer: function (context) { return _this.answerAttendance(context); },
                    buildSummary: function (context) { return _this.buildAttendanceSummary(context); },
                    getSuggestedQuestions: function (role) {
                        return role === client_1.Role.lecturer
                            ? ['Lớp nào đang có phiên QR?', 'Hôm nay tôi có lớp cần điểm danh không?']
                            : ['Tôi đã điểm danh hôm nay chưa?', 'Lịch sử điểm danh của tôi'];
                    },
                },
                registrations: {
                    canHandle: function (context) {
                        return context.role === client_1.Role.student &&
                            context.tokens.some(function (token) { return ['registration', 'dang', 'ky', 'hoc', 'phan'].includes(token); });
                    },
                    answer: function (context) { return _this.answerRegistrations(context); },
                    buildSummary: function (context) { return _this.buildRegistrationSummary(context); },
                    getSuggestedQuestions: function () { return [
                        'Tôi đã đăng ký bao nhiêu lớp?',
                        'Hiện có bao nhiêu lớp đang mở đăng ký?',
                    ]; },
                },
                'study-materials': {
                    canHandle: function (context) {
                        return context.tokens.some(function (token) { return ['study', 'material', 'tai', 'lieu', 'thi', 'trinh', 'pdf', 'doc'].includes(token); });
                    },
                    answer: function (context) { return _this.answerStudyMaterials(context); },
                    buildSummary: function (context) { return _this.buildStudyMaterialsSummary(context); },
                    getSuggestedQuestions: function () { return [
                        'Tài liệu mới nhất',
                        'Đề thi mới được đăng',
                        'Tìm giáo trình cơ sở dữ liệu',
                    ]; },
                },
                'room-bookings': {
                    canHandle: function (context) {
                        return context.tokens.some(function (token) { return ['room', 'booking', 'phong', 'approve', 'queue'].includes(token); });
                    },
                    answer: function (context) { return _this.answerRoomBookings(context); },
                    buildSummary: function (context) { return _this.buildRoomBookingsSummary(context); },
                    getSuggestedQuestions: function () { return [
                        'Yêu cầu đặt phòng gần nhất của tôi',
                        'Có bao nhiêu yêu cầu đặt phòng chờ duyệt?',
                    ]; },
                },
                parking: {
                    canHandle: function (context) {
                        return context.tokens.some(function (token) { return ['parking', 'xe', 'slot', 'telemetry', 'fire'].includes(token); });
                    },
                    answer: function (context) { return _this.answerParking(context); },
                    buildSummary: function (context) { return _this.buildParkingSummary(context); },
                    getSuggestedQuestions: function () { return [
                        'Xe của tôi đang ở trạng thái nào?',
                        'Bãi xe còn chỗ không?',
                        'Telemetry gần nhất có ổn không?',
                    ]; },
                },
                events: {
                    canHandle: function (context) {
                        return context.tokens.some(function (token) { return ['event', 'su', 'kien', 'workshop'].includes(token); });
                    },
                    answer: function (context) { return _this.answerEvents(context); },
                    buildSummary: function (context) { return _this.buildEventsSummary(context); },
                    getSuggestedQuestions: function () { return [
                        'Sự kiện sắp tới',
                        'Tôi đã đăng ký sự kiện nào?',
                    ]; },
                },
                notifications: {
                    canHandle: function (context) {
                        return context.tokens.some(function (token) { return ['notification', 'alert', 'bao', 'canh'].includes(token); });
                    },
                    answer: function (context) { return _this.answerNotifications(context); },
                    buildSummary: function (context) { return _this.buildNotificationsSummary(context); },
                    getSuggestedQuestions: function () { return [
                        'Thông báo chưa đọc',
                        'Thông báo mới nhất của tôi',
                    ]; },
                },
                sos: {
                    canHandle: function (context) {
                        return context.tokens.some(function (token) { return ['sos', 'gps', 'emergency', 'khan'].includes(token); });
                    },
                    answer: function (context) { return _this.answerSos(context); },
                    buildSummary: function (context) { return _this.buildSosSummary(context); },
                    getSuggestedQuestions: function () { return [
                        'SOS gần nhất của tôi',
                        'Hiện có bao nhiêu SOS đang hoạt động?',
                    ]; },
                },
                ops: {
                    canHandle: function (context) {
                        return (0, chatbot_utils_1.isOperatorRole)(context.role) &&
                            context.tokens.some(function (token) { return ['ops', 'queue', 'fire', 'telemetry', 'admin', 'hanh'].includes(token); });
                    },
                    answer: function (context) { return _this.answerOps(context); },
                    buildSummary: function (context) { return _this.buildOpsSummary(context); },
                    getSuggestedQuestions: function () { return [
                        'Snapshot vận hành hiện tại',
                        'Queue cần xử lý của tôi',
                        'Fire alert gần nhất thế nào?',
                    ]; },
                },
                'campus-map': {
                    canHandle: function (context) {
                        return context.tokens.some(function (token) { return ['map', 'ban', 'do', 'tour', '360', 'vien'].includes(token); });
                    },
                    answer: function (context) { return _this.answerCampusMap(context); },
                    buildSummary: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, null];
                    }); }); },
                    getSuggestedQuestions: function () { return ['Mở bản đồ khuôn viên', 'Tour 360 UIT ở đâu?']; },
                },
            };
        }
        ChatbotLiveDomainHandlersService_1.prototype.getHandler = function (domainId) {
            return this.handlers[domainId];
        };
        ChatbotLiveDomainHandlersService_1.prototype.getSuggestedQuestions = function (domainId, role) {
            var _a, _b;
            return (_b = (_a = this.handlers[domainId]) === null || _a === void 0 ? void 0 : _a.getSuggestedQuestions(role)) !== null && _b !== void 0 ? _b : [];
        };
        ChatbotLiveDomainHandlersService_1.prototype.buildScopedSummary = function (context, domainIds) {
            return __awaiter(this, void 0, void 0, function () {
                var answers, actionMap, citationMap, _i, answers_1, answer, _a, _b, action, _c, _d, citation;
                var _this = this;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0: return [4 /*yield*/, Promise.all(domainIds.map(function (domainId) { return __awaiter(_this, void 0, void 0, function () {
                                var handler, _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            handler = this.handlers[domainId];
                                            if (!handler) {
                                                return [2 /*return*/, null];
                                            }
                                            _b.label = 1;
                                        case 1:
                                            _b.trys.push([1, 3, , 4]);
                                            return [4 /*yield*/, handler.buildSummary(context)];
                                        case 2: return [2 /*return*/, _b.sent()];
                                        case 3:
                                            _a = _b.sent();
                                            return [2 /*return*/, null];
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                        case 1:
                            answers = (_e.sent()).filter(function (item) { return item != null; });
                            if (!answers.length) {
                                return [2 /*return*/, (0, chatbot_utils_1.finalizeAnswer)({
                                        answer: "".concat(getSummaryHeading(context.scope), " hi\u1EC7n ch\u01B0a c\u00F3 d\u1EEF li\u1EC7u n\u1ED5i b\u1EADt cho role c\u1EE7a b\u1EA1n."),
                                        citations: [],
                                        actions: [],
                                        suggestedQuestions: ['Lịch hôm nay của tôi', 'Thông báo chưa đọc', 'Tài liệu mới'],
                                        confidence: 0.45,
                                        intent: "summary_".concat(context.scope, "_empty"),
                                        domain: context.scope === 'ops' ? 'ops' : 'general',
                                        answerType: 'summary',
                                    })];
                            }
                            actionMap = new Map();
                            citationMap = new Map();
                            for (_i = 0, answers_1 = answers; _i < answers_1.length; _i++) {
                                answer = answers_1[_i];
                                for (_a = 0, _b = answer.actions; _a < _b.length; _a++) {
                                    action = _b[_a];
                                    actionMap.set("".concat(action.route, ":").concat(action.label), action);
                                }
                                for (_c = 0, _d = answer.citations; _c < _d.length; _c++) {
                                    citation = _d[_c];
                                    citationMap.set("".concat(citation.type, ":").concat(citation.sourceId, ":").concat(citation.label), citation);
                                }
                            }
                            return [2 /*return*/, (0, chatbot_utils_1.finalizeAnswer)({
                                    answer: "".concat(getSummaryHeading(context.scope), ":\n").concat(answers
                                        .map(function (item) { return "\u2022 ".concat(item.answer); })
                                        .join('\n')),
                                    citations: Array.from(citationMap.values()),
                                    actions: Array.from(actionMap.values()),
                                    suggestedQuestions: Array.from(new Set(answers.flatMap(function (item) { return item.suggestedQuestions; }))).slice(0, 6),
                                    confidence: Math.min(0.98, answers.reduce(function (sum, item) { return sum + item.confidence; }, 0) / answers.length),
                                    intent: "summary_".concat(context.scope),
                                    domain: context.scope === 'ops' ? 'ops' : 'general',
                                    answerType: 'summary',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.createStaticHandler = function (_domainId) {
            var _this = this;
            return {
                canHandle: function () { return false; },
                answer: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                    return [2 /*return*/, null];
                }); }); },
                buildSummary: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                    return [2 /*return*/, null];
                }); }); },
                getSuggestedQuestions: function () { return []; },
            };
        };
        ChatbotLiveDomainHandlersService_1.prototype.createDomainAnswer = function (domainId, payload) {
            return (0, chatbot_utils_1.finalizeAnswer)(__assign(__assign({}, payload), { domain: domainId }));
        };
        ChatbotLiveDomainHandlersService_1.prototype.answerCampusMap = function (context) {
            return Promise.resolve(this.createDomainAnswer('campus-map', {
                answer: 'Bản đồ khuôn viên UIT hiện có sẵn dưới dạng tour 3D ngay trong app.',
                citations: [(0, chatbot_utils_1.buildDerivedCitation)('Campus map entrypoint', 'campus-map', '/services/campus-map')],
                actions: [this.registry.buildDomainAction('campus-map')],
                suggestedQuestions: this.getSuggestedQuestions('campus-map', context.role),
                confidence: 0.92,
                intent: 'campus_map_entry',
                answerType: 'live',
            }));
        };
        ChatbotLiveDomainHandlersService_1.prototype.answerCanteen = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var asksOrder, asksAdminQueue, pendingOrders, route, latestOrder, categories, products;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            asksOrder = (0, chatbot_utils_1.includesAnyPhrase)(context.normalizedMessage, ['don canteen', 'hoa don canteen', 'don hang canteen']) ||
                                context.tokens.some(function (token) { return ['order', 'don'].includes(token); });
                            asksAdminQueue = (0, chatbot_utils_1.isOperatorRole)(context.role) &&
                                ((0, chatbot_utils_1.includesAnyPhrase)(context.normalizedMessage, ['queue canteen', 'don da thanh toan', 'cho xu ly']) ||
                                    context.tokens.some(function (token) { return ['queue', 'paid', 'xu'].includes(token); }));
                            if (!(asksAdminQueue && context.role !== client_1.Role.student && context.role !== client_1.Role.lecturer)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.prisma.canteenOrder.count({
                                    where: { status: 'paid' },
                                })];
                        case 1:
                            pendingOrders = _a.sent();
                            route = context.role === client_1.Role.canteen_admin || (0, chatbot_utils_1.isAdminRole)(context.role)
                                ? '/services/canteen/admin'
                                : '/services/canteen';
                            return [2 /*return*/, this.createDomainAnswer('canteen', {
                                    answer: "Hi\u1EC7n c\u00F3 ".concat(pendingOrders, " \u0111\u01A1n canteen \u0111\u00E3 thanh to\u00E1n \u0111ang ch\u1EDD x\u1EED l\u00FD."),
                                    citations: [(0, chatbot_utils_1.buildDerivedCitation)('Queue canteen đã thanh toán', 'canteen-paid-orders', route)],
                                    actions: [this.registry.buildDomainAction('canteen', route)],
                                    suggestedQuestions: this.getSuggestedQuestions('canteen', context.role),
                                    confidence: 0.93,
                                    intent: 'canteen_admin_queue',
                                    answerType: 'live',
                                })];
                        case 2:
                            if (!asksOrder) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.prisma.canteenOrder.findFirst({
                                    where: { createdById: context.userId },
                                    orderBy: [{ createdAt: 'desc' }],
                                })];
                        case 3:
                            latestOrder = _a.sent();
                            if (!latestOrder) {
                                return [2 /*return*/, this.createDomainAnswer('canteen', {
                                        answer: 'Bạn chưa có đơn canteen nào gần đây.',
                                        citations: [],
                                        actions: [this.registry.buildDomainAction('canteen')],
                                        suggestedQuestions: this.getSuggestedQuestions('canteen', context.role),
                                        confidence: 0.92,
                                        intent: 'canteen_order_empty',
                                        answerType: 'live',
                                    })];
                            }
                            return [2 /*return*/, this.createDomainAnswer('canteen', {
                                    answer: "\u0110\u01A1n g\u1EA7n nh\u1EA5t ".concat(latestOrder.orderCode, " \u0111ang \u1EDF tr\u1EA1ng th\u00E1i ").concat(latestOrder.status, ". T\u1ED5ng ti\u1EC1n ").concat(latestOrder.totalAmount.toLocaleString('vi-VN'), "\u0111."),
                                    citations: [(0, chatbot_utils_1.buildDbCitation)('Đơn canteen gần nhất', latestOrder.id, 'canteen_orders', '/services/canteen')],
                                    actions: [
                                        this.registry.buildDomainAction('canteen', context.role === client_1.Role.canteen_admin || (0, chatbot_utils_1.isAdminRole)(context.role)
                                            ? '/services/canteen/admin'
                                            : '/services/canteen'),
                                    ],
                                    suggestedQuestions: this.getSuggestedQuestions('canteen', context.role),
                                    confidence: 0.97,
                                    intent: 'canteen_order_status',
                                    answerType: 'live',
                                })];
                        case 4: return [4 /*yield*/, this.prisma.canteenCategory.findMany({
                                where: { isActive: true },
                                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                                include: {
                                    products: {
                                        where: { isActive: true, stock: { gt: 0 } },
                                        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                                        take: 2,
                                    },
                                },
                                take: 3,
                            })];
                        case 5:
                            categories = _a.sent();
                            products = categories.flatMap(function (category) {
                                return category.products.map(function (product) { return ({
                                    id: product.id,
                                    name: product.name,
                                    price: product.price,
                                    categoryName: category.name,
                                }); });
                            });
                            if (!products.length) {
                                return [2 /*return*/, this.createDomainAnswer('canteen', {
                                        answer: 'Hiện canteen chưa có món nào còn hàng để hiển thị.',
                                        citations: [],
                                        actions: [this.registry.buildDomainAction('canteen')],
                                        suggestedQuestions: this.getSuggestedQuestions('canteen', context.role),
                                        confidence: 0.88,
                                        intent: 'canteen_catalog_empty',
                                        answerType: 'live',
                                    })];
                            }
                            return [2 /*return*/, this.createDomainAnswer('canteen', {
                                    answer: "Hi\u1EC7n canteen c\u00F2n ".concat(products.length, " m\u00F3n n\u1ED5i b\u1EADt: ").concat(products
                                        .map(function (item) { return "".concat(item.name, " (").concat(item.price.toLocaleString('vi-VN'), "\u0111, ").concat(item.categoryName, ")"); })
                                        .join('; '), "."),
                                    citations: products.map(function (item) {
                                        return (0, chatbot_utils_1.buildDbCitation)(item.name, item.id, 'canteen_products', '/services/canteen');
                                    }),
                                    actions: [this.registry.buildDomainAction('canteen')],
                                    suggestedQuestions: this.getSuggestedQuestions('canteen', context.role),
                                    confidence: 0.94,
                                    intent: 'canteen_catalog',
                                    answerType: 'live',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.buildCanteenSummary = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var pendingOrders, latestOrder;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(context.scope === 'ops' && (0, chatbot_utils_1.isOperatorRole)(context.role))) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.prisma.canteenOrder.count({
                                    where: { status: 'paid' },
                                })];
                        case 1:
                            pendingOrders = _a.sent();
                            return [2 /*return*/, this.createDomainAnswer('canteen', {
                                    answer: "Canteen \u0111ang c\u00F3 ".concat(pendingOrders, " \u0111\u01A1n \u0111\u00E3 thanh to\u00E1n ch\u1EDD ho\u00E0n th\u00E0nh."),
                                    citations: [(0, chatbot_utils_1.buildDerivedCitation)('Queue canteen', 'canteen-summary', '/services/canteen/admin')],
                                    actions: [this.registry.buildDomainAction('canteen', '/services/canteen/admin')],
                                    suggestedQuestions: ['Mở quản trị canteen', 'Snapshot vận hành'],
                                    confidence: 0.9,
                                    intent: 'canteen_summary_ops',
                                    answerType: 'summary',
                                })];
                        case 2:
                            if (!(context.role === client_1.Role.student || context.role === client_1.Role.lecturer)) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.prisma.canteenOrder.findFirst({
                                    where: { createdById: context.userId },
                                    orderBy: [{ createdAt: 'desc' }],
                                })];
                        case 3:
                            latestOrder = _a.sent();
                            if (!latestOrder) {
                                return [2 /*return*/, null];
                            }
                            return [2 /*return*/, this.createDomainAnswer('canteen', {
                                    answer: "\u0110\u01A1n canteen g\u1EA7n nh\u1EA5t c\u1EE7a b\u1EA1n l\u00E0 ".concat(latestOrder.orderCode, " (").concat(latestOrder.status, ")."),
                                    citations: [(0, chatbot_utils_1.buildDbCitation)('Đơn canteen gần nhất', latestOrder.id, 'canteen_orders', '/services/canteen')],
                                    actions: [this.registry.buildDomainAction('canteen')],
                                    suggestedQuestions: ['Đơn canteen gần nhất của tôi', 'Canteen hôm nay còn món gì?'],
                                    confidence: 0.9,
                                    intent: 'canteen_summary_personal',
                                    answerType: 'summary',
                                })];
                        case 4: return [2 /*return*/, null];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.answerLibrary = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var asksRequests, asksBorrowed, requests, loans, searchTokens, where, books;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            asksRequests = (0, chatbot_utils_1.includesAnyPhrase)(context.normalizedMessage, ['yeu cau muon', 'don muon']) ||
                                context.tokens.includes('request');
                            asksBorrowed = (0, chatbot_utils_1.includesAnyPhrase)(context.normalizedMessage, ['sach dang muon', 'muon sach']) ||
                                context.tokens.includes('loan');
                            if (!asksRequests) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.prisma.libraryLoanRequest.findMany({
                                    where: {
                                        requesterId: context.userId,
                                        status: {
                                            in: [
                                                client_1.LibraryLoanRequestStatus.pending,
                                                client_1.LibraryLoanRequestStatus.approved,
                                                client_1.LibraryLoanRequestStatus.rejected,
                                                client_1.LibraryLoanRequestStatus.cancelled,
                                            ],
                                        },
                                    },
                                    include: {
                                        book: { select: { id: true, title: true } },
                                        copy: { select: { id: true, copyCode: true } },
                                    },
                                    orderBy: [{ createdAt: 'desc' }],
                                    take: 3,
                                })];
                        case 1:
                            requests = _a.sent();
                            if (!requests.length) {
                                return [2 /*return*/, this.createDomainAnswer('library', {
                                        answer: 'Bạn chưa có yêu cầu mượn sách nào gần đây.',
                                        citations: [],
                                        actions: [this.registry.buildDomainAction('library')],
                                        suggestedQuestions: this.getSuggestedQuestions('library', context.role),
                                        confidence: 0.92,
                                        intent: 'library_requests_empty',
                                        answerType: 'live',
                                    })];
                            }
                            return [2 /*return*/, this.createDomainAnswer('library', {
                                    answer: "B\u1EA1n c\u00F3 ".concat(requests.length, " y\u00EAu c\u1EA7u m\u01B0\u1EE3n g\u1EA7n nh\u1EA5t: ").concat(requests
                                        .map(function (item) { return "\"".concat(item.book.title, "\" (").concat(getLoanRequestStatusLabel(item.status), ", copy ").concat(item.copy.copyCode, ")"); })
                                        .join('; '), "."),
                                    citations: requests.map(function (item) {
                                        return (0, chatbot_utils_1.buildDbCitation)(item.book.title, item.id, 'library_loan_requests', '/services/library');
                                    }),
                                    actions: [this.registry.buildDomainAction('library')],
                                    suggestedQuestions: this.getSuggestedQuestions('library', context.role),
                                    confidence: 0.96,
                                    intent: 'library_loan_requests',
                                    answerType: 'live',
                                })];
                        case 2:
                            if (!(asksBorrowed || context.role === client_1.Role.student || context.role === client_1.Role.lecturer)) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.prisma.libraryLoan.findMany({
                                    where: {
                                        borrowerId: context.userId,
                                        status: { in: [client_1.LibraryLoanStatus.borrowed, client_1.LibraryLoanStatus.overdue] },
                                    },
                                    include: {
                                        copy: { include: { book: true } },
                                    },
                                    orderBy: [{ dueAt: 'asc' }],
                                    take: 3,
                                })];
                        case 3:
                            loans = _a.sent();
                            if (loans.length) {
                                return [2 /*return*/, this.createDomainAnswer('library', {
                                        answer: "B\u1EA1n \u0111ang m\u01B0\u1EE3n ".concat(loans.length, " cu\u1ED1n: ").concat(loans
                                            .map(function (loan) { return "\"".concat(loan.copy.book.title, "\" (h\u1EA1n ").concat(loan.dueAt.toLocaleDateString('vi-VN'), ")"); })
                                            .join('; '), "."),
                                        citations: loans.map(function (loan) {
                                            return (0, chatbot_utils_1.buildDbCitation)(loan.copy.book.title, loan.id, 'library_loans', '/services/library');
                                        }),
                                        actions: [this.registry.buildDomainAction('library')],
                                        suggestedQuestions: this.getSuggestedQuestions('library', context.role),
                                        confidence: 0.96,
                                        intent: 'library_my_loans',
                                        answerType: 'live',
                                    })];
                            }
                            _a.label = 4;
                        case 4:
                            searchTokens = context.tokens.filter(function (token) { return !['library', 'loan', 'book', 'sach', 'muon'].includes(token); });
                            where = __assign({ isActive: true }, (searchTokens.length
                                ? {
                                    AND: searchTokens.map(function (token) { return ({
                                        OR: [
                                            { title: { contains: token, mode: 'insensitive' } },
                                            { authors: { contains: token, mode: 'insensitive' } },
                                        ],
                                    }); }),
                                }
                                : {}));
                            return [4 /*yield*/, this.prisma.libraryBook.findMany({
                                    where: where,
                                    orderBy: [{ updatedAt: 'desc' }],
                                    take: 3,
                                })];
                        case 5:
                            books = _a.sent();
                            if (!books.length) {
                                return [2 /*return*/, this.createDomainAnswer('library', {
                                        answer: 'Mình chưa tìm thấy đầu sách phù hợp trong thư viện với từ khóa bạn vừa hỏi.',
                                        citations: [],
                                        actions: [this.registry.buildDomainAction('library')],
                                        suggestedQuestions: ['Sách tôi đang mượn', 'Yêu cầu mượn gần nhất của tôi'],
                                        confidence: 0.7,
                                        intent: 'library_search_empty',
                                        answerType: 'live',
                                    })];
                            }
                            return [2 /*return*/, this.createDomainAnswer('library', {
                                    answer: "M\u00ECnh t\u00ECm th\u1EA5y ".concat(books.length, " \u0111\u1EA7u s\u00E1ch ph\u00F9 h\u1EE3p: ").concat(books
                                        .map(function (book) { return "\"".concat(book.title, "\" (").concat(book.authors, ")"); })
                                        .join('; '), "."),
                                    citations: books.map(function (book) {
                                        return (0, chatbot_utils_1.buildDbCitation)(book.title, book.id, 'library_books', '/services/library');
                                    }),
                                    actions: [this.registry.buildDomainAction('library')],
                                    suggestedQuestions: this.getSuggestedQuestions('library', context.role),
                                    confidence: 0.9,
                                    intent: 'library_search',
                                    answerType: 'live',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.buildLibrarySummary = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var pendingRequests, activeLoans;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(0, chatbot_utils_1.isAdminRole)(context.role)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.prisma.libraryLoanRequest.count({
                                    where: { status: client_1.LibraryLoanRequestStatus.pending },
                                })];
                        case 1:
                            pendingRequests = _a.sent();
                            if (!pendingRequests) {
                                return [2 /*return*/, null];
                            }
                            return [2 /*return*/, this.createDomainAnswer('library', {
                                    answer: "Th\u01B0 vi\u1EC7n \u0111ang c\u00F3 ".concat(pendingRequests, " y\u00EAu c\u1EA7u m\u01B0\u1EE3n ch\u1EDD x\u1EED l\u00FD."),
                                    citations: [(0, chatbot_utils_1.buildDerivedCitation)('Pending library loan requests', 'library-summary', '/services/library/admin')],
                                    actions: [this.registry.buildDomainAction('library', '/services/library/admin')],
                                    suggestedQuestions: ['Mở thư viện', 'Tài liệu mới'],
                                    confidence: 0.88,
                                    intent: 'library_summary_admin',
                                    answerType: 'summary',
                                })];
                        case 2: return [4 /*yield*/, this.prisma.libraryLoan.count({
                                where: {
                                    borrowerId: context.userId,
                                    status: { in: [client_1.LibraryLoanStatus.borrowed, client_1.LibraryLoanStatus.overdue] },
                                },
                            })];
                        case 3:
                            activeLoans = _a.sent();
                            if (!activeLoans) {
                                return [2 /*return*/, null];
                            }
                            return [2 /*return*/, this.createDomainAnswer('library', {
                                    answer: "B\u1EA1n hi\u1EC7n c\u00F3 ".concat(activeLoans, " s\u00E1ch \u0111ang m\u01B0\u1EE3n trong th\u01B0 vi\u1EC7n."),
                                    citations: [(0, chatbot_utils_1.buildDerivedCitation)('Library active loans', 'library-personal-summary', '/services/library')],
                                    actions: [this.registry.buildDomainAction('library')],
                                    suggestedQuestions: ['Sách tôi đang mượn', 'Yêu cầu mượn gần nhất của tôi'],
                                    confidence: 0.87,
                                    intent: 'library_summary_personal',
                                    answerType: 'summary',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.answerSchedule = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var asksWeek, todayDow, sections, meetings_1, summary_1, enrollments, meetings, summary;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            asksWeek = (0, chatbot_utils_1.includesAnyPhrase)(context.normalizedMessage, ['tuan nay', 'ca tuan', 'lich tuan']);
                            todayDow = context.now.getDay();
                            if (!(context.role === client_1.Role.lecturer)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.prisma.classSection.findMany({
                                    where: { lecturerId: context.userId },
                                    include: {
                                        course: true,
                                        meetings: asksWeek
                                            ? {
                                                orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
                                            }
                                            : {
                                                where: { dayOfWeek: todayDow },
                                                orderBy: [{ startTime: 'asc' }],
                                            },
                                    },
                                })];
                        case 1:
                            sections = _a.sent();
                            meetings_1 = sections.flatMap(function (section) {
                                return section.meetings.map(function (meeting) {
                                    var _a;
                                    return ({
                                        id: meeting.id,
                                        course: section.course.name,
                                        room: (_a = meeting.room) !== null && _a !== void 0 ? _a : 'chưa xác định',
                                        startTime: meeting.startTime,
                                        endTime: meeting.endTime,
                                        dayOfWeek: meeting.dayOfWeek,
                                    });
                                });
                            });
                            if (!meetings_1.length) {
                                return [2 /*return*/, this.createDomainAnswer('schedule', {
                                        answer: asksWeek ? 'Tuần này bạn chưa có lịch dạy nào.' : 'Hôm nay bạn chưa có lịch dạy.',
                                        citations: [],
                                        actions: [this.registry.buildDomainAction('schedule')],
                                        suggestedQuestions: this.getSuggestedQuestions('schedule', context.role),
                                        confidence: 0.92,
                                        intent: asksWeek ? 'schedule_week_lecturer_empty' : 'schedule_today_lecturer_empty',
                                        answerType: 'live',
                                    })];
                            }
                            summary_1 = asksWeek
                                ? meetings_1
                                    .map(function (item) { return "".concat((0, chatbot_utils_1.getWeekdayLabel)(item.dayOfWeek), ": ").concat(item.course, " (").concat(item.startTime, "-").concat(item.endTime, ", ph\u00F2ng ").concat(item.room, ")"); })
                                    .join(' | ')
                                : meetings_1.map(function (item) { return "".concat(item.course, " (").concat(item.startTime, "-").concat(item.endTime, ", ph\u00F2ng ").concat(item.room, ")"); }).join('; ');
                            return [2 /*return*/, this.createDomainAnswer('schedule', {
                                    answer: asksWeek ? "L\u1ECBch d\u1EA1y tu\u1EA7n n\u00E0y c\u1EE7a b\u1EA1n: ".concat(summary_1, ".") : "H\u00F4m nay b\u1EA1n c\u00F3 ".concat(meetings_1.length, " bu\u1ED5i d\u1EA1y: ").concat(summary_1, "."),
                                    citations: meetings_1.map(function (item) {
                                        return (0, chatbot_utils_1.buildDbCitation)(item.course, item.id, 'class_meetings', '/schedule');
                                    }),
                                    actions: [this.registry.buildDomainAction('schedule')],
                                    suggestedQuestions: this.getSuggestedQuestions('schedule', context.role),
                                    confidence: 0.95,
                                    intent: asksWeek ? 'schedule_week_lecturer' : 'schedule_today_lecturer',
                                    answerType: 'live',
                                })];
                        case 2: return [4 /*yield*/, this.prisma.classEnrollment.findMany({
                                where: { studentId: context.userId, status: 'active' },
                                include: {
                                    classSection: {
                                        include: {
                                            course: true,
                                            meetings: asksWeek
                                                ? {
                                                    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
                                                }
                                                : {
                                                    where: { dayOfWeek: todayDow },
                                                    orderBy: [{ startTime: 'asc' }],
                                                },
                                        },
                                    },
                                },
                            })];
                        case 3:
                            enrollments = _a.sent();
                            meetings = enrollments.flatMap(function (enrollment) {
                                return enrollment.classSection.meetings.map(function (meeting) {
                                    var _a;
                                    return ({
                                        id: meeting.id,
                                        course: enrollment.classSection.course.name,
                                        room: (_a = meeting.room) !== null && _a !== void 0 ? _a : 'chưa xác định',
                                        startTime: meeting.startTime,
                                        endTime: meeting.endTime,
                                        dayOfWeek: meeting.dayOfWeek,
                                    });
                                });
                            });
                            if (!meetings.length) {
                                return [2 /*return*/, this.createDomainAnswer('schedule', {
                                        answer: asksWeek ? 'Tuần này bạn chưa có lịch học nào.' : 'Hôm nay bạn không có lịch học.',
                                        citations: [],
                                        actions: [this.registry.buildDomainAction('schedule')],
                                        suggestedQuestions: this.getSuggestedQuestions('schedule', context.role),
                                        confidence: 0.93,
                                        intent: asksWeek ? 'schedule_week_student_empty' : 'schedule_today_student_empty',
                                        answerType: 'live',
                                    })];
                            }
                            summary = asksWeek
                                ? meetings
                                    .map(function (item) { return "".concat((0, chatbot_utils_1.getWeekdayLabel)(item.dayOfWeek), ": ").concat(item.course, " (").concat(item.startTime, "-").concat(item.endTime, ", ph\u00F2ng ").concat(item.room, ")"); })
                                    .join(' | ')
                                : meetings.map(function (item) { return "".concat(item.course, " (").concat(item.startTime, "-").concat(item.endTime, ", ph\u00F2ng ").concat(item.room, ")"); }).join('; ');
                            return [2 /*return*/, this.createDomainAnswer('schedule', {
                                    answer: asksWeek ? "L\u1ECBch h\u1ECDc tu\u1EA7n n\u00E0y c\u1EE7a b\u1EA1n: ".concat(summary, ".") : "H\u00F4m nay b\u1EA1n c\u00F3 ".concat(meetings.length, " ti\u1EBFt: ").concat(summary, "."),
                                    citations: meetings.map(function (item) {
                                        return (0, chatbot_utils_1.buildDbCitation)(item.course, item.id, 'class_meetings', '/schedule');
                                    }),
                                    actions: [this.registry.buildDomainAction('schedule')],
                                    suggestedQuestions: this.getSuggestedQuestions('schedule', context.role),
                                    confidence: 0.95,
                                    intent: asksWeek ? 'schedule_week_student' : 'schedule_today_student',
                                    answerType: 'live',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.buildScheduleSummary = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var scheduleAnswer;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (context.scope !== 'today') {
                                return [2 /*return*/, null];
                            }
                            return [4 /*yield*/, this.answerSchedule({
                                    userId: context.userId,
                                    role: context.role,
                                    message: 'lich hom nay',
                                    normalizedMessage: 'lich hom nay',
                                    tokens: ['schedule', 'hom', 'nay'],
                                    now: context.now,
                                })];
                        case 1:
                            scheduleAnswer = _a.sent();
                            return [2 /*return*/, this.createDomainAnswer('schedule', {
                                    answer: scheduleAnswer.answer,
                                    citations: scheduleAnswer.citations,
                                    actions: scheduleAnswer.actions,
                                    suggestedQuestions: scheduleAnswer.suggestedQuestions,
                                    confidence: scheduleAnswer.confidence,
                                    intent: scheduleAnswer.intent,
                                    answerType: 'summary',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.answerGrades = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var classSections, grades, gpa;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!(context.role === client_1.Role.lecturer)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.prisma.classSection.findMany({
                                    where: { lecturerId: context.userId },
                                    include: { course: true, semester: true },
                                    orderBy: [{ updatedAt: 'desc' }],
                                    take: 3,
                                })];
                        case 1:
                            classSections = _b.sent();
                            if (!classSections.length) {
                                return [2 /*return*/, this.createDomainAnswer('grades', {
                                        answer: 'Bạn chưa có lớp học phần nào để nhập điểm trong hệ thống.',
                                        citations: [],
                                        actions: [this.registry.buildDomainAction('grades', '/services/grades/lecturer')],
                                        suggestedQuestions: this.getSuggestedQuestions('grades', context.role),
                                        confidence: 0.88,
                                        intent: 'grades_lecturer_empty',
                                        answerType: 'live',
                                    })];
                            }
                            return [2 /*return*/, this.createDomainAnswer('grades', {
                                    answer: "B\u1EA1n \u0111ang qu\u1EA3n l\u00FD ".concat(classSections.length, " l\u1EDBp nh\u1EADp \u0111i\u1EC3m g\u1EA7n nh\u1EA5t: ").concat(classSections
                                        .map(function (section) { return "".concat(section.course.name, " (").concat(section.classCode, ")"); })
                                        .join('; '), "."),
                                    citations: classSections.map(function (section) {
                                        return (0, chatbot_utils_1.buildDbCitation)(section.course.name, section.id, 'class_sections', '/services/grades/lecturer');
                                    }),
                                    actions: [this.registry.buildDomainAction('grades', '/services/grades/lecturer')],
                                    suggestedQuestions: this.getSuggestedQuestions('grades', context.role),
                                    confidence: 0.9,
                                    intent: 'grades_lecturer_sections',
                                    answerType: 'live',
                                })];
                        case 2: return [4 /*yield*/, this.prisma.grade.findMany({
                                where: { userId: context.userId },
                                include: { course: true, semester: true },
                                orderBy: [{ updatedAt: 'desc' }],
                                take: 3,
                            })];
                        case 3:
                            grades = _b.sent();
                            if (!grades.length) {
                                return [2 /*return*/, this.createDomainAnswer('grades', {
                                        answer: 'Bạn chưa có dữ liệu điểm nào trong hệ thống.',
                                        citations: [],
                                        actions: [this.registry.buildDomainAction('grades')],
                                        suggestedQuestions: this.getSuggestedQuestions('grades', context.role),
                                        confidence: 0.88,
                                        intent: 'grades_student_empty',
                                        answerType: 'live',
                                    })];
                            }
                            return [4 /*yield*/, this.prisma.grade.aggregate({
                                    where: { userId: context.userId, gradePoint: { not: null } },
                                    _avg: { gradePoint: true },
                                })];
                        case 4:
                            gpa = _b.sent();
                            return [2 /*return*/, this.createDomainAnswer('grades', {
                                    answer: "GPA hi\u1EC7n t\u1EA1i c\u1EE7a b\u1EA1n kho\u1EA3ng ".concat(Number((_a = gpa._avg.gradePoint) !== null && _a !== void 0 ? _a : 0).toFixed(2), ". C\u00E1c m\u00F4n c\u1EADp nh\u1EADt g\u1EA7n nh\u1EA5t: ").concat(grades
                                        .map(function (grade) { var _a; return "".concat(grade.course.name, " (").concat((_a = grade.letterGrade) !== null && _a !== void 0 ? _a : 'chưa chốt', ")"); })
                                        .join('; '), "."),
                                    citations: grades.map(function (grade) {
                                        return (0, chatbot_utils_1.buildDbCitation)(grade.course.name, grade.id, 'grades', '/services/grades');
                                    }),
                                    actions: [this.registry.buildDomainAction('grades')],
                                    suggestedQuestions: this.getSuggestedQuestions('grades', context.role),
                                    confidence: 0.93,
                                    intent: 'grades_student_summary',
                                    answerType: 'live',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.buildGradesSummary = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var answer;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (context.scope !== 'work') {
                                return [2 /*return*/, null];
                            }
                            return [4 /*yield*/, this.answerGrades({
                                    userId: context.userId,
                                    role: context.role,
                                    message: 'diem hien tai',
                                    normalizedMessage: 'diem hien tai',
                                    tokens: ['diem', 'gpa'],
                                    now: context.now,
                                })];
                        case 1:
                            answer = _a.sent();
                            return [2 /*return*/, this.createDomainAnswer('grades', {
                                    answer: answer.answer,
                                    citations: answer.citations,
                                    actions: answer.actions,
                                    suggestedQuestions: answer.suggestedQuestions,
                                    confidence: answer.confidence,
                                    intent: answer.intent,
                                    answerType: 'summary',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.answerAttendance = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var activeSessions, latestRecord;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(context.role === client_1.Role.lecturer)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.prisma.attendanceSession.findMany({
                                    where: {
                                        lecturerId: context.userId,
                                        status: client_1.AttendanceSessionStatus.active,
                                    },
                                    include: {
                                        classSection: { include: { course: true } },
                                    },
                                    orderBy: [{ startedAt: 'desc' }],
                                    take: 3,
                                })];
                        case 1:
                            activeSessions = _a.sent();
                            if (!activeSessions.length) {
                                return [2 /*return*/, this.createDomainAnswer('attendance', {
                                        answer: 'Bạn hiện chưa có phiên điểm danh QR nào đang mở.',
                                        citations: [],
                                        actions: [this.registry.buildDomainAction('attendance', '/services/attendance/lecturer')],
                                        suggestedQuestions: this.getSuggestedQuestions('attendance', context.role),
                                        confidence: 0.9,
                                        intent: 'attendance_lecturer_empty',
                                        answerType: 'live',
                                    })];
                            }
                            return [2 /*return*/, this.createDomainAnswer('attendance', {
                                    answer: "B\u1EA1n \u0111ang c\u00F3 ".concat(activeSessions.length, " phi\u00EAn \u0111i\u1EC3m danh m\u1EDF: ").concat(activeSessions
                                        .map(function (session) { return "".concat(session.classSection.course.name, " (h\u1EBFt h\u1EA1n ").concat(session.expiresAt.toLocaleTimeString('vi-VN'), ")"); })
                                        .join('; '), "."),
                                    citations: activeSessions.map(function (session) {
                                        return (0, chatbot_utils_1.buildDbCitation)(session.classSection.course.name, session.id, 'attendance_sessions', '/services/attendance/lecturer');
                                    }),
                                    actions: [this.registry.buildDomainAction('attendance', '/services/attendance/lecturer')],
                                    suggestedQuestions: this.getSuggestedQuestions('attendance', context.role),
                                    confidence: 0.93,
                                    intent: 'attendance_lecturer_active',
                                    answerType: 'live',
                                })];
                        case 2: return [4 /*yield*/, this.prisma.attendanceRecord.findFirst({
                                where: { studentId: context.userId },
                                include: {
                                    session: {
                                        include: {
                                            classSection: { include: { course: true } },
                                        },
                                    },
                                },
                                orderBy: [{ checkinTime: 'desc' }],
                            })];
                        case 3:
                            latestRecord = _a.sent();
                            if (!latestRecord) {
                                return [2 /*return*/, this.createDomainAnswer('attendance', {
                                        answer: 'Bạn chưa có lịch sử điểm danh nào trong hệ thống.',
                                        citations: [],
                                        actions: [this.registry.buildDomainAction('attendance')],
                                        suggestedQuestions: this.getSuggestedQuestions('attendance', context.role),
                                        confidence: 0.89,
                                        intent: 'attendance_student_empty',
                                        answerType: 'live',
                                    })];
                            }
                            return [2 /*return*/, this.createDomainAnswer('attendance', {
                                    answer: "L\u1EA7n \u0111i\u1EC3m danh g\u1EA7n nh\u1EA5t c\u1EE7a b\u1EA1n l\u00E0 ".concat(latestRecord.session.classSection.course.name, " l\u00FAc ").concat(latestRecord.checkinTime.toLocaleString('vi-VN'), "."),
                                    citations: [
                                        (0, chatbot_utils_1.buildDbCitation)(latestRecord.session.classSection.course.name, latestRecord.id, 'attendance_records', '/services/attendance/history'),
                                    ],
                                    actions: [this.registry.buildDomainAction('attendance', '/services/attendance/history')],
                                    suggestedQuestions: this.getSuggestedQuestions('attendance', context.role),
                                    confidence: 0.92,
                                    intent: 'attendance_student_latest',
                                    answerType: 'live',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.buildAttendanceSummary = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var answer;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (context.scope !== 'today') {
                                return [2 /*return*/, null];
                            }
                            return [4 /*yield*/, this.answerAttendance({
                                    userId: context.userId,
                                    role: context.role,
                                    message: 'diem danh hom nay',
                                    normalizedMessage: 'diem danh hom nay',
                                    tokens: ['attendance', 'hom', 'nay'],
                                    now: context.now,
                                })];
                        case 1:
                            answer = _a.sent();
                            return [2 /*return*/, this.createDomainAnswer('attendance', {
                                    answer: answer.answer,
                                    citations: answer.citations,
                                    actions: answer.actions,
                                    suggestedQuestions: answer.suggestedQuestions,
                                    confidence: answer.confidence,
                                    intent: answer.intent,
                                    answerType: 'summary',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.answerRegistrations = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, activeEnrollments, availableSections;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.prisma.classEnrollment.count({
                                    where: { studentId: context.userId, status: 'active' },
                                }),
                                this.prisma.classSection.count({
                                    where: { registrationOpen: true },
                                }),
                            ])];
                        case 1:
                            _a = _b.sent(), activeEnrollments = _a[0], availableSections = _a[1];
                            return [2 /*return*/, this.createDomainAnswer('registrations', {
                                    answer: "B\u1EA1n \u0111ang c\u00F3 ".concat(activeEnrollments, " l\u1EDBp \u0111\u0103ng k\u00FD ho\u1EA1t \u0111\u1ED9ng. Hi\u1EC7n h\u1EC7 th\u1ED1ng c\u00F3 ").concat(availableSections, " l\u1EDBp h\u1ECDc ph\u1EA7n \u0111ang m\u1EDF \u0111\u0103ng k\u00FD."),
                                    citations: [
                                        (0, chatbot_utils_1.buildDerivedCitation)('Đăng ký môn hiện tại', 'registration-active', '/services/course-registration'),
                                    ],
                                    actions: [this.registry.buildDomainAction('registrations')],
                                    suggestedQuestions: this.getSuggestedQuestions('registrations', context.role),
                                    confidence: 0.9,
                                    intent: 'registration_status',
                                    answerType: 'live',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.buildRegistrationSummary = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var answer;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (context.role !== client_1.Role.student || context.scope !== 'work') {
                                return [2 /*return*/, null];
                            }
                            return [4 /*yield*/, this.answerRegistrations({
                                    userId: context.userId,
                                    role: context.role,
                                    message: 'dang ky mon',
                                    normalizedMessage: 'dang ky mon',
                                    tokens: ['registration'],
                                    now: context.now,
                                })];
                        case 1:
                            answer = _a.sent();
                            return [2 /*return*/, this.createDomainAnswer('registrations', {
                                    answer: answer.answer,
                                    citations: answer.citations,
                                    actions: answer.actions,
                                    suggestedQuestions: answer.suggestedQuestions,
                                    confidence: answer.confidence,
                                    intent: answer.intent,
                                    answerType: 'summary',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.answerStudyMaterials = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var searchTokens, category, where, materials;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            searchTokens = context.tokens.filter(function (token) { return !['study', 'material', 'tai', 'lieu', 'de', 'thi', 'giao', 'trinh', 'pdf', 'doc'].includes(token); });
                            category = context.tokens.includes('exam')
                                ? client_1.StudyMaterialCategory.exam
                                : context.tokens.includes('textbook')
                                    ? client_1.StudyMaterialCategory.textbook
                                    : undefined;
                            where = __assign(__assign({}, (category ? { category: category } : {})), (searchTokens.length
                                ? {
                                    AND: searchTokens.map(function (token) { return ({
                                        OR: [
                                            { title: { contains: token, mode: 'insensitive' } },
                                            { description: { contains: token, mode: 'insensitive' } },
                                            { fileName: { contains: token, mode: 'insensitive' } },
                                        ],
                                    }); }),
                                }
                                : {}));
                            return [4 /*yield*/, this.prisma.studyMaterial.findMany({
                                    where: where,
                                    include: {
                                        uploader: {
                                            select: { firstName: true, lastName: true },
                                        },
                                    },
                                    orderBy: [{ createdAt: 'desc' }],
                                    take: 3,
                                })];
                        case 1:
                            materials = _a.sent();
                            if (!materials.length) {
                                return [2 /*return*/, this.createDomainAnswer('study-materials', {
                                        answer: 'Mình chưa tìm thấy tài liệu phù hợp với từ khóa bạn vừa hỏi.',
                                        citations: [],
                                        actions: [
                                            this.registry.buildDomainAction('study-materials', (0, chatbot_utils_1.isAdminRole)(context.role) ? '/services/study-materials/admin' : '/services/study-materials'),
                                        ],
                                        suggestedQuestions: this.getSuggestedQuestions('study-materials', context.role),
                                        confidence: 0.72,
                                        intent: 'study_materials_empty',
                                        answerType: 'live',
                                    })];
                            }
                            return [2 /*return*/, this.createDomainAnswer('study-materials', {
                                    answer: "C\u00F3 ".concat(materials.length, " t\u00E0i li\u1EC7u ph\u00F9 h\u1EE3p: ").concat(materials
                                        .map(function (item) {
                                        return "".concat(item.title, " (").concat(MATERIAL_CATEGORY_LABELS[item.category], ", ").concat(item.fileName, ", \u0111\u0103ng b\u1EDFi ").concat(item.uploader.lastName, " ").concat(item.uploader.firstName, ")");
                                    })
                                        .join('; '), "."),
                                    citations: materials.map(function (item) {
                                        return (0, chatbot_utils_1.buildDbCitation)(item.title, item.id, 'study_materials', (0, chatbot_utils_1.isAdminRole)(context.role) ? '/services/study-materials/admin' : '/services/study-materials');
                                    }),
                                    actions: [
                                        this.registry.buildDomainAction('study-materials', (0, chatbot_utils_1.isAdminRole)(context.role) ? '/services/study-materials/admin' : '/services/study-materials'),
                                    ],
                                    suggestedQuestions: this.getSuggestedQuestions('study-materials', context.role),
                                    confidence: 0.92,
                                    intent: 'study_materials_search',
                                    answerType: 'live',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.buildStudyMaterialsSummary = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var where, recentCount, route;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (context.scope !== 'work' && context.scope !== 'ops') {
                                return [2 /*return*/, null];
                            }
                            where = context.role === client_1.Role.lecturer
                                ? { uploaderId: context.userId }
                                : context.scope === 'ops'
                                    ? {}
                                    : {};
                            return [4 /*yield*/, this.prisma.studyMaterial.count({ where: where })];
                        case 1:
                            recentCount = _a.sent();
                            if (!recentCount) {
                                return [2 /*return*/, null];
                            }
                            route = (0, chatbot_utils_1.isAdminRole)(context.role) ? '/services/study-materials/admin' : '/services/study-materials';
                            return [2 /*return*/, this.createDomainAnswer('study-materials', {
                                    answer: context.role === client_1.Role.lecturer
                                        ? "B\u1EA1n \u0111ang c\u00F3 ".concat(recentCount, " t\u00E0i li\u1EC7u \u0111\u00E3 \u0111\u0103ng trong kho h\u1ECDc t\u1EADp.")
                                        : "Kho t\u00E0i li\u1EC7u hi\u1EC7n c\u00F3 ".concat(recentCount, " t\u00E0i li\u1EC7u kh\u1EA3 d\u1EE5ng \u0111\u1EC3 tra c\u1EE9u."),
                                    citations: [(0, chatbot_utils_1.buildDerivedCitation)('Study materials summary', 'study-materials-summary', route)],
                                    actions: [this.registry.buildDomainAction('study-materials', route)],
                                    suggestedQuestions: ['Tài liệu mới nhất', 'Đề thi mới được đăng'],
                                    confidence: 0.88,
                                    intent: 'study_materials_summary',
                                    answerType: 'summary',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.answerRoomBookings = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var pending, latestBooking;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!((0, chatbot_utils_1.isAdminRole)(context.role) && context.tokens.some(function (token) { return ['queue', 'approve', 'phe', 'duyet'].includes(token); }))) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.prisma.roomBooking.count({
                                    where: { status: 'pending' },
                                })];
                        case 1:
                            pending = _c.sent();
                            return [2 /*return*/, this.createDomainAnswer('room-bookings', {
                                    answer: "Hi\u1EC7n c\u00F3 ".concat(pending, " y\u00EAu c\u1EA7u \u0111\u1EB7t ph\u00F2ng \u0111ang ch\u1EDD ph\u00EA duy\u1EC7t."),
                                    citations: [(0, chatbot_utils_1.buildDerivedCitation)('Queue đặt phòng', 'room-bookings-pending', '/services/room-booking/approvals')],
                                    actions: [this.registry.buildDomainAction('room-bookings', '/services/room-booking/approvals')],
                                    suggestedQuestions: this.getSuggestedQuestions('room-bookings', context.role),
                                    confidence: 0.92,
                                    intent: 'room_booking_queue',
                                    answerType: 'live',
                                })];
                        case 2: return [4 /*yield*/, this.prisma.roomBooking.findFirst({
                                where: { userId: context.userId },
                                include: { room: true },
                                orderBy: [{ createdAt: 'desc' }],
                            })];
                        case 3:
                            latestBooking = _c.sent();
                            if (!latestBooking) {
                                return [2 /*return*/, this.createDomainAnswer('room-bookings', {
                                        answer: 'Bạn chưa có yêu cầu đặt phòng nào gần đây.',
                                        citations: [],
                                        actions: [this.registry.buildDomainAction('room-bookings')],
                                        suggestedQuestions: this.getSuggestedQuestions('room-bookings', context.role),
                                        confidence: 0.89,
                                        intent: 'room_booking_empty',
                                        answerType: 'live',
                                    })];
                            }
                            return [2 /*return*/, this.createDomainAnswer('room-bookings', {
                                    answer: "Y\u00EAu c\u1EA7u \u0111\u1EB7t ph\u00F2ng g\u1EA7n nh\u1EA5t: ph\u00F2ng ".concat((_a = latestBooking.room.name) !== null && _a !== void 0 ? _a : latestBooking.room.roomCode, " ng\u00E0y ").concat(latestBooking.bookingDate.toLocaleDateString('vi-VN'), ", tr\u1EA1ng th\u00E1i ").concat(latestBooking.status, "."),
                                    citations: [
                                        (0, chatbot_utils_1.buildDbCitation)((_b = latestBooking.room.name) !== null && _b !== void 0 ? _b : latestBooking.room.roomCode, latestBooking.id, 'room_bookings', '/services/room-booking/my'),
                                    ],
                                    actions: [this.registry.buildDomainAction('room-bookings', '/services/room-booking/my')],
                                    suggestedQuestions: this.getSuggestedQuestions('room-bookings', context.role),
                                    confidence: 0.94,
                                    intent: 'room_booking_status',
                                    answerType: 'live',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.buildRoomBookingsSummary = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var pending;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(context.scope === 'ops' || (context.scope === 'work' && (0, chatbot_utils_1.isAdminRole)(context.role)))) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.prisma.roomBooking.count({
                                    where: { status: 'pending' },
                                })];
                        case 1:
                            pending = _a.sent();
                            if (!pending) {
                                return [2 /*return*/, null];
                            }
                            return [2 /*return*/, this.createDomainAnswer('room-bookings', {
                                    answer: "Queue \u0111\u1EB7t ph\u00F2ng \u0111ang c\u00F3 ".concat(pending, " y\u00EAu c\u1EA7u ch\u1EDD duy\u1EC7t."),
                                    citations: [(0, chatbot_utils_1.buildDerivedCitation)('Room booking queue', 'room-booking-summary', '/services/room-booking/approvals')],
                                    actions: [this.registry.buildDomainAction('room-bookings', '/services/room-booking/approvals')],
                                    suggestedQuestions: ['Có bao nhiêu yêu cầu đặt phòng chờ duyệt?'],
                                    confidence: 0.88,
                                    intent: 'room_booking_summary_admin',
                                    answerType: 'summary',
                                })];
                        case 2: return [2 /*return*/, null];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.answerParking = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, latestTelemetry, occupiedSlots, totalSlots, vehicles;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!((0, chatbot_utils_1.isAdminRole)(context.role) && context.tokens.some(function (token) { return ['telemetry', 'fire', 'slot', 'parking'].includes(token); }))) return [3 /*break*/, 2];
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.telemetrySnapshot.findFirst({
                                        orderBy: [{ reportedAt: 'desc' }],
                                    }),
                                    this.prisma.parkingSlot.count({ where: { isOccupied: true } }),
                                    this.prisma.parkingSlot.count(),
                                ])];
                        case 1:
                            _a = _c.sent(), latestTelemetry = _a[0], occupiedSlots = _a[1], totalSlots = _a[2];
                            return [2 /*return*/, this.createDomainAnswer('parking', {
                                    answer: "Parking hi\u1EC7n c\u00F3 ".concat(occupiedSlots, "/").concat(totalSlots || 0, " ch\u1ED7 \u0111ang s\u1EED d\u1EE5ng. Telemetry g\u1EA7n nh\u1EA5t l\u00FAc ").concat((_b = latestTelemetry === null || latestTelemetry === void 0 ? void 0 : latestTelemetry.reportedAt.toLocaleString('vi-VN')) !== null && _b !== void 0 ? _b : 'chưa có dữ liệu', ", fire alert=").concat((latestTelemetry === null || latestTelemetry === void 0 ? void 0 : latestTelemetry.fireDetected) ? 'có' : 'không', "."),
                                    citations: [(0, chatbot_utils_1.buildDerivedCitation)('Parking telemetry latest', 'parking-telemetry', '/services/parking')],
                                    actions: [this.registry.buildDomainAction('parking')],
                                    suggestedQuestions: this.getSuggestedQuestions('parking', context.role),
                                    confidence: 0.91,
                                    intent: 'parking_ops_status',
                                    answerType: 'live',
                                })];
                        case 2: return [4 /*yield*/, this.prisma.vehicle.findMany({
                                where: { userId: context.userId },
                                include: {
                                    subscription: true,
                                    parkingSessions: {
                                        where: { status: client_1.ParkingSessionStatus.active },
                                        orderBy: [{ entryTime: 'desc' }],
                                        take: 1,
                                    },
                                },
                                take: 3,
                            })];
                        case 3:
                            vehicles = _c.sent();
                            if (!vehicles.length) {
                                return [2 /*return*/, this.createDomainAnswer('parking', {
                                        answer: 'Bạn chưa đăng ký xe nào trong hệ thống parking.',
                                        citations: [],
                                        actions: [this.registry.buildDomainAction('parking')],
                                        suggestedQuestions: this.getSuggestedQuestions('parking', context.role),
                                        confidence: 0.87,
                                        intent: 'parking_vehicle_empty',
                                        answerType: 'live',
                                    })];
                            }
                            return [2 /*return*/, this.createDomainAnswer('parking', {
                                    answer: "B\u1EA1n c\u00F3 ".concat(vehicles.length, " xe \u0111\u00E3 \u0111\u0103ng k\u00FD: ").concat(vehicles
                                        .map(function (vehicle) {
                                        var _a, _b;
                                        var session = vehicle.parkingSessions[0];
                                        var subscription = (_b = (_a = vehicle.subscription) === null || _a === void 0 ? void 0 : _a.status) !== null && _b !== void 0 ? _b : client_1.SubscriptionStatus.inactive;
                                        return "".concat(vehicle.plateNumber, " (g\u00F3i ").concat(subscription).concat(session ? ", \u0111ang g\u1EEDi t\u1EEB ".concat(session.entryTime.toLocaleTimeString('vi-VN')) : '', ")");
                                    })
                                        .join('; '), "."),
                                    citations: vehicles.map(function (vehicle) {
                                        return (0, chatbot_utils_1.buildDbCitation)(vehicle.plateNumber, vehicle.id, 'vehicles', '/services/parking');
                                    }),
                                    actions: [this.registry.buildDomainAction('parking')],
                                    suggestedQuestions: this.getSuggestedQuestions('parking', context.role),
                                    confidence: 0.9,
                                    intent: 'parking_personal_status',
                                    answerType: 'live',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.buildParkingSummary = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var answer;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (context.scope !== 'ops') {
                                return [2 /*return*/, null];
                            }
                            return [4 /*yield*/, this.answerParking({
                                    userId: context.userId,
                                    role: context.role,
                                    message: 'parking telemetry',
                                    normalizedMessage: 'parking telemetry',
                                    tokens: ['parking', 'telemetry', 'slot'],
                                    now: context.now,
                                })];
                        case 1:
                            answer = _a.sent();
                            return [2 /*return*/, this.createDomainAnswer('parking', {
                                    answer: answer.answer,
                                    citations: answer.citations,
                                    actions: answer.actions,
                                    suggestedQuestions: answer.suggestedQuestions,
                                    confidence: answer.confidence,
                                    intent: answer.intent,
                                    answerType: 'summary',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.answerEvents = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var events;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.event.findMany({
                                where: {
                                    status: client_1.EventStatus.open,
                                    startAt: { gte: context.now },
                                },
                                orderBy: [{ startAt: 'asc' }],
                                take: 3,
                            })];
                        case 1:
                            events = _a.sent();
                            if (!events.length) {
                                return [2 /*return*/, this.createDomainAnswer('events', {
                                        answer: 'Hiện chưa có sự kiện nào đang mở đăng ký.',
                                        citations: [],
                                        actions: [this.registry.buildDomainAction('events')],
                                        suggestedQuestions: this.getSuggestedQuestions('events', context.role),
                                        confidence: 0.85,
                                        intent: 'event_upcoming_empty',
                                        answerType: 'live',
                                    })];
                            }
                            return [2 /*return*/, this.createDomainAnswer('events', {
                                    answer: "C\u00F3 ".concat(events.length, " s\u1EF1 ki\u1EC7n s\u1EAFp t\u1EDBi: ").concat(events
                                        .map(function (event) { return "\"".concat(event.title, "\" - ").concat(event.startAt.toLocaleDateString('vi-VN'), " t\u1EA1i ").concat(event.location); })
                                        .join('; '), "."),
                                    citations: events.map(function (event) { return (0, chatbot_utils_1.buildDbCitation)(event.title, event.id, 'events', '/services/events'); }),
                                    actions: [this.registry.buildDomainAction('events')],
                                    suggestedQuestions: this.getSuggestedQuestions('events', context.role),
                                    confidence: 0.92,
                                    intent: 'event_upcoming',
                                    answerType: 'live',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.buildEventsSummary = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var eventsCount;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (context.scope !== 'today') {
                                return [2 /*return*/, null];
                            }
                            return [4 /*yield*/, this.prisma.event.count({
                                    where: {
                                        status: client_1.EventStatus.open,
                                        startAt: { gte: context.now },
                                    },
                                })];
                        case 1:
                            eventsCount = _a.sent();
                            if (!eventsCount) {
                                return [2 /*return*/, null];
                            }
                            return [2 /*return*/, this.createDomainAnswer('events', {
                                    answer: "Hi\u1EC7n c\u00F3 ".concat(eventsCount, " s\u1EF1 ki\u1EC7n \u0111ang m\u1EDF \u0111\u0103ng k\u00FD trong h\u1EC7 th\u1ED1ng."),
                                    citations: [(0, chatbot_utils_1.buildDerivedCitation)('Upcoming events count', 'events-summary', '/services/events')],
                                    actions: [this.registry.buildDomainAction('events')],
                                    suggestedQuestions: ['Sự kiện sắp tới'],
                                    confidence: 0.84,
                                    intent: 'event_summary',
                                    answerType: 'summary',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.answerNotifications = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, unreadCount, latest;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.prisma.notification.count({
                                    where: { userId: context.userId, isRead: false },
                                }),
                                this.prisma.notification.findFirst({
                                    where: { userId: context.userId },
                                    orderBy: [{ createdAt: 'desc' }],
                                }),
                            ])];
                        case 1:
                            _a = _b.sent(), unreadCount = _a[0], latest = _a[1];
                            if (!latest) {
                                return [2 /*return*/, this.createDomainAnswer('notifications', {
                                        answer: 'Bạn chưa có thông báo nào trong hệ thống.',
                                        citations: [],
                                        actions: [this.registry.buildDomainAction('notifications')],
                                        suggestedQuestions: this.getSuggestedQuestions('notifications', context.role),
                                        confidence: 0.86,
                                        intent: 'notification_empty',
                                        answerType: 'live',
                                    })];
                            }
                            return [2 /*return*/, this.createDomainAnswer('notifications', {
                                    answer: "B\u1EA1n c\u00F3 ".concat(unreadCount, " th\u00F4ng b\u00E1o ch\u01B0a \u0111\u1ECDc. Th\u00F4ng b\u00E1o m\u1EDBi nh\u1EA5t l\u00E0 \"").concat(latest.title, "\"."),
                                    citations: [(0, chatbot_utils_1.buildDbCitation)(latest.title, latest.id, 'notifications', '/alerts')],
                                    actions: [this.registry.buildDomainAction('notifications')],
                                    suggestedQuestions: this.getSuggestedQuestions('notifications', context.role),
                                    confidence: 0.92,
                                    intent: 'notification_unread',
                                    answerType: 'live',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.buildNotificationsSummary = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var answer;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (context.scope !== 'today') {
                                return [2 /*return*/, null];
                            }
                            return [4 /*yield*/, this.answerNotifications({
                                    userId: context.userId,
                                    role: context.role,
                                    message: 'thong bao chua doc',
                                    normalizedMessage: 'thong bao chua doc',
                                    tokens: ['notification'],
                                    now: context.now,
                                })];
                        case 1:
                            answer = _a.sent();
                            return [2 /*return*/, this.createDomainAnswer('notifications', {
                                    answer: answer.answer,
                                    citations: answer.citations,
                                    actions: answer.actions,
                                    suggestedQuestions: answer.suggestedQuestions,
                                    confidence: answer.confidence,
                                    intent: answer.intent,
                                    answerType: 'summary',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.answerSos = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var activeCount, latest;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!((0, chatbot_utils_1.isAdminRole)(context.role) && context.tokens.some(function (token) { return ['active', 'ops', 'queue'].includes(token); }))) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.prisma.sosRequest.count({
                                    where: { status: 'active' },
                                })];
                        case 1:
                            activeCount = _a.sent();
                            return [2 /*return*/, this.createDomainAnswer('sos', {
                                    answer: "Hi\u1EC7n c\u00F3 ".concat(activeCount, " y\u00EAu c\u1EA7u SOS \u0111ang ho\u1EA1t \u0111\u1ED9ng."),
                                    citations: [(0, chatbot_utils_1.buildDerivedCitation)('Active SOS requests', 'sos-active', '/services/gps-sos')],
                                    actions: [this.registry.buildDomainAction('sos')],
                                    suggestedQuestions: this.getSuggestedQuestions('sos', context.role),
                                    confidence: 0.9,
                                    intent: 'sos_active_count',
                                    answerType: 'live',
                                })];
                        case 2: return [4 /*yield*/, this.prisma.sosRequest.findFirst({
                                where: { requesterId: context.userId },
                                orderBy: [{ createdAt: 'desc' }],
                            })];
                        case 3:
                            latest = _a.sent();
                            if (!latest) {
                                return [2 /*return*/, this.createDomainAnswer('sos', {
                                        answer: 'Bạn chưa có lịch sử SOS nào. Khi cần hỗ trợ khẩn cấp, hãy mở GPS/SOS.',
                                        citations: [],
                                        actions: [this.registry.buildDomainAction('sos')],
                                        suggestedQuestions: this.getSuggestedQuestions('sos', context.role),
                                        confidence: 0.9,
                                        intent: 'sos_empty',
                                        answerType: 'live',
                                    })];
                            }
                            return [2 /*return*/, this.createDomainAnswer('sos', {
                                    answer: "Y\u00EAu c\u1EA7u SOS g\u1EA7n nh\u1EA5t c\u1EE7a b\u1EA1n \u0111ang \u1EDF tr\u1EA1ng th\u00E1i ".concat(latest.status, ", t\u1EA1o l\u00FAc ").concat(latest.createdAt.toLocaleString('vi-VN'), "."),
                                    citations: [(0, chatbot_utils_1.buildDbCitation)('SOS gần nhất', latest.id, 'sos_requests', '/services/gps-sos')],
                                    actions: [this.registry.buildDomainAction('sos')],
                                    suggestedQuestions: this.getSuggestedQuestions('sos', context.role),
                                    confidence: 0.93,
                                    intent: 'sos_status',
                                    answerType: 'live',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.buildSosSummary = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var activeCount;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (context.scope !== 'ops') {
                                return [2 /*return*/, null];
                            }
                            return [4 /*yield*/, this.prisma.sosRequest.count({
                                    where: { status: 'active' },
                                })];
                        case 1:
                            activeCount = _a.sent();
                            if (!activeCount) {
                                return [2 /*return*/, null];
                            }
                            return [2 /*return*/, this.createDomainAnswer('sos', {
                                    answer: "\u0110ang c\u00F3 ".concat(activeCount, " y\u00EAu c\u1EA7u SOS c\u1EA7n theo d\u00F5i."),
                                    citations: [(0, chatbot_utils_1.buildDerivedCitation)('SOS active summary', 'sos-summary', '/services/gps-sos')],
                                    actions: [this.registry.buildDomainAction('sos')],
                                    suggestedQuestions: ['Hiện có bao nhiêu SOS đang hoạt động?'],
                                    confidence: 0.86,
                                    intent: 'sos_summary',
                                    answerType: 'summary',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.answerOps = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, paidOrders, pendingBookings, latestTelemetry, activeSos, studyMaterials;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.prisma.canteenOrder.count({ where: { status: 'paid' } }),
                                this.prisma.roomBooking.count({ where: { status: 'pending' } }),
                                this.prisma.telemetrySnapshot.findFirst({ orderBy: [{ reportedAt: 'desc' }] }),
                                this.prisma.sosRequest.count({ where: { status: 'active' } }),
                                this.prisma.studyMaterial.count(),
                            ])];
                        case 1:
                            _a = _b.sent(), paidOrders = _a[0], pendingBookings = _a[1], latestTelemetry = _a[2], activeSos = _a[3], studyMaterials = _a[4];
                            return [2 /*return*/, this.createDomainAnswer('ops', {
                                    answer: "Snapshot v\u1EADn h\u00E0nh hi\u1EC7n t\u1EA1i: ".concat(paidOrders, " \u0111\u01A1n canteen ch\u1EDD x\u1EED l\u00FD, ").concat(pendingBookings, " y\u00EAu c\u1EA7u \u0111\u1EB7t ph\u00F2ng pending, ").concat(activeSos, " SOS active, kho t\u00E0i li\u1EC7u c\u00F3 ").concat(studyMaterials, " m\u1EE5c, telemetry g\u1EA7n nh\u1EA5t fire=").concat((latestTelemetry === null || latestTelemetry === void 0 ? void 0 : latestTelemetry.fireDetected) ? 'có' : 'không', "."),
                                    citations: [
                                        (0, chatbot_utils_1.buildDerivedCitation)('Operations snapshot', 'ops-snapshot', '/services/admin-tools'),
                                    ],
                                    actions: [this.registry.buildDomainAction('ops')],
                                    suggestedQuestions: this.getSuggestedQuestions('ops', context.role),
                                    confidence: 0.94,
                                    intent: 'ops_snapshot',
                                    answerType: 'live',
                                })];
                    }
                });
            });
        };
        ChatbotLiveDomainHandlersService_1.prototype.buildOpsSummary = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var answer;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(0, chatbot_utils_1.isOperatorRole)(context.role) || (context.scope !== 'ops' && context.scope !== 'work')) {
                                return [2 /*return*/, null];
                            }
                            return [4 /*yield*/, this.answerOps({
                                    userId: context.userId,
                                    role: context.role,
                                    message: 'snapshot van hanh',
                                    normalizedMessage: 'snapshot van hanh',
                                    tokens: ['ops', 'queue', 'telemetry', 'fire'],
                                    now: context.now,
                                })];
                        case 1:
                            answer = _a.sent();
                            return [2 /*return*/, this.createDomainAnswer('ops', {
                                    answer: answer.answer,
                                    citations: answer.citations,
                                    actions: answer.actions,
                                    suggestedQuestions: answer.suggestedQuestions,
                                    confidence: answer.confidence,
                                    intent: answer.intent,
                                    answerType: 'summary',
                                })];
                    }
                });
            });
        };
        return ChatbotLiveDomainHandlersService_1;
    }());
    __setFunctionName(_classThis, "ChatbotLiveDomainHandlersService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ChatbotLiveDomainHandlersService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ChatbotLiveDomainHandlersService = _classThis;
}();
exports.ChatbotLiveDomainHandlersService = ChatbotLiveDomainHandlersService;
