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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SosService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var SOS_EXPIRES_HOURS = 6;
function toInputJson(value) {
    return value;
}
function toNumber(value) {
    var n = Number(value);
    if (!Number.isFinite(n)) {
        throw new common_1.BadRequestException('Tọa độ không hợp lệ');
    }
    return n;
}
var SosService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var SosService = _classThis = /** @class */ (function () {
        function SosService_1(prisma, configService, sosRealtimeGateway) {
            this.prisma = prisma;
            this.configService = configService;
            this.sosRealtimeGateway = sosRealtimeGateway;
        }
        SosService_1.prototype.createRequest = function (userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var active, user, expiresAt, addressSnapshot, created, peers, mapped;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.expireStaleRequests()];
                        case 1:
                            _c.sent();
                            return [4 /*yield*/, this.prisma.sosRequest.findFirst({
                                    where: {
                                        requesterId: userId,
                                        status: client_1.SosRequestStatus.active,
                                    },
                                    select: { id: true },
                                })];
                        case 2:
                            active = _c.sent();
                            if (active) {
                                throw new common_1.BadRequestException('Bạn đang có một SOS đang mở. Hãy hủy hoặc kết thúc trước khi tạo mới.');
                            }
                            return [4 /*yield*/, this.prisma.user.findUnique({
                                    where: { id: userId },
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        email: true,
                                        phone: true,
                                    },
                                })];
                        case 3:
                            user = _c.sent();
                            if (!user) {
                                throw new common_1.NotFoundException('Không tìm thấy người dùng');
                            }
                            expiresAt = new Date();
                            expiresAt.setHours(expiresAt.getHours() + SOS_EXPIRES_HOURS);
                            return [4 /*yield*/, this.reverseGeocode(dto.lat, dto.lng)];
                        case 4:
                            addressSnapshot = _c.sent();
                            return [4 /*yield*/, this.prisma.sosRequest.create({
                                    data: {
                                        requesterId: userId,
                                        latitude: dto.lat,
                                        longitude: dto.lng,
                                        accuracyMeters: (_a = dto.accuracyMeters) !== null && _a !== void 0 ? _a : null,
                                        addressSnapshot: addressSnapshot,
                                        note: ((_b = dto.note) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                                        expiresAt: expiresAt,
                                        contactSnapshot: toInputJson({
                                            name: "".concat(user.lastName, " ").concat(user.firstName).trim(),
                                            email: user.email,
                                            phone: user.phone,
                                        }),
                                    },
                                })];
                        case 5:
                            created = _c.sent();
                            return [4 /*yield*/, this.prisma.user.findMany({
                                    where: {
                                        isActive: true,
                                        id: { not: userId },
                                    },
                                    select: { id: true },
                                })];
                        case 6:
                            peers = _c.sent();
                            if (!peers.length) return [3 /*break*/, 8];
                            return [4 /*yield*/, this.prisma.notification.createMany({
                                    data: peers.map(function (peer) { return ({
                                        userId: peer.id,
                                        type: 'sos',
                                        title: 'Có yêu cầu SOS mới',
                                        body: 'Một người dùng đang cần hỗ trợ gần vị trí hiện tại của họ.',
                                        data: toInputJson({ sosId: created.id }),
                                    }); }),
                                })];
                        case 7:
                            _c.sent();
                            _c.label = 8;
                        case 8:
                            mapped = this.mapRequest(created);
                            this.publishRealtime('sos:created', mapped);
                            return [2 /*return*/, mapped];
                    }
                });
            });
        };
        SosService_1.prototype.listActiveRequests = function () {
            return __awaiter(this, void 0, void 0, function () {
                var items;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.expireStaleRequests()];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.sosRequest.findMany({
                                    where: { status: client_1.SosRequestStatus.active },
                                    include: {
                                        requester: {
                                            select: {
                                                id: true,
                                                firstName: true,
                                                lastName: true,
                                                email: true,
                                                phone: true,
                                            },
                                        },
                                    },
                                    orderBy: [{ createdAt: 'desc' }],
                                })];
                        case 2:
                            items = _a.sent();
                            return [2 /*return*/, items.map(function (item) { return _this.mapRequest(item); })];
                    }
                });
            });
        };
        SosService_1.prototype.listMyRequests = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var items;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.sosRequest.findMany({
                                where: { requesterId: userId },
                                include: {
                                    requester: {
                                        select: {
                                            id: true,
                                            firstName: true,
                                            lastName: true,
                                            email: true,
                                            phone: true,
                                        },
                                    },
                                },
                                orderBy: [{ createdAt: 'desc' }],
                            })];
                        case 1:
                            items = _a.sent();
                            return [2 /*return*/, items.map(function (item) { return _this.mapRequest(item); })];
                    }
                });
            });
        };
        SosService_1.prototype.cancelRequest = function (userId, requestId) {
            return __awaiter(this, void 0, void 0, function () {
                var request, updated, mapped;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.sosRequest.findUnique({
                                where: { id: requestId },
                                select: {
                                    id: true,
                                    requesterId: true,
                                    status: true,
                                },
                            })];
                        case 1:
                            request = _a.sent();
                            if (!request) {
                                throw new common_1.NotFoundException('Không tìm thấy yêu cầu SOS');
                            }
                            if (request.requesterId !== userId) {
                                throw new common_1.ForbiddenException('Bạn không có quyền hủy yêu cầu SOS này');
                            }
                            if (request.status !== client_1.SosRequestStatus.active) {
                                return [2 /*return*/, request];
                            }
                            return [4 /*yield*/, this.prisma.sosRequest.update({
                                    where: { id: request.id },
                                    data: {
                                        status: client_1.SosRequestStatus.cancelled,
                                        resolvedAt: new Date(),
                                    },
                                })];
                        case 2:
                            updated = _a.sent();
                            mapped = this.mapRequest(updated);
                            this.publishRealtime('sos:cancelled', mapped);
                            return [2 /*return*/, mapped];
                    }
                });
            });
        };
        SosService_1.prototype.resolveRequest = function (userId, role, requestId) {
            return __awaiter(this, void 0, void 0, function () {
                var request, canResolve, updated, mapped;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.sosRequest.findUnique({
                                where: { id: requestId },
                                select: {
                                    id: true,
                                    requesterId: true,
                                    status: true,
                                },
                            })];
                        case 1:
                            request = _a.sent();
                            if (!request) {
                                throw new common_1.NotFoundException('Không tìm thấy yêu cầu SOS');
                            }
                            canResolve = request.requesterId === userId ||
                                role === client_1.Role.admin ||
                                role === client_1.Role.super_admin;
                            if (!canResolve) {
                                throw new common_1.ForbiddenException('Bạn không có quyền kết thúc yêu cầu SOS này');
                            }
                            if (request.status !== client_1.SosRequestStatus.active) {
                                return [2 /*return*/, request];
                            }
                            return [4 /*yield*/, this.prisma.sosRequest.update({
                                    where: { id: request.id },
                                    data: {
                                        status: client_1.SosRequestStatus.resolved,
                                        resolverId: userId,
                                        resolvedAt: new Date(),
                                    },
                                })];
                        case 2:
                            updated = _a.sent();
                            mapped = this.mapRequest(updated);
                            this.publishRealtime('sos:resolved', mapped);
                            return [2 /*return*/, mapped];
                    }
                });
            });
        };
        SosService_1.prototype.getRoute = function (requestId, fromLat, fromLng) {
            return __awaiter(this, void 0, void 0, function () {
                var request, apiKey, url, response, payload;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.sosRequest.findUnique({
                                where: { id: requestId },
                                select: {
                                    id: true,
                                    latitude: true,
                                    longitude: true,
                                    status: true,
                                },
                            })];
                        case 1:
                            request = _a.sent();
                            if (!request) {
                                throw new common_1.NotFoundException('Không tìm thấy yêu cầu SOS');
                            }
                            if (request.status !== client_1.SosRequestStatus.active) {
                                throw new common_1.BadRequestException('Yêu cầu SOS này không còn ở trạng thái hoạt động');
                            }
                            apiKey = this.getTrackAsiaApiKey();
                            if (!apiKey) {
                                throw new common_1.BadRequestException('Thiếu TrackAsia API key cho tính năng chỉ đường');
                            }
                            url = "https://maps.track-asia.com/route/v2/directions/json?origin=".concat(toNumber(fromLat), ",").concat(toNumber(fromLng)) +
                                "&destination=".concat(request.latitude, ",").concat(request.longitude) +
                                "&mode=driving&key=".concat(encodeURIComponent(apiKey));
                            return [4 /*yield*/, fetch(url)];
                        case 2:
                            response = _a.sent();
                            return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                        case 3:
                            payload = (_a.sent());
                            if (!response.ok) {
                                throw new common_1.BadRequestException('Không thể lấy lộ trình từ TrackAsia');
                            }
                            return [2 /*return*/, {
                                    sosId: request.id,
                                    route: payload,
                                }];
                    }
                });
            });
        };
        SosService_1.prototype.reverseGeocode = function (lat, lng) {
            return __awaiter(this, void 0, void 0, function () {
                var apiKey, url, response, payload, results, first, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            apiKey = this.getTrackAsiaApiKey();
                            if (!apiKey) {
                                return [2 /*return*/, null];
                            }
                            url = "https://maps.track-asia.com/api/v2/geocode/json?latlng=".concat(lat, ",").concat(lng, "&key=").concat(encodeURIComponent(apiKey));
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 4, , 5]);
                            return [4 /*yield*/, fetch(url)];
                        case 2:
                            response = _b.sent();
                            if (!response.ok) {
                                return [2 /*return*/, null];
                            }
                            return [4 /*yield*/, response.json()];
                        case 3:
                            payload = (_b.sent());
                            results = Array.isArray(payload.results)
                                ? payload.results
                                : [];
                            first = results[0];
                            if (!first) {
                                return [2 /*return*/, null];
                            }
                            return [2 /*return*/, String(first.formatted_address || first.vicinity || first.name || '')];
                        case 4:
                            _a = _b.sent();
                            return [2 /*return*/, null];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        SosService_1.prototype.expireStaleRequests = function () {
            return __awaiter(this, void 0, void 0, function () {
                var expiring, expiredItems;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.sosRequest.findMany({
                                where: {
                                    status: client_1.SosRequestStatus.active,
                                    expiresAt: { lt: new Date() },
                                },
                            })];
                        case 1:
                            expiring = _a.sent();
                            if (!expiring.length) {
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, this.prisma.sosRequest.updateMany({
                                    where: {
                                        status: client_1.SosRequestStatus.active,
                                        expiresAt: { lt: new Date() },
                                    },
                                    data: {
                                        status: client_1.SosRequestStatus.expired,
                                    },
                                })];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.sosRequest.findMany({
                                    where: {
                                        id: { in: expiring.map(function (item) { return item.id; }) },
                                    },
                                })];
                        case 3:
                            expiredItems = _a.sent();
                            expiredItems.forEach(function (item) {
                                _this.publishRealtime('sos:expired', _this.mapRequest(item));
                            });
                            return [2 /*return*/];
                    }
                });
            });
        };
        SosService_1.prototype.getTrackAsiaApiKey = function () {
            var _a, _b;
            return (((_a = this.configService.get('TRACK_ASIA_SERVER_KEY')) === null || _a === void 0 ? void 0 : _a.trim()) ||
                ((_b = this.configService.get('EXPO_PUBLIC_TRACK_ASIA_MAP_KEY')) === null || _b === void 0 ? void 0 : _b.trim()) ||
                '');
        };
        SosService_1.prototype.publishRealtime = function (event, request) {
            this.sosRealtimeGateway.publish(event, {
                sosId: request.id,
                request: request,
            });
        };
        SosService_1.prototype.mapRequest = function (item) {
            var _a, _b, _c;
            return {
                id: item.id,
                requesterId: item.requesterId,
                resolverId: (_a = item.resolverId) !== null && _a !== void 0 ? _a : null,
                status: item.status,
                lat: item.latitude,
                lng: item.longitude,
                accuracyMeters: item.accuracyMeters,
                addressSnapshot: item.addressSnapshot,
                contactSnapshot: item.contactSnapshot,
                note: item.note,
                createdAt: item.createdAt.toISOString(),
                updatedAt: item.updatedAt.toISOString(),
                resolvedAt: (_c = (_b = item.resolvedAt) === null || _b === void 0 ? void 0 : _b.toISOString()) !== null && _c !== void 0 ? _c : null,
                expiresAt: item.expiresAt.toISOString(),
                requester: item.requester
                    ? {
                        id: item.requester.id,
                        fullName: "".concat(item.requester.lastName, " ").concat(item.requester.firstName).trim(),
                        email: item.requester.email,
                        phone: item.requester.phone,
                    }
                    : null,
            };
        };
        return SosService_1;
    }());
    __setFunctionName(_classThis, "SosService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SosService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SosService = _classThis;
}();
exports.SosService = SosService;
