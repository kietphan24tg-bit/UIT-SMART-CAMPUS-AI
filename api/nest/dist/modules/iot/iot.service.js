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
exports.IotService = void 0;
var common_1 = require("@nestjs/common");
var parking_slot_layout_1 = require("../parking/parking-slot-layout");
var DEFAULT_FIRE_ALERT_MESSAGE = 'Cảm biến lửa đã kích hoạt tại bãi xe UIT Campus.';
var DEFAULT_RAIN_ALERT_TITLE = 'Cảnh báo thời tiết tại bãi xe';
var DEFAULT_RAIN_ALERT_MESSAGE = 'Hệ thống vừa phát hiện mưa tại khu vực bãi xe UIT Campus.';
function normalizePlate(value) {
    return String(value || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
}
function normalizeRfid(value) {
    return String(value || '').trim().toUpperCase();
}
function normalizeGateId(value) {
    var gateId = String(value || '').trim();
    return gateId || undefined;
}
function clampInteger(value, fallback, min, max) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    var normalized = Math.trunc(parsed);
    return Math.min(max, Math.max(min, normalized));
}
var IotService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var IotService = _classThis = /** @class */ (function () {
        function IotService_1(prisma, notificationsService, parkingService, parkingRealtimeGateway) {
            this.prisma = prisma;
            this.notificationsService = notificationsService;
            this.parkingService = parkingService;
            this.parkingRealtimeGateway = parkingRealtimeGateway;
        }
        IotService_1.prototype.processParkingScan = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var rfidTag, recognizedPlate, availableSlots, vehicle, activeSession, completed, subscriptionExpired, session;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            rfidTag = normalizeRfid(dto.rfidTag);
                            recognizedPlate = normalizePlate(dto.recognizedPlate);
                            return [4 /*yield*/, this.countAvailableSlots(dto.gateId)];
                        case 1:
                            availableSlots = _a.sent();
                            if (!recognizedPlate) {
                                return [2 /*return*/, this.createDecision('denied', 'Không nhận diện được biển số hợp lệ.', availableSlots)];
                            }
                            return [4 /*yield*/, this.prisma.vehicle.findUnique({
                                    where: { rfidTag: rfidTag },
                                    include: { subscription: true },
                                })];
                        case 2:
                            vehicle = _a.sent();
                            if (!vehicle || !vehicle.isActive) {
                                return [2 /*return*/, this.createDecision('denied', 'RFID chưa được đăng ký trên app UIT Campus.', availableSlots)];
                            }
                            if (normalizePlate(vehicle.plateNumber) !== recognizedPlate) {
                                return [2 /*return*/, this.createDecision('denied', 'Biển số không khớp với xe đã đăng ký.', availableSlots)];
                            }
                            return [4 /*yield*/, this.prisma.parkingSession.findFirst({
                                    where: {
                                        vehicleId: vehicle.id,
                                        status: 'active',
                                    },
                                    orderBy: { entryTime: 'desc' },
                                })];
                        case 3:
                            activeSession = _a.sent();
                            if (!activeSession) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.prisma.parkingSession.update({
                                    where: { id: activeSession.id },
                                    data: {
                                        status: 'completed',
                                        recognizedExitPlate: recognizedPlate,
                                        exitTime: new Date(dto.capturedAt),
                                    },
                                })];
                        case 4:
                            completed = _a.sent();
                            return [2 /*return*/, {
                                    action: 'exit_allowed',
                                    message: 'Biển số hợp lệ. Mở barrier cho xe ra.',
                                    availableSlots: availableSlots,
                                    sessionId: completed.id,
                                }];
                        case 5:
                            subscriptionExpired = !vehicle.subscription ||
                                vehicle.subscription.status !== 'active' ||
                                !vehicle.subscription.endDate ||
                                vehicle.subscription.endDate < new Date();
                            if (subscriptionExpired) {
                                return [2 /*return*/, this.createDecision('denied', 'Gói gửi xe tháng chưa hợp lệ. Vui lòng thanh toán 40.000 VND/tháng.', availableSlots)];
                            }
                            if (availableSlots <= 0) {
                                return [2 /*return*/, this.createDecision('denied', 'Bãi xe đang hết chỗ trống.', availableSlots)];
                            }
                            return [4 /*yield*/, this.prisma.parkingSession.create({
                                    data: {
                                        vehicleId: vehicle.id,
                                        gateId: dto.gateId,
                                        recognizedEntryPlate: recognizedPlate,
                                        entryTime: new Date(dto.capturedAt),
                                    },
                                })];
                        case 6:
                            session = _a.sent();
                            return [2 /*return*/, {
                                    action: 'entry_allowed',
                                    message: 'Xe hợp lệ. Mở barrier cho xe vào.',
                                    availableSlots: availableSlots,
                                    sessionId: session.id,
                                }];
                    }
                });
            });
        };
        IotService_1.prototype.recordTelemetry = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var previousSnapshot, snapshot;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.telemetrySnapshot.findFirst({
                                where: { gateId: dto.gateId },
                                orderBy: { reportedAt: 'desc' },
                            })];
                        case 1:
                            previousSnapshot = _a.sent();
                            return [4 /*yield*/, this.persistTelemetrySnapshot(dto)];
                        case 2:
                            snapshot = _a.sent();
                            return [4 /*yield*/, this.processTelemetryAlertTransitions(previousSnapshot, snapshot)];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, snapshot];
                    }
                });
            });
        };
        IotService_1.prototype.persistTelemetrySnapshot = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var activeSlotNumbers, slotStates, reportedAt, slotBitmap, snapshot, parkingStatus;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            activeSlotNumbers = (0, parking_slot_layout_1.getActiveParkingSlotNumbers)(dto.gateId);
                            slotStates = this.normalizeSlots(dto.gateId, dto.slotBitmap, dto.slots);
                            reportedAt = dto.reportedAt ? new Date(dto.reportedAt) : new Date();
                            slotBitmap = this.buildSlotBitmap(slotStates);
                            return [4 /*yield*/, this.prisma.telemetrySnapshot.create({
                                    data: {
                                        gateId: dto.gateId,
                                        deviceIp: dto.deviceIp || null,
                                        slotBitmap: slotBitmap,
                                        slots: slotStates,
                                        temperature: this.normalizeNumber(dto.temperature),
                                        humidity: this.normalizeNumber(dto.humidity),
                                        rainDetected: Boolean(dto.rainDetected),
                                        fireDetected: Boolean(dto.fireDetected),
                                        reportedAt: reportedAt,
                                    },
                                })];
                        case 1:
                            snapshot = _a.sent();
                            return [4 /*yield*/, Promise.all(__spreadArray([
                                    this.prisma.parkingSlot.deleteMany({
                                        where: {
                                            gateId: dto.gateId,
                                            slotNumber: { notIn: activeSlotNumbers },
                                        },
                                    })
                                ], slotStates.map(function (slot) {
                                    return _this.prisma.parkingSlot.upsert({
                                        where: {
                                            gateId_slotNumber: {
                                                gateId: dto.gateId,
                                                slotNumber: slot.slotNumber,
                                            },
                                        },
                                        update: {
                                            zone: slot.zone,
                                            isOccupied: slot.isOccupied,
                                            vehiclePlate: slot.vehiclePlate,
                                            lastUpdated: reportedAt,
                                        },
                                        create: {
                                            gateId: dto.gateId,
                                            zone: slot.zone,
                                            slotNumber: slot.slotNumber,
                                            isOccupied: slot.isOccupied,
                                            vehiclePlate: slot.vehiclePlate,
                                            lastUpdated: reportedAt,
                                        },
                                    });
                                }), true))];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.parkingService.getStatus(dto.gateId)];
                        case 3:
                            parkingStatus = _a.sent();
                            this.parkingRealtimeGateway.publishTelemetrySnapshot(dto.gateId, snapshot);
                            this.parkingRealtimeGateway.publishParkingStatus(dto.gateId, parkingStatus);
                            return [2 /*return*/, snapshot];
                    }
                });
            });
        };
        IotService_1.prototype.recordTelemetryFromMqtt = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.recordTelemetry(dto)];
                });
            });
        };
        IotService_1.prototype.getLatestTelemetry = function (gateId) {
            return __awaiter(this, void 0, void 0, function () {
                var resolvedGateId, snapshot;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            resolvedGateId = normalizeGateId(gateId);
                            return [4 /*yield*/, this.prisma.telemetrySnapshot.findFirst({
                                    where: resolvedGateId ? { gateId: resolvedGateId } : undefined,
                                    orderBy: { reportedAt: 'desc' },
                                })];
                        case 1:
                            snapshot = _a.sent();
                            if (!snapshot) {
                                throw new common_1.NotFoundException('Chưa có dữ liệu telemetry');
                            }
                            return [2 /*return*/, snapshot];
                    }
                });
            });
        };
        IotService_1.prototype.createFireAlert = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var reportedAt, gateId, telemetrySnapshot, snapshotInput, fireAlert;
                var _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            reportedAt = new Date(dto.reportedAt);
                            gateId = (_a = normalizeGateId(dto.gateId)) !== null && _a !== void 0 ? _a : dto.gateId;
                            return [4 /*yield*/, this.prisma.telemetrySnapshot.findFirst({
                                    where: {
                                        gateId: gateId,
                                        reportedAt: reportedAt,
                                    },
                                    orderBy: { reportedAt: 'desc' },
                                })];
                        case 1:
                            telemetrySnapshot = _e.sent();
                            if (!(!telemetrySnapshot && dto.telemetrySnapshot)) return [3 /*break*/, 3];
                            snapshotInput = this.coerceTelemetrySnapshot(gateId, dto.reportedAt, dto.telemetrySnapshot);
                            return [4 /*yield*/, this.persistTelemetrySnapshot(snapshotInput)];
                        case 2:
                            telemetrySnapshot = _e.sent();
                            _e.label = 3;
                        case 3: return [4 /*yield*/, this.prisma.fireAlert.create({
                                data: {
                                    gateId: gateId,
                                    telemetrySnapshotId: (_b = telemetrySnapshot === null || telemetrySnapshot === void 0 ? void 0 : telemetrySnapshot.id) !== null && _b !== void 0 ? _b : null,
                                    message: ((_c = dto.message) === null || _c === void 0 ? void 0 : _c.trim()) || DEFAULT_FIRE_ALERT_MESSAGE,
                                    reportedAt: reportedAt,
                                },
                            })];
                        case 4:
                            fireAlert = _e.sent();
                            return [4 /*yield*/, this.notificationsService.createSystemNotifications('Cảnh báo cháy bãi xe', fireAlert.message, 'fire_alert', {
                                    gateId: dto.gateId,
                                    fireAlertId: fireAlert.id,
                                    telemetrySnapshotId: (_d = telemetrySnapshot === null || telemetrySnapshot === void 0 ? void 0 : telemetrySnapshot.id) !== null && _d !== void 0 ? _d : null,
                                }, { scope: 'all' })];
                        case 5:
                            _e.sent();
                            return [2 /*return*/, fireAlert];
                    }
                });
            });
        };
        IotService_1.prototype.listFireAlerts = function () {
            return __awaiter(this, arguments, void 0, function (page, limit) {
                var safePage, safeLimit, _a, items, total, unresolvedTotal;
                if (page === void 0) { page = 1; }
                if (limit === void 0) { limit = 20; }
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            safePage = clampInteger(page, 1, 1, 1000);
                            safeLimit = clampInteger(limit, 20, 1, 100);
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.fireAlert.findMany({
                                        orderBy: { reportedAt: 'desc' },
                                        skip: (safePage - 1) * safeLimit,
                                        take: safeLimit,
                                        include: { telemetrySnapshot: true },
                                    }),
                                    this.prisma.fireAlert.count(),
                                    this.prisma.fireAlert.count({
                                        where: { isResolved: false },
                                    }),
                                ])];
                        case 1:
                            _a = _b.sent(), items = _a[0], total = _a[1], unresolvedTotal = _a[2];
                            return [2 /*return*/, {
                                    items: items,
                                    meta: {
                                        page: safePage,
                                        limit: safeLimit,
                                        total: total,
                                        unresolvedTotal: unresolvedTotal,
                                        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
                                    },
                                }];
                    }
                });
            });
        };
        IotService_1.prototype.deleteFireAlert = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var fireAlert;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.fireAlert.findUnique({
                                where: { id: id },
                                select: { id: true },
                            })];
                        case 1:
                            fireAlert = _a.sent();
                            if (!fireAlert) {
                                throw new common_1.NotFoundException('Fire alert not found');
                            }
                            return [4 /*yield*/, this.prisma.fireAlert.delete({
                                    where: { id: fireAlert.id },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { deleted: true }];
                    }
                });
            });
        };
        IotService_1.prototype.deleteFireAlerts = function () {
            return __awaiter(this, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.fireAlert.deleteMany()];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, { count: result.count }];
                    }
                });
            });
        };
        IotService_1.prototype.markFireAlertAsRead = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var fireAlert;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.fireAlert.findUnique({
                                where: { id: id },
                                include: { telemetrySnapshot: true },
                            })];
                        case 1:
                            fireAlert = _b.sent();
                            if (!fireAlert) {
                                throw new common_1.NotFoundException('Fire alert not found');
                            }
                            if (fireAlert.isResolved) {
                                return [2 /*return*/, fireAlert];
                            }
                            return [2 /*return*/, this.prisma.fireAlert.update({
                                    where: { id: fireAlert.id },
                                    data: {
                                        isResolved: true,
                                        resolvedAt: (_a = fireAlert.resolvedAt) !== null && _a !== void 0 ? _a : new Date(),
                                    },
                                    include: { telemetrySnapshot: true },
                                })];
                    }
                });
            });
        };
        IotService_1.prototype.processTelemetryAlertTransitions = function (previousSnapshot, snapshot) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!((previousSnapshot === null || previousSnapshot === void 0 ? void 0 : previousSnapshot.fireDetected) === false && snapshot.fireDetected)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.createFireAlert({
                                    gateId: snapshot.gateId,
                                    reportedAt: snapshot.reportedAt.toISOString(),
                                })];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2:
                            if (!((previousSnapshot === null || previousSnapshot === void 0 ? void 0 : previousSnapshot.rainDetected) === false && snapshot.rainDetected)) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.notificationsService.createSystemNotifications(DEFAULT_RAIN_ALERT_TITLE, DEFAULT_RAIN_ALERT_MESSAGE, 'rain_alert', {
                                    gateId: snapshot.gateId,
                                    telemetrySnapshotId: snapshot.id,
                                }, { scope: 'all' })];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        IotService_1.prototype.countAvailableSlots = function (gateId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.parkingSlot.count({
                            where: {
                                gateId: gateId,
                                slotNumber: {
                                    in: (0, parking_slot_layout_1.getActiveParkingSlotNumbers)(gateId),
                                },
                                isOccupied: false,
                            },
                        })];
                });
            });
        };
        IotService_1.prototype.createDecision = function (action, message, availableSlots) {
            return {
                action: action,
                message: message,
                availableSlots: availableSlots,
                sessionId: null,
            };
        };
        IotService_1.prototype.normalizeSlots = function (gateId, slotBitmap, slots) {
            var activeSlotNumbers = (0, parking_slot_layout_1.getActiveParkingSlotNumbers)(gateId);
            var normalizedBitmap = this.normalizeSlotBitmap(slotBitmap, gateId);
            var slotByNumber = new Map((Array.isArray(slots) ? slots : []).map(function (slot) { return [
                (0, parking_slot_layout_1.normalizeParkingSlotNumber)(slot.slotNumber),
                slot,
            ]; }));
            return activeSlotNumbers.map(function (slotNumber, index) {
                var _a;
                var slot = slotByNumber.get(slotNumber);
                return {
                    slotNumber: slotNumber,
                    zone: String((slot === null || slot === void 0 ? void 0 : slot.zone) || 'Main').trim() || 'Main',
                    isOccupied: slot != null
                        ? Boolean((_a = slot.isOccupied) !== null && _a !== void 0 ? _a : slot.occupied)
                        : normalizedBitmap.charAt(index) === '1',
                    vehiclePlate: null,
                };
            });
        };
        IotService_1.prototype.buildSlotBitmap = function (slots) {
            return slots.map(function (slot) { return (slot.isOccupied ? '1' : '0'); }).join('');
        };
        IotService_1.prototype.normalizeNumber = function (value) {
            return typeof value === 'number' && Number.isFinite(value) ? value : null;
        };
        IotService_1.prototype.normalizeSlotBitmap = function (slotBitmap, gateId) {
            var size = (0, parking_slot_layout_1.getActiveParkingSlotNumbers)(gateId).length;
            var sanitized = String(slotBitmap || '').replace(/[^01]/g, '');
            if (sanitized.length === 0) {
                return (0, parking_slot_layout_1.getDefaultParkingSlotBitmap)(gateId);
            }
            return sanitized.padEnd(size, '0').slice(0, size);
        };
        IotService_1.prototype.coerceTelemetrySnapshot = function (gateId, reportedAt, snapshot) {
            var slots = Array.isArray(snapshot.slots)
                ? snapshot.slots.map(function (slot, index) {
                    var _a;
                    if (!slot || typeof slot !== 'object') {
                        return {
                            slotNumber: "A".concat(index + 1),
                            occupied: false,
                        };
                    }
                    var slotRecord = slot;
                    return {
                        slotNumber: String(slotRecord.slotNumber || "A".concat(index + 1)),
                        zone: String(slotRecord.zone || 'Main'),
                        occupied: Boolean((_a = slotRecord.occupied) !== null && _a !== void 0 ? _a : slotRecord.isOccupied),
                    };
                })
                : [];
            return {
                gateId: gateId,
                deviceIp: typeof snapshot.deviceIp === 'string' ? snapshot.deviceIp : undefined,
                slotBitmap: typeof snapshot.slotBitmap === 'string' ? snapshot.slotBitmap : undefined,
                slots: slots,
                temperature: typeof snapshot.temperature === 'number' ? snapshot.temperature : undefined,
                humidity: typeof snapshot.humidity === 'number' ? snapshot.humidity : undefined,
                rainDetected: Boolean(snapshot.rainDetected),
                fireDetected: Boolean(snapshot.fireDetected),
                reportedAt: reportedAt,
            };
        };
        return IotService_1;
    }());
    __setFunctionName(_classThis, "IotService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        IotService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return IotService = _classThis;
}();
exports.IotService = IotService;
