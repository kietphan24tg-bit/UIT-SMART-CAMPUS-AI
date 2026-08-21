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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotKnowledgeService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var chatbot_utils_1 = require("./chatbot.utils");
var MAX_KB_MATCHES = 4;
function toInputJson(value) {
    return value;
}
var ChatbotKnowledgeService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ChatbotKnowledgeService = _classThis = /** @class */ (function () {
        function ChatbotKnowledgeService_1(prisma, registry, aiRag) {
            this.prisma = prisma;
            this.registry = registry;
            this.aiRag = aiRag;
            this.logger = new common_1.Logger(ChatbotKnowledgeService.name);
        }
        ChatbotKnowledgeService_1.prototype.upsertKnowledgeDocument = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var contentText, lines, chunks;
                var _this = this;
                return __generator(this, function (_a) {
                    contentText = dto.contentText.trim();
                    lines = contentText
                        .split(/\n+/)
                        .map(function (line) { return line.trim(); })
                        .filter(Boolean);
                    chunks = lines.length ? lines : [contentText];
                    return [2 /*return*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var document, _i, _a, _b, index, chunkText;
                            var _c, _d, _e, _f;
                            return __generator(this, function (_g) {
                                switch (_g.label) {
                                    case 0: return [4 /*yield*/, tx.knowledgeDocument.upsert({
                                            where: { slug: dto.slug.trim() },
                                            update: {
                                                title: dto.title.trim(),
                                                source: (_c = dto.source) !== null && _c !== void 0 ? _c : 'manual',
                                                sourceUrl: ((_d = dto.sourceUrl) === null || _d === void 0 ? void 0 : _d.trim()) || null,
                                                contentText: contentText,
                                                isActive: true,
                                            },
                                            create: {
                                                slug: dto.slug.trim(),
                                                title: dto.title.trim(),
                                                source: (_e = dto.source) !== null && _e !== void 0 ? _e : 'manual',
                                                sourceUrl: ((_f = dto.sourceUrl) === null || _f === void 0 ? void 0 : _f.trim()) || null,
                                                contentText: contentText,
                                                isActive: true,
                                            },
                                        })];
                                    case 1:
                                        document = _g.sent();
                                        return [4 /*yield*/, tx.knowledgeChunk.deleteMany({
                                                where: { documentId: document.id },
                                            })];
                                    case 2:
                                        _g.sent();
                                        _i = 0, _a = chunks.entries();
                                        _g.label = 3;
                                    case 3:
                                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                                        _b = _a[_i], index = _b[0], chunkText = _b[1];
                                        return [4 /*yield*/, tx.knowledgeChunk.create({
                                                data: {
                                                    documentId: document.id,
                                                    chunkIndex: index,
                                                    contentText: chunkText,
                                                    keywordTokens: (0, chatbot_utils_1.tokenize)(chunkText),
                                                },
                                            })];
                                    case 4:
                                        _g.sent();
                                        _g.label = 5;
                                    case 5:
                                        _i++;
                                        return [3 /*break*/, 3];
                                    case 6: return [2 /*return*/, document];
                                }
                            });
                        }); })];
                });
            });
        };
        ChatbotKnowledgeService_1.prototype.syncBuiltInKnowledgeDocuments = function () {
            return __awaiter(this, void 0, void 0, function () {
                var domains, uniqueDomains, synced, _i, uniqueDomains_1, domain, contentText, document_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            domains = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], this.registry.getVisibleDomains(client_1.Role.student), true), this.registry.getVisibleDomains(client_1.Role.lecturer), true), this.registry.getVisibleDomains(client_1.Role.admin), true), this.registry.getVisibleDomains(client_1.Role.canteen_admin), true), this.registry.getVisibleDomains(client_1.Role.super_admin), true);
                            uniqueDomains = Array.from(new Map(domains.map(function (item) { return [item.id, item]; })).values());
                            synced = [];
                            _i = 0, uniqueDomains_1 = uniqueDomains;
                            _a.label = 1;
                        case 1:
                            if (!(_i < uniqueDomains_1.length)) return [3 /*break*/, 4];
                            domain = uniqueDomains_1[_i];
                            contentText = [
                                "".concat(domain.label, ": ").concat(domain.description),
                                "L\u1ED1i v\u00E0o ch\u00EDnh: ".concat(domain.actionLabel, " t\u1EA1i ").concat(domain.route, "."),
                                "T\u1EEB kh\u00F3a ch\u00EDnh: ".concat(domain.keywords.join(', '), "."),
                                "C\u00E2u h\u1ECFi m\u1EABu: ".concat(domain.phrases.slice(0, 3).join('; '), "."),
                            ].join('\n');
                            return [4 /*yield*/, this.upsertKnowledgeDocument({
                                    slug: domain.knowledgeSlug,
                                    title: domain.label,
                                    source: 'service',
                                    sourceUrl: domain.route,
                                    contentText: contentText,
                                })];
                        case 2:
                            document_1 = _a.sent();
                            synced.push(document_1.slug);
                            _a.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/, {
                                syncedCount: synced.length,
                                slugs: synced,
                            }];
                    }
                });
            });
        };
        ChatbotKnowledgeService_1.prototype.answerByKnowledgeBase = function (context, preferredDomainId) {
            return __awaiter(this, void 0, void 0, function () {
                var ragResponse, err_1, msg, preferred, initialChunks, chunks, _a, ranked, fallbackDomain;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.aiRag.query(context.message)];
                        case 1:
                            ragResponse = _b.sent();
                            if (this.aiRag.isUsableAnswer(ragResponse) && ragResponse) {
                                this.logger.debug("RAG answered: confidence=".concat(ragResponse.confidence));
                                return [2 /*return*/, (0, chatbot_utils_1.finalizeAnswer)({
                                        answer: ragResponse.answer,
                                        citations: ragResponse.citations.map(function (c, i) { return ({
                                            type: 'kb',
                                            label: c.heading_path || c.source_file,
                                            sourceId: "rag-".concat(i),
                                            slug: c.source_file,
                                            sourceUrl: null,
                                        }); }),
                                        actions: preferredDomainId ? [this.registry.buildDomainAction(preferredDomainId)] : [],
                                        suggestedQuestions: [
                                            'Cho tôi biết thêm chi tiết',
                                            'Quy định này áp dụng từ khi nào?',
                                            'Có ngoại lệ nào không?',
                                        ],
                                        confidence: ragResponse.confidence,
                                        intent: 'rag_retrieval',
                                        domain: preferredDomainId !== null && preferredDomainId !== void 0 ? preferredDomainId : 'general',
                                        answerType: 'knowledge',
                                    })];
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            err_1 = _b.sent();
                            msg = err_1 instanceof Error ? err_1.message : String(err_1);
                            this.logger.warn("RAG query failed, falling back to KB: ".concat(msg));
                            return [3 /*break*/, 3];
                        case 3:
                            // ── Fallback: keyword KB ────────────────────────────────────────────────
                            if (!context.tokens.length) {
                                return [2 /*return*/, (0, chatbot_utils_1.finalizeAnswer)({
                                        answer: 'Mình chưa hiểu rõ câu hỏi. Bạn có thể hỏi cụ thể hơn về lịch học, điểm, tài liệu, thư viện, canteen hoặc các dịch vụ đang có trong app.',
                                        citations: [],
                                        actions: [this.registry.buildDomainAction('campus-map', '/services')],
                                        suggestedQuestions: [
                                            'Hôm nay của tôi',
                                            'Lịch học hôm nay',
                                            'Tài liệu mới',
                                            'Đơn canteen gần nhất',
                                        ],
                                        confidence: 0.25,
                                        intent: 'unknown',
                                        domain: preferredDomainId !== null && preferredDomainId !== void 0 ? preferredDomainId : 'general',
                                        answerType: 'fallback',
                                    })];
                            }
                            preferred = preferredDomainId ? this.registry.getDomain(preferredDomainId) : null;
                            return [4 /*yield*/, this.prisma.knowledgeChunk.findMany({
                                    where: {
                                        keywordTokens: { hasSome: context.tokens },
                                        document: __assign({ isActive: true }, (preferred ? { slug: preferred.knowledgeSlug } : {})),
                                    },
                                    include: {
                                        document: {
                                            select: { id: true, title: true, slug: true, sourceUrl: true },
                                        },
                                    },
                                    take: 30,
                                })];
                        case 4:
                            initialChunks = _b.sent();
                            if (!(preferred && initialChunks.length === 0)) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.prisma.knowledgeChunk.findMany({
                                    where: {
                                        keywordTokens: { hasSome: context.tokens },
                                        document: { isActive: true },
                                    },
                                    include: {
                                        document: {
                                            select: { id: true, title: true, slug: true, sourceUrl: true },
                                        },
                                    },
                                    take: 30,
                                })];
                        case 5:
                            _a = _b.sent();
                            return [3 /*break*/, 7];
                        case 6:
                            _a = initialChunks;
                            _b.label = 7;
                        case 7:
                            chunks = _a;
                            ranked = chunks
                                .map(function (chunk) {
                                var hitCount = context.tokens.filter(function (token) { return chunk.keywordTokens.includes(token); }).length;
                                return { chunk: chunk, score: hitCount / context.tokens.length };
                            })
                                .sort(function (a, b) { return b.score - a.score; })
                                .slice(0, MAX_KB_MATCHES);
                            if (!ranked.length || ranked[0].score < 0.2) {
                                fallbackDomain = preferredDomainId !== null && preferredDomainId !== void 0 ? preferredDomainId : 'campus-map';
                                return [2 /*return*/, (0, chatbot_utils_1.finalizeAnswer)({
                                        answer: 'Mình chưa đủ chắc chắn để trả lời chính xác. Bạn có thể mở đúng dịch vụ liên quan hoặc hỏi lại bằng từ khóa cụ thể hơn.',
                                        citations: [],
                                        actions: [this.registry.buildDomainAction(fallbackDomain)],
                                        suggestedQuestions: [
                                            'Hôm nay của tôi',
                                            'Lịch học hôm nay',
                                            'Điểm hiện tại của tôi',
                                            'Tài liệu mới',
                                        ],
                                        confidence: 0.2,
                                        intent: 'kb_low_confidence',
                                        domain: fallbackDomain,
                                        answerType: 'fallback',
                                    })];
                            }
                            return [2 /*return*/, (0, chatbot_utils_1.finalizeAnswer)({
                                    answer: ranked.map(function (item, index) { return "".concat(index + 1, ". ").concat(item.chunk.contentText); }).join('\n'),
                                    citations: ranked.map(function (item) {
                                        var _a;
                                        return ({
                                            type: 'kb',
                                            label: item.chunk.document.title,
                                            sourceId: item.chunk.document.id,
                                            slug: item.chunk.document.slug,
                                            route: (_a = item.chunk.document.sourceUrl) !== null && _a !== void 0 ? _a : undefined,
                                            sourceUrl: item.chunk.document.sourceUrl,
                                        });
                                    }),
                                    actions: preferredDomainId ? [this.registry.buildDomainAction(preferredDomainId)] : [],
                                    suggestedQuestions: [
                                        'Mình nên mở dịch vụ nào?',
                                        'Có hướng dẫn chi tiết hơn không?',
                                        'Tóm tắt hôm nay của tôi',
                                    ],
                                    confidence: Math.max.apply(Math, ranked.map(function (item) { return item.score; })),
                                    intent: 'kb_retrieval',
                                    domain: preferredDomainId !== null && preferredDomainId !== void 0 ? preferredDomainId : 'general',
                                    answerType: 'knowledge',
                                })];
                    }
                });
            });
        };
        ChatbotKnowledgeService_1.prototype.toInputJsonValue = function (value) {
            return toInputJson(value);
        };
        return ChatbotKnowledgeService_1;
    }());
    __setFunctionName(_classThis, "ChatbotKnowledgeService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ChatbotKnowledgeService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ChatbotKnowledgeService = _classThis;
}();
exports.ChatbotKnowledgeService = ChatbotKnowledgeService;
