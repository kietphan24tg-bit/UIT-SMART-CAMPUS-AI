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
exports.UitEventsScraper = exports.UIT_ORIGIN = void 0;
var common_1 = require("@nestjs/common");
var axios_1 = require("axios");
var cheerio = require("cheerio");
exports.UIT_ORIGIN = 'https://www.uit.edu.vn';
var UIT_STUDENT_ACTIVITIES_PATH = '/hoat-dong-sinh-vien';
function resolveUrl(origin, href) {
    try {
        return new URL(href, origin).toString();
    }
    catch (_a) {
        return href;
    }
}
function normalizeText(value) {
    return value.replace(/\s+/g, ' ').replace(/&nbsp;/g, ' ').trim();
}
function parseListPage(html, origin) {
    var $ = cheerio.load(html);
    var results = [];
    var seen = new Set();
    $('h3 a[href^="/bai-viet/"]').each(function (_, element) {
        var _a, _b;
        var link = $(element);
        var href = link.attr('href');
        if (!href) {
            return;
        }
        var slug = (_a = href.match(/^\/bai-viet\/([^/?#]+)/)) === null || _a === void 0 ? void 0 : _a[1];
        if (!slug || seen.has(slug)) {
            return;
        }
        var cardBody = link.closest('div.p-6');
        var card = cardBody.parent();
        var excerpt = normalizeText(cardBody.find('div.line-clamp-5').first().text());
        var dateLabel = normalizeText(cardBody.find('div.flex.justify-between span.text-xs').first().text());
        if (!excerpt || !dateLabel) {
            return;
        }
        var thumbnailSrc = (_b = card.find('img').first().attr('src')) !== null && _b !== void 0 ? _b : '';
        seen.add(slug);
        results.push({
            slug: slug,
            title: normalizeText(link.text()) || slug,
            sourceUrl: resolveUrl(origin, href),
            dateLabel: dateLabel,
            excerpt: excerpt,
            thumbnailUrl: thumbnailSrc ? resolveUrl(origin, thumbnailSrc) : '',
        });
    });
    return results;
}
var UitEventsScraper = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var UitEventsScraper = _classThis = /** @class */ (function () {
        function UitEventsScraper_1(configService) {
            this.configService = configService;
            var timeout = this.configService.get('UIT_EVENTS_REQUEST_TIMEOUT_MS', 20000);
            this.client = axios_1.default.create({
                baseURL: exports.UIT_ORIGIN,
                timeout: timeout,
                headers: {
                    Accept: 'text/html,application/xhtml+xml',
                    'User-Agent': 'SmartCampus/1.0 (educational; contact: campus-api)',
                },
                validateStatus: function (status) { return status >= 200 && status < 400; },
            });
        }
        UitEventsScraper_1.prototype.getMaxPages = function () {
            return this.configService.get('UIT_EVENTS_MAX_PAGES', 10);
        };
        UitEventsScraper_1.prototype.fetchListPage = function (page) {
            return __awaiter(this, void 0, void 0, function () {
                var safePage, path, response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            safePage = Math.max(1, Math.trunc(page));
                            path = safePage === 1
                                ? UIT_STUDENT_ACTIVITIES_PATH
                                : "".concat(UIT_STUDENT_ACTIVITIES_PATH, "?page=").concat(safePage);
                            return [4 /*yield*/, this.client.get(path, { responseType: 'text' })];
                        case 1:
                            response = _a.sent();
                            if (response.status !== 200 || typeof response.data !== 'string') {
                                return [2 /*return*/, []];
                            }
                            return [2 /*return*/, parseListPage(response.data, exports.UIT_ORIGIN)];
                    }
                });
            });
        };
        UitEventsScraper_1.prototype.mergeListItems = function () {
            var collections = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                collections[_i] = arguments[_i];
            }
            var merged = [];
            var seen = new Set();
            for (var _a = 0, collections_1 = collections; _a < collections_1.length; _a++) {
                var collection = collections_1[_a];
                for (var _b = 0, collection_1 = collection; _b < collection_1.length; _b++) {
                    var item = collection_1[_b];
                    if (seen.has(item.slug)) {
                        continue;
                    }
                    seen.add(item.slug);
                    merged.push(item);
                }
            }
            return merged;
        };
        UitEventsScraper_1.prototype.fetchListRange = function (startPage, endPage) {
            return __awaiter(this, void 0, void 0, function () {
                var safeStartPage, safeEndPage, merged, page, pageItems, nextMerged, appendedCount;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            safeStartPage = Math.max(1, Math.trunc(startPage));
                            safeEndPage = Math.max(safeStartPage, Math.trunc(endPage));
                            merged = [];
                            page = safeStartPage;
                            _a.label = 1;
                        case 1:
                            if (!(page <= safeEndPage)) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.fetchListPage(page)];
                        case 2:
                            pageItems = _a.sent();
                            if (pageItems.length === 0) {
                                return [3 /*break*/, 4];
                            }
                            nextMerged = this.mergeListItems(merged, pageItems);
                            appendedCount = nextMerged.length - merged.length;
                            merged.splice.apply(merged, __spreadArray([0, merged.length], nextMerged, false));
                            if (appendedCount === 0) {
                                return [3 /*break*/, 4];
                            }
                            _a.label = 3;
                        case 3:
                            page += 1;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/, merged];
                    }
                });
            });
        };
        UitEventsScraper_1.prototype.fetchAggregatedList = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.fetchListRange(1, this.getMaxPages())];
                });
            });
        };
        UitEventsScraper_1.prototype.fetchArticleDetail = function (slug) {
            return __awaiter(this, void 0, void 0, function () {
                var response, $, content, title, publishedAtLabel, excerpt, rawThumbnailUrl, thumbnailUrl;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.client.get("/bai-viet/".concat(encodeURIComponent(slug)), {
                                responseType: 'text',
                            })];
                        case 1:
                            response = _d.sent();
                            if (response.status !== 200 || typeof response.data !== 'string') {
                                return [2 /*return*/, null];
                            }
                            $ = cheerio.load(response.data);
                            content = $('div.rich-text-content').first();
                            if (!content.length) {
                                return [2 /*return*/, null];
                            }
                            title = normalizeText($('h1').first().text()) || slug;
                            publishedAtLabel = normalizeText($('p.text-sm').first().text()) || normalizeText($('time').first().text());
                            excerpt = normalizeText(content.find('p').first().text()) ||
                                normalizeText((_a = $('meta[name="description"]').attr('content')) !== null && _a !== void 0 ? _a : '');
                            rawThumbnailUrl = normalizeText((_b = $('meta[property="og:image"]').attr('content')) !== null && _b !== void 0 ? _b : '');
                            thumbnailUrl = rawThumbnailUrl ? resolveUrl(exports.UIT_ORIGIN, rawThumbnailUrl) : '';
                            return [2 /*return*/, {
                                    slug: slug,
                                    title: title,
                                    publishedAtLabel: publishedAtLabel,
                                    excerpt: excerpt,
                                    thumbnailUrl: thumbnailUrl,
                                    contentHtml: (_c = content.html()) !== null && _c !== void 0 ? _c : '',
                                    sourceUrl: resolveUrl(exports.UIT_ORIGIN, "/bai-viet/".concat(slug)),
                                }];
                    }
                });
            });
        };
        return UitEventsScraper_1;
    }());
    __setFunctionName(_classThis, "UitEventsScraper");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UitEventsScraper = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UitEventsScraper = _classThis;
}();
exports.UitEventsScraper = UitEventsScraper;
