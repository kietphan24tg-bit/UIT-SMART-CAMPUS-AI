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
exports.EventsService = void 0;
var common_1 = require("@nestjs/common");
var SLUG_PATTERN = /^[a-z0-9_-]+$/i;
var DEFAULT_LIMIT = 20;
var MAX_LIMIT = 100;
var EventsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var EventsService = _classThis = /** @class */ (function () {
        function EventsService_1(configService, uitEventsScraper) {
            this.configService = configService;
            this.uitEventsScraper = uitEventsScraper;
            this.detailCache = new Map();
            this.listCache = null;
            this.listRefreshPromise = null;
        }
        EventsService_1.prototype.listEvents = function (_userId, pageInput, limitInput) {
            return __awaiter(this, void 0, void 0, function () {
                var page, limit, items, total, totalPages, safePage, startIndex;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            page = Math.max(1, pageInput !== null && pageInput !== void 0 ? pageInput : 1);
                            limit = Math.min(Math.max(1, limitInput !== null && limitInput !== void 0 ? limitInput : DEFAULT_LIMIT), MAX_LIMIT);
                            return [4 /*yield*/, this.getCachedList()];
                        case 1:
                            items = _a.sent();
                            total = items.length;
                            totalPages = Math.max(1, Math.ceil(total / limit));
                            safePage = Math.min(page, totalPages);
                            startIndex = (safePage - 1) * limit;
                            return [2 /*return*/, {
                                    items: items.slice(startIndex, startIndex + limit).map(function (item) { return ({
                                        slug: item.slug,
                                        title: item.title,
                                        sourceUrl: item.sourceUrl,
                                        dateLabel: item.dateLabel,
                                        excerpt: item.excerpt,
                                        thumbnailUrl: item.thumbnailUrl,
                                    }); }),
                                    total: total,
                                    page: safePage,
                                    limit: limit,
                                    totalPages: totalPages,
                                }];
                    }
                });
            });
        };
        EventsService_1.prototype.getArticleBySlug = function (_userId, slug) {
            return __awaiter(this, void 0, void 0, function () {
                var listItems, listItem, detail;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!SLUG_PATTERN.test(slug)) {
                                throw new common_1.BadRequestException('Slug không hợp lệ.');
                            }
                            return [4 /*yield*/, this.getCachedList()];
                        case 1:
                            listItems = _c.sent();
                            listItem = listItems.find(function (item) { return item.slug === slug; });
                            return [4 /*yield*/, this.getCachedDetail(slug)];
                        case 2:
                            detail = _c.sent();
                            if (!detail) {
                                throw new common_1.NotFoundException('Không tìm thấy bài viết từ UIT.');
                            }
                            return [2 /*return*/, {
                                    slug: detail.slug,
                                    title: detail.title,
                                    publishedAtLabel: detail.publishedAtLabel,
                                    excerpt: (_a = listItem === null || listItem === void 0 ? void 0 : listItem.excerpt) !== null && _a !== void 0 ? _a : detail.excerpt,
                                    thumbnailUrl: (listItem === null || listItem === void 0 ? void 0 : listItem.thumbnailUrl) || detail.thumbnailUrl,
                                    contentHtml: detail.contentHtml,
                                    sourceUrl: (_b = listItem === null || listItem === void 0 ? void 0 : listItem.sourceUrl) !== null && _b !== void 0 ? _b : detail.sourceUrl,
                                }];
                    }
                });
            });
        };
        EventsService_1.prototype.getCacheTtlMs = function () {
            return this.configService.get('UIT_EVENTS_CACHE_TTL_MS', 3600000);
        };
        EventsService_1.prototype.getInitialPages = function () {
            var initialPages = this.configService.get('UIT_EVENTS_INITIAL_PAGES', 2);
            var maxPages = this.uitEventsScraper.getMaxPages();
            return Math.max(1, Math.min(maxPages, Math.trunc(initialPages)));
        };
        EventsService_1.prototype.getCachedList = function () {
            return __awaiter(this, void 0, void 0, function () {
                var now, initialPages, maxPages, items, _a;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            now = Date.now();
                            if (this.listCache && this.listCache.expiresAt > now) {
                                return [2 /*return*/, this.listCache.items];
                            }
                            _c.label = 1;
                        case 1:
                            _c.trys.push([1, 3, , 4]);
                            initialPages = this.getInitialPages();
                            maxPages = this.uitEventsScraper.getMaxPages();
                            return [4 /*yield*/, this.uitEventsScraper.fetchListRange(1, initialPages)];
                        case 2:
                            items = _c.sent();
                            this.listCache = {
                                items: items,
                                expiresAt: Date.now() + this.getCacheTtlMs(),
                                isPartial: initialPages < maxPages,
                                loadedPages: initialPages,
                                lastRefreshStartedAt: null,
                                lastRefreshCompletedAt: null,
                            };
                            this.startBackgroundRefreshIfNeeded();
                            return [2 /*return*/, items];
                        case 3:
                            _a = _c.sent();
                            if ((_b = this.listCache) === null || _b === void 0 ? void 0 : _b.items.length) {
                                return [2 /*return*/, this.listCache.items];
                            }
                            throw new common_1.ServiceUnavailableException('Không thể tải danh sách sự kiện từ UIT.');
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        EventsService_1.prototype.startBackgroundRefreshIfNeeded = function () {
            var _this = this;
            var _a;
            if (!((_a = this.listCache) === null || _a === void 0 ? void 0 : _a.isPartial) || this.listRefreshPromise) {
                return;
            }
            this.listCache = __assign(__assign({}, this.listCache), { lastRefreshStartedAt: Date.now() });
            var refreshPromise = this.refreshRemainingPages();
            this.listRefreshPromise = refreshPromise;
            void refreshPromise.finally(function () {
                if (_this.listRefreshPromise === refreshPromise) {
                    _this.listRefreshPromise = null;
                }
            });
        };
        EventsService_1.prototype.refreshRemainingPages = function () {
            return __awaiter(this, void 0, void 0, function () {
                var snapshot, maxPages, startPage, remainingItems, currentCache, mergedItems, _a;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            snapshot = this.listCache;
                            if (!(snapshot === null || snapshot === void 0 ? void 0 : snapshot.isPartial)) {
                                return [2 /*return*/];
                            }
                            maxPages = this.uitEventsScraper.getMaxPages();
                            startPage = snapshot.loadedPages + 1;
                            if (startPage > maxPages) {
                                this.listCache = __assign(__assign({}, snapshot), { isPartial: false, loadedPages: maxPages, lastRefreshCompletedAt: Date.now() });
                                return [2 /*return*/];
                            }
                            _c.label = 1;
                        case 1:
                            _c.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.uitEventsScraper.fetchListRange(startPage, maxPages)];
                        case 2:
                            remainingItems = _c.sent();
                            currentCache = (_b = this.listCache) !== null && _b !== void 0 ? _b : snapshot;
                            mergedItems = this.uitEventsScraper.mergeListItems(currentCache.items, remainingItems);
                            this.listCache = __assign(__assign({}, currentCache), { items: mergedItems, expiresAt: Date.now() + this.getCacheTtlMs(), isPartial: false, loadedPages: maxPages, lastRefreshCompletedAt: Date.now() });
                            return [3 /*break*/, 4];
                        case 3:
                            _a = _c.sent();
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        EventsService_1.prototype.getCachedDetail = function (slug) {
            return __awaiter(this, void 0, void 0, function () {
                var now, cached, item, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            now = Date.now();
                            cached = this.detailCache.get(slug);
                            if (cached && cached.expiresAt > now) {
                                return [2 /*return*/, cached.item];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.uitEventsScraper.fetchArticleDetail(slug)];
                        case 2:
                            item = _a.sent();
                            if (!item) {
                                throw new common_1.NotFoundException('Không tìm thấy bài viết từ UIT.');
                            }
                            this.detailCache.set(slug, {
                                item: item,
                                expiresAt: now + this.getCacheTtlMs(),
                            });
                            return [2 /*return*/, item];
                        case 3:
                            error_1 = _a.sent();
                            if (error_1 instanceof common_1.NotFoundException) {
                                throw error_1;
                            }
                            if (cached === null || cached === void 0 ? void 0 : cached.item) {
                                return [2 /*return*/, cached.item];
                            }
                            throw new common_1.ServiceUnavailableException('Không thể tải chi tiết bài viết từ UIT.');
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        return EventsService_1;
    }());
    __setFunctionName(_classThis, "EventsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        EventsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return EventsService = _classThis;
}();
exports.EventsService = EventsService;
