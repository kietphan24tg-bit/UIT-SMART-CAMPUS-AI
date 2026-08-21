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
var config_1 = require("@nestjs/config");
var testing_1 = require("@nestjs/testing");
var events_service_1 = require("./events.service");
var uit_events_scraper_1 = require("./uit-events.scraper");
function createListItem(slug) {
    return {
        slug: slug,
        title: slug,
        sourceUrl: "https://www.uit.edu.vn/bai-viet/".concat(slug),
        dateLabel: '20-04-2026',
        excerpt: "excerpt-".concat(slug),
        thumbnailUrl: "https://www.uit.edu.vn/media/".concat(slug, ".jpg"),
    };
}
function createDeferred() {
    var resolve;
    var reject;
    var promise = new Promise(function (res, rej) {
        resolve = res;
        reject = rej;
    });
    return { promise: promise, resolve: resolve, reject: reject };
}
describe('EventsService', function () {
    var service;
    var configValues = {
        UIT_EVENTS_CACHE_TTL_MS: 3600000,
        UIT_EVENTS_INITIAL_PAGES: 2,
        UIT_EVENTS_MAX_PAGES: 4,
    };
    var configService = {
        get: jest.fn(function (key, defaultValue) {
            return key in configValues ? configValues[key] : defaultValue;
        }),
    };
    var scraper = {
        fetchAggregatedList: jest.fn(),
        fetchListRange: jest.fn(),
        mergeListItems: jest.fn(function () {
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
        }),
        getMaxPages: jest.fn(function () { return configValues.UIT_EVENTS_MAX_PAGES; }),
        fetchArticleDetail: jest.fn(),
    };
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var moduleRef;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.clearAllMocks();
                    return [4 /*yield*/, testing_1.Test.createTestingModule({
                            providers: [
                                events_service_1.EventsService,
                                {
                                    provide: config_1.ConfigService,
                                    useValue: configService,
                                },
                                {
                                    provide: uit_events_scraper_1.UitEventsScraper,
                                    useValue: scraper,
                                },
                            ],
                        }).compile()];
                case 1:
                    moduleRef = _a.sent();
                    service = moduleRef.get(events_service_1.EventsService);
                    return [2 /*return*/];
            }
        });
    }); });
    it('returns paginated items from a fast partial snapshot and starts background refresh', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    scraper.fetchListRange
                        .mockResolvedValueOnce([createListItem('event-1'), createListItem('event-2')])
                        .mockResolvedValueOnce([createListItem('event-3'), createListItem('event-4')]);
                    return [4 /*yield*/, service.listEvents('student-1', 1, 10)];
                case 1:
                    result = _a.sent();
                    return [4 /*yield*/, service.listRefreshPromise];
                case 2:
                    _a.sent();
                    expect(result.total).toBe(2);
                    expect(result.totalPages).toBe(1);
                    expect(result.items.map(function (item) { return item.slug; })).toEqual(['event-1', 'event-2']);
                    expect(scraper.fetchListRange).toHaveBeenNthCalledWith(1, 1, 2);
                    expect(scraper.fetchListRange).toHaveBeenNthCalledWith(2, 3, 4);
                    return [2 /*return*/];
            }
        });
    }); });
    it('rejects invalid slug format', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, expect(service.getArticleBySlug('student-1', 'bad slug')).rejects.toBeInstanceOf(common_1.BadRequestException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('returns event detail by slug using UIT scraper', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    scraper.fetchListRange.mockResolvedValue([createListItem('smart-campus-workshop')]);
                    scraper.fetchArticleDetail.mockResolvedValue({
                        slug: 'smart-campus-workshop',
                        title: 'Smart Campus Workshop',
                        publishedAtLabel: '20-04-2026',
                        excerpt: 'Workshop detail',
                        thumbnailUrl: 'https://www.uit.edu.vn/media/workshop-detail.jpg',
                        contentHtml: '<p>Agenda</p>',
                        sourceUrl: 'https://www.uit.edu.vn/bai-viet/smart-campus-workshop',
                    });
                    return [4 /*yield*/, service.getArticleBySlug('student-1', 'smart-campus-workshop')];
                case 1:
                    result = _a.sent();
                    expect(result).toMatchObject({
                        slug: 'smart-campus-workshop',
                        excerpt: 'excerpt-smart-campus-workshop',
                        thumbnailUrl: 'https://www.uit.edu.vn/media/smart-campus-workshop.jpg',
                        sourceUrl: 'https://www.uit.edu.vn/bai-viet/smart-campus-workshop',
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('throws not found when UIT detail is missing', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    scraper.fetchListRange.mockResolvedValue([]);
                    scraper.fetchArticleDetail.mockResolvedValue(null);
                    return [4 /*yield*/, expect(service.getArticleBySlug('student-1', 'missing-event')).rejects.toBeInstanceOf(common_1.NotFoundException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('reuses the in-memory list cache while it is still fresh', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    scraper.fetchListRange
                        .mockResolvedValueOnce([createListItem('event-1')])
                        .mockResolvedValueOnce([]);
                    return [4 /*yield*/, service.listEvents('student-1', 1, 10)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, service.listEvents('student-1', 1, 10)];
                case 2:
                    result = _a.sent();
                    expect(result.items).toHaveLength(1);
                    expect(scraper.fetchListRange).toHaveBeenCalledTimes(2);
                    return [2 /*return*/];
            }
        });
    }); });
    it('reuses the in-memory detail cache while it is still fresh', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    scraper.fetchListRange.mockResolvedValue([createListItem('smart-campus-workshop')]);
                    scraper.fetchArticleDetail.mockResolvedValueOnce({
                        slug: 'smart-campus-workshop',
                        title: 'Smart Campus Workshop',
                        publishedAtLabel: '20-04-2026',
                        excerpt: 'Workshop detail',
                        thumbnailUrl: 'https://www.uit.edu.vn/media/workshop-detail.jpg',
                        contentHtml: '<p>Agenda</p>',
                        sourceUrl: 'https://www.uit.edu.vn/bai-viet/smart-campus-workshop',
                    });
                    return [4 /*yield*/, service.getArticleBySlug('student-1', 'smart-campus-workshop')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, service.getArticleBySlug('student-1', 'smart-campus-workshop')];
                case 2:
                    result = _a.sent();
                    expect(result.slug).toBe('smart-campus-workshop');
                    expect(scraper.fetchArticleDetail).toHaveBeenCalledTimes(1);
                    return [2 /*return*/];
            }
        });
    }); });
    it('throws service unavailable when partial scrape has no cache fallback', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    scraper.fetchListRange.mockRejectedValue(new Error('Network error'));
                    return [4 /*yield*/, expect(service.listEvents('student-1', 1, 10)).rejects.toBeInstanceOf(common_1.ServiceUnavailableException)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('falls back to stale cache when a refresh-time partial scrape fails', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    jest.useFakeTimers();
                    jest.setSystemTime(new Date('2026-05-05T00:00:00.000Z'));
                    scraper.fetchListRange
                        .mockResolvedValueOnce([createListItem('event-1')])
                        .mockResolvedValueOnce([])
                        .mockRejectedValueOnce(new Error('refresh failed'));
                    return [4 /*yield*/, service.listEvents('student-1', 1, 10)];
                case 1:
                    _b.sent();
                    jest.advanceTimersByTime(((_a = configValues.UIT_EVENTS_CACHE_TTL_MS) !== null && _a !== void 0 ? _a : 3600000) + 1);
                    return [4 /*yield*/, service.listEvents('student-1', 1, 10)];
                case 2:
                    result = _b.sent();
                    expect(result.items.map(function (item) { return item.slug; })).toEqual(['event-1']);
                    expect(scraper.fetchListRange).toHaveBeenCalledTimes(3);
                    jest.useRealTimers();
                    return [2 /*return*/];
            }
        });
    }); });
    it('keeps serving partial cache when background refresh fails', function () { return __awaiter(void 0, void 0, void 0, function () {
        var firstResult, secondResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    scraper.fetchListRange
                        .mockResolvedValueOnce([createListItem('event-1'), createListItem('event-2')])
                        .mockRejectedValueOnce(new Error('background failed'));
                    return [4 /*yield*/, service.listEvents('student-1', 1, 10)];
                case 1:
                    firstResult = _a.sent();
                    return [4 /*yield*/, service.listRefreshPromise];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, service.listEvents('student-1', 1, 10)];
                case 3:
                    secondResult = _a.sent();
                    expect(firstResult.items.map(function (item) { return item.slug; })).toEqual(['event-1', 'event-2']);
                    expect(secondResult.items.map(function (item) { return item.slug; })).toEqual(['event-1', 'event-2']);
                    return [2 /*return*/];
            }
        });
    }); });
    it('merges background pages into cache after refresh completes', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    scraper.fetchListRange
                        .mockResolvedValueOnce([createListItem('event-1'), createListItem('event-2')])
                        .mockResolvedValueOnce([createListItem('event-2'), createListItem('event-3')]);
                    return [4 /*yield*/, service.listEvents('student-1', 1, 10)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, service.listRefreshPromise];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, service.listEvents('student-1', 1, 10)];
                case 3:
                    result = _a.sent();
                    expect(result.items.map(function (item) { return item.slug; })).toEqual(['event-1', 'event-2', 'event-3']);
                    expect(result.total).toBe(3);
                    return [2 /*return*/];
            }
        });
    }); });
    it('starts only one background refresh while a previous refresh is still running', function () { return __awaiter(void 0, void 0, void 0, function () {
        var backgroundRefresh, secondResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    backgroundRefresh = createDeferred();
                    scraper.fetchListRange
                        .mockResolvedValueOnce([createListItem('event-1'), createListItem('event-2')])
                        .mockImplementationOnce(function () { return backgroundRefresh.promise; });
                    return [4 /*yield*/, service.listEvents('student-1', 1, 10)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, service.listEvents('student-1', 1, 10)];
                case 2:
                    secondResult = _a.sent();
                    expect(secondResult.items.map(function (item) { return item.slug; })).toEqual(['event-1', 'event-2']);
                    expect(scraper.fetchListRange).toHaveBeenCalledTimes(2);
                    backgroundRefresh.resolve([createListItem('event-3')]);
                    return [4 /*yield*/, service.listRefreshPromise];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
