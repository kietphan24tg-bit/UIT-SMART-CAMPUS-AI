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
var axios_1 = require("axios");
var uit_events_scraper_1 = require("./uit-events.scraper");
jest.mock('axios');
describe('UitEventsScraper', function () {
    var getMock = jest.fn();
    var mockedAxios = axios_1.default;
    beforeEach(function () {
        jest.resetAllMocks();
        getMock.mockReset();
        mockedAxios.create.mockReturnValue({
            get: getMock,
        });
    });
    it('fetches one list page and parses event cards', function () { return __awaiter(void 0, void 0, void 0, function () {
        var scraper, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    getMock.mockResolvedValue({
                        status: 200,
                        data: "\n        <html>\n          <body>\n            <div>\n              <div>\n                <div class=\"p-6\">\n                  <h3><a href=\"/bai-viet/su-kien-1\">Su kien 1</a></h3>\n                  <div class=\"flex justify-between\"><span class=\"text-xs\">26-04-2026</span></div>\n                  <div class=\"line-clamp-5\">Mo ta 1</div>\n                </div>\n                <img src=\"/media/events/1.png\" />\n              </div>\n            </div>\n          </body>\n        </html>\n      ",
                    });
                    scraper = new uit_events_scraper_1.UitEventsScraper({
                        get: jest.fn(function (_, defaultValue) { return defaultValue; }),
                    });
                    return [4 /*yield*/, scraper.fetchListPage(1)];
                case 1:
                    result = _a.sent();
                    expect(getMock).toHaveBeenCalledWith('/hoat-dong-sinh-vien', { responseType: 'text' });
                    expect(result).toEqual([
                        {
                            slug: 'su-kien-1',
                            title: 'Su kien 1',
                            sourceUrl: 'https://www.uit.edu.vn/bai-viet/su-kien-1',
                            dateLabel: '26-04-2026',
                            excerpt: 'Mo ta 1',
                            thumbnailUrl: 'https://www.uit.edu.vn/media/events/1.png',
                        },
                    ]);
                    return [2 /*return*/];
            }
        });
    }); });
    it('merges ranges and de-duplicates by slug', function () { return __awaiter(void 0, void 0, void 0, function () {
        var scraper, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    getMock
                        .mockResolvedValueOnce({
                        status: 200,
                        data: "\n          <div>\n            <div>\n              <div class=\"p-6\">\n                <h3><a href=\"/bai-viet/event-1\">Event 1</a></h3>\n                <div class=\"flex justify-between\"><span class=\"text-xs\">26-04-2026</span></div>\n                <div class=\"line-clamp-5\">Mo ta 1</div>\n              </div>\n            </div>\n          </div>\n        ",
                    })
                        .mockResolvedValueOnce({
                        status: 200,
                        data: "\n          <div>\n            <div class=\"p-6\">\n              <h3><a href=\"/bai-viet/event-1\">Event 1 duplicate</a></h3>\n              <div class=\"flex justify-between\"><span class=\"text-xs\">26-04-2026</span></div>\n              <div class=\"line-clamp-5\">Mo ta 1</div>\n            </div>\n          </div>\n          <div>\n            <div class=\"p-6\">\n              <h3><a href=\"/bai-viet/event-2\">Event 2</a></h3>\n              <div class=\"flex justify-between\"><span class=\"text-xs\">27-04-2026</span></div>\n              <div class=\"line-clamp-5\">Mo ta 2</div>\n            </div>\n          </div>\n        ",
                    });
                    scraper = new uit_events_scraper_1.UitEventsScraper({
                        get: jest.fn(function (key, defaultValue) {
                            return key === 'UIT_EVENTS_MAX_PAGES' ? 10 : defaultValue;
                        }),
                    });
                    return [4 /*yield*/, scraper.fetchListRange(1, 2)];
                case 1:
                    result = _a.sent();
                    expect(result.map(function (item) { return item.slug; })).toEqual(['event-1', 'event-2']);
                    expect(getMock).toHaveBeenNthCalledWith(1, '/hoat-dong-sinh-vien', { responseType: 'text' });
                    expect(getMock).toHaveBeenNthCalledWith(2, '/hoat-dong-sinh-vien?page=2', {
                        responseType: 'text',
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('returns empty thumbnailUrl when og:image is missing', function () { return __awaiter(void 0, void 0, void 0, function () {
        var scraper, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    getMock.mockResolvedValue({
                        status: 200,
                        data: "\n        <html>\n          <body>\n            <h1>Bai viet kiem thu</h1>\n            <p class=\"text-sm\">26-04-2026</p>\n            <div class=\"rich-text-content\"><p>Noi dung tom tat</p></div>\n          </body>\n        </html>\n      ",
                    });
                    scraper = new uit_events_scraper_1.UitEventsScraper({
                        get: jest.fn(function (_, defaultValue) { return defaultValue; }),
                    });
                    return [4 /*yield*/, scraper.fetchArticleDetail('bai-viet-kiem-thu')];
                case 1:
                    result = _a.sent();
                    expect(result === null || result === void 0 ? void 0 : result.thumbnailUrl).toBe('');
                    return [2 /*return*/];
            }
        });
    }); });
    it('resolves thumbnailUrl when og:image is present', function () { return __awaiter(void 0, void 0, void 0, function () {
        var scraper, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    getMock.mockResolvedValue({
                        status: 200,
                        data: "\n        <html>\n          <head>\n            <meta property=\"og:image\" content=\"/media/events/thumb.png\" />\n          </head>\n          <body>\n            <h1>Bai viet kiem thu</h1>\n            <p class=\"text-sm\">26-04-2026</p>\n            <div class=\"rich-text-content\"><p>Noi dung tom tat</p></div>\n          </body>\n        </html>\n      ",
                    });
                    scraper = new uit_events_scraper_1.UitEventsScraper({
                        get: jest.fn(function (_, defaultValue) { return defaultValue; }),
                    });
                    return [4 /*yield*/, scraper.fetchArticleDetail('bai-viet-kiem-thu')];
                case 1:
                    result = _a.sent();
                    expect(result === null || result === void 0 ? void 0 : result.thumbnailUrl).toBe('https://www.uit.edu.vn/media/events/thumb.png');
                    return [2 /*return*/];
            }
        });
    }); });
});
