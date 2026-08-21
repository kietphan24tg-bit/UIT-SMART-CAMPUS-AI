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
exports.ExpoPushService = void 0;
var common_1 = require("@nestjs/common");
var axios_1 = require("axios");
var EXPO_PUSH_SEND_URL = 'https://exp.host/--/api/v2/push/send';
var EXPO_PUSH_CHUNK_SIZE = 100;
var DEVICE_NOT_REGISTERED = 'DeviceNotRegistered';
var ExpoPushService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ExpoPushService = _classThis = /** @class */ (function () {
        function ExpoPushService_1(prisma) {
            this.prisma = prisma;
            this.logger = new common_1.Logger(ExpoPushService.name);
        }
        ExpoPushService_1.prototype.sendToUsers = function (payload) {
            return __awaiter(this, void 0, void 0, function () {
                var tokens, messages, stats, _i, _a, chunk, chunkStats;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getActiveTokens(payload.userIds)];
                        case 1:
                            tokens = _b.sent();
                            if (tokens.length === 0) {
                                return [2 /*return*/, this.emptyStats()];
                            }
                            messages = tokens.map(function (token) { return _this.toExpoMessage(token, payload); });
                            stats = {
                                targetTokens: tokens.length,
                                sent: 0,
                                failed: 0,
                                deactivatedTokens: 0,
                            };
                            _i = 0, _a = this.chunk(messages, EXPO_PUSH_CHUNK_SIZE);
                            _b.label = 2;
                        case 2:
                            if (!(_i < _a.length)) return [3 /*break*/, 5];
                            chunk = _a[_i];
                            return [4 /*yield*/, this.sendChunk(chunk)];
                        case 3:
                            chunkStats = _b.sent();
                            stats.sent += chunkStats.sent;
                            stats.failed += chunkStats.failed;
                            stats.deactivatedTokens += chunkStats.deactivatedTokens;
                            _b.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 2];
                        case 5: return [2 /*return*/, stats];
                    }
                });
            });
        };
        ExpoPushService_1.prototype.sendNotifications = function (records) {
            return __awaiter(this, void 0, void 0, function () {
                var notificationsByUserId, tokens, messages, stats, _i, _a, chunk, chunkStats;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            notificationsByUserId = new Map(records.map(function (record) { return [record.userId, record]; }));
                            return [4 /*yield*/, this.getActiveTokenRows(records.map(function (record) { return record.userId; }))];
                        case 1:
                            tokens = _b.sent();
                            if (tokens.length === 0) {
                                return [2 /*return*/, this.emptyStats()];
                            }
                            messages = tokens
                                .map(function (token) {
                                var record = notificationsByUserId.get(token.userId);
                                return record ? _this.toExpoMessageForRecord(token.expoPushToken, record) : null;
                            })
                                .filter(function (message) { return Boolean(message); });
                            stats = {
                                targetTokens: messages.length,
                                sent: 0,
                                failed: 0,
                                deactivatedTokens: 0,
                            };
                            _i = 0, _a = this.chunk(messages, EXPO_PUSH_CHUNK_SIZE);
                            _b.label = 2;
                        case 2:
                            if (!(_i < _a.length)) return [3 /*break*/, 5];
                            chunk = _a[_i];
                            return [4 /*yield*/, this.sendChunk(chunk)];
                        case 3:
                            chunkStats = _b.sent();
                            stats.sent += chunkStats.sent;
                            stats.failed += chunkStats.failed;
                            stats.deactivatedTokens += chunkStats.deactivatedTokens;
                            _b.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 2];
                        case 5: return [2 /*return*/, stats];
                    }
                });
            });
        };
        ExpoPushService_1.prototype.getActiveTokens = function (userIds) {
            return __awaiter(this, void 0, void 0, function () {
                var uniqueUserIds, rows;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            uniqueUserIds = __spreadArray([], new Set(userIds.filter(Boolean)), true);
                            if (uniqueUserIds.length === 0) {
                                return [2 /*return*/, []];
                            }
                            return [4 /*yield*/, this.getActiveTokenRows(uniqueUserIds)];
                        case 1:
                            rows = _a.sent();
                            return [2 /*return*/, __spreadArray([], new Set(rows.map(function (row) { return row.expoPushToken; }).filter(Boolean)), true)];
                    }
                });
            });
        };
        ExpoPushService_1.prototype.getActiveTokenRows = function (userIds) {
            return __awaiter(this, void 0, void 0, function () {
                var uniqueUserIds;
                return __generator(this, function (_a) {
                    uniqueUserIds = __spreadArray([], new Set(userIds.filter(Boolean)), true);
                    if (uniqueUserIds.length === 0) {
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/, this.prisma.userDevicePushToken.findMany({
                            where: {
                                userId: { in: uniqueUserIds },
                                isActive: true,
                            },
                            select: { userId: true, expoPushToken: true },
                        })];
                });
            });
        };
        ExpoPushService_1.prototype.toExpoMessage = function (token, payload) {
            var _a;
            return {
                to: token,
                title: payload.title,
                body: payload.body,
                sound: 'default',
                priority: 'high',
                data: __assign({ type: payload.type }, ((_a = payload.data) !== null && _a !== void 0 ? _a : {})),
            };
        };
        ExpoPushService_1.prototype.toExpoMessageForRecord = function (token, record) {
            var _a;
            return {
                to: token,
                title: record.title,
                body: record.body,
                sound: 'default',
                priority: 'high',
                data: __assign(__assign({}, ((_a = record.data) !== null && _a !== void 0 ? _a : {})), { notificationId: record.id, kind: 'notification', type: record.type }),
            };
        };
        ExpoPushService_1.prototype.sendChunk = function (messages) {
            return __awaiter(this, void 0, void 0, function () {
                var response, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, axios_1.default.post(EXPO_PUSH_SEND_URL, messages, {
                                    headers: {
                                        Accept: 'application/json',
                                        'Accept-Encoding': 'gzip, deflate',
                                        'Content-Type': 'application/json',
                                    },
                                })];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, this.mapTickets(messages, response.data.data)];
                        case 2:
                            error_1 = _a.sent();
                            this.logger.warn("Expo push request failed: ".concat(this.getErrorMessage(error_1)));
                            return [2 /*return*/, {
                                    targetTokens: messages.length,
                                    sent: 0,
                                    failed: messages.length,
                                    deactivatedTokens: 0,
                                }];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        ExpoPushService_1.prototype.mapTickets = function (messages_1) {
            return __awaiter(this, arguments, void 0, function (messages, tickets) {
                var tokensToDeactivate, sent, failed, deactivatedTokens;
                if (tickets === void 0) { tickets = []; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            tokensToDeactivate = [];
                            sent = 0;
                            failed = 0;
                            messages.forEach(function (message, index) {
                                var _a;
                                var ticket = tickets[index];
                                if ((ticket === null || ticket === void 0 ? void 0 : ticket.status) === 'ok') {
                                    sent += 1;
                                    return;
                                }
                                failed += 1;
                                if (((_a = ticket === null || ticket === void 0 ? void 0 : ticket.details) === null || _a === void 0 ? void 0 : _a.error) === DEVICE_NOT_REGISTERED) {
                                    tokensToDeactivate.push(message.to);
                                }
                            });
                            return [4 /*yield*/, this.deactivateTokens(tokensToDeactivate)];
                        case 1:
                            deactivatedTokens = _a.sent();
                            return [2 /*return*/, {
                                    targetTokens: messages.length,
                                    sent: sent,
                                    failed: failed,
                                    deactivatedTokens: deactivatedTokens,
                                }];
                    }
                });
            });
        };
        ExpoPushService_1.prototype.deactivateTokens = function (tokens) {
            return __awaiter(this, void 0, void 0, function () {
                var uniqueTokens, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            uniqueTokens = __spreadArray([], new Set(tokens), true);
                            if (uniqueTokens.length === 0) {
                                return [2 /*return*/, 0];
                            }
                            return [4 /*yield*/, this.prisma.userDevicePushToken.updateMany({
                                    where: { expoPushToken: { in: uniqueTokens } },
                                    data: { isActive: false },
                                })];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, result.count];
                    }
                });
            });
        };
        ExpoPushService_1.prototype.chunk = function (items, size) {
            var chunks = [];
            for (var index = 0; index < items.length; index += size) {
                chunks.push(items.slice(index, index + size));
            }
            return chunks;
        };
        ExpoPushService_1.prototype.emptyStats = function () {
            return {
                targetTokens: 0,
                sent: 0,
                failed: 0,
                deactivatedTokens: 0,
            };
        };
        ExpoPushService_1.prototype.getErrorMessage = function (error) {
            return error instanceof Error ? error.message : 'Unknown error';
        };
        return ExpoPushService_1;
    }());
    __setFunctionName(_classThis, "ExpoPushService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ExpoPushService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ExpoPushService = _classThis;
}();
exports.ExpoPushService = ExpoPushService;
