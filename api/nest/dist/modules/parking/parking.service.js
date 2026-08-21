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
exports.ParkingService = void 0;
var common_1 = require("@nestjs/common");
var parking_slot_layout_1 = require("./parking-slot-layout");
var DEFAULT_MONTHLY_FEE = 40000;
function normalizePlate(value) {
    return String(value || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
}
function normalizeRfid(value) {
    return String(value || '').trim().toUpperCase();
}
function resolveGateId(value) {
    var gateId = String(value || '').trim();
    return gateId || parking_slot_layout_1.DEFAULT_PARKING_GATE_ID;
}
var ParkingService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ParkingService = _classThis = /** @class */ (function () {
        function ParkingService_1(prisma) {
            this.prisma = prisma;
        }
        ParkingService_1.prototype.getStatus = function () {
            return __awaiter(this, arguments, void 0, function (gateId) {
                var resolvedGateId, activeSlotNumbers, _a, slots, latestTelemetry, activeSessions, slotByNumber, mappedSlots, availableSlots;
                var _b, _c, _d, _e, _f, _g, _h, _j, _k;
                if (gateId === void 0) { gateId = parking_slot_layout_1.DEFAULT_PARKING_GATE_ID; }
                return __generator(this, function (_l) {
                    switch (_l.label) {
                        case 0:
                            resolvedGateId = resolveGateId(gateId);
                            activeSlotNumbers = (0, parking_slot_layout_1.getActiveParkingSlotNumbers)(resolvedGateId);
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.parkingSlot.findMany({
                                        where: {
                                            gateId: resolvedGateId,
                                            slotNumber: { in: activeSlotNumbers },
                                        },
                                    }),
                                    this.prisma.telemetrySnapshot.findFirst({
                                        where: { gateId: resolvedGateId },
                                        orderBy: { reportedAt: 'desc' },
                                    }),
                                    this.prisma.parkingSession.count({
                                        where: {
                                            gateId: resolvedGateId,
                                            status: 'active',
                                        },
                                    }),
                                ])];
                        case 1:
                            _a = _l.sent(), slots = _a[0], latestTelemetry = _a[1], activeSessions = _a[2];
                            slotByNumber = new Map(slots.map(function (slot) { return [slot.slotNumber, slot]; }));
                            mappedSlots = activeSlotNumbers.flatMap(function (slotNumber) {
                                var slot = slotByNumber.get(slotNumber);
                                if (!slot) {
                                    return [];
                                }
                                return [
                                    {
                                        slotNumber: slot.slotNumber,
                                        zone: slot.zone,
                                        isOccupied: slot.isOccupied,
                                        vehiclePlate: slot.vehiclePlate,
                                        lastUpdated: slot.lastUpdated.toISOString(),
                                    },
                                ];
                            });
                            availableSlots = mappedSlots.filter(function (slot) { return !slot.isOccupied; }).length;
                            return [2 /*return*/, {
                                    gateId: resolvedGateId,
                                    totalSlots: mappedSlots.length,
                                    occupiedSlots: mappedSlots.length - availableSlots,
                                    availableSlots: availableSlots,
                                    activeSessions: activeSessions,
                                    lastUpdated: (_d = (_b = latestTelemetry === null || latestTelemetry === void 0 ? void 0 : latestTelemetry.reportedAt.toISOString()) !== null && _b !== void 0 ? _b : (_c = mappedSlots.at(-1)) === null || _c === void 0 ? void 0 : _c.lastUpdated) !== null && _d !== void 0 ? _d : null,
                                    sensors: {
                                        temperature: (_e = latestTelemetry === null || latestTelemetry === void 0 ? void 0 : latestTelemetry.temperature) !== null && _e !== void 0 ? _e : null,
                                        humidity: (_f = latestTelemetry === null || latestTelemetry === void 0 ? void 0 : latestTelemetry.humidity) !== null && _f !== void 0 ? _f : null,
                                        rainDetected: (_g = latestTelemetry === null || latestTelemetry === void 0 ? void 0 : latestTelemetry.rainDetected) !== null && _g !== void 0 ? _g : false,
                                        fireDetected: (_h = latestTelemetry === null || latestTelemetry === void 0 ? void 0 : latestTelemetry.fireDetected) !== null && _h !== void 0 ? _h : false,
                                        deviceIp: (_j = latestTelemetry === null || latestTelemetry === void 0 ? void 0 : latestTelemetry.deviceIp) !== null && _j !== void 0 ? _j : null,
                                        reportedAt: (_k = latestTelemetry === null || latestTelemetry === void 0 ? void 0 : latestTelemetry.reportedAt.toISOString()) !== null && _k !== void 0 ? _k : null,
                                    },
                                    slots: mappedSlots,
                                }];
                    }
                });
            });
        };
        ParkingService_1.prototype.listVehicles = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var vehicles;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.vehicle.findMany({
                                where: { userId: userId },
                                include: { subscription: true },
                                orderBy: { createdAt: 'desc' },
                            })];
                        case 1:
                            vehicles = _a.sent();
                            return [2 /*return*/, vehicles.map(function (vehicle) { return _this.mapVehicle(vehicle); })];
                    }
                });
            });
        };
        ParkingService_1.prototype.createVehicle = function (userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var plateNumber, rfidTag, duplicateVehicle, vehicle;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            plateNumber = normalizePlate(dto.plateNumber);
                            rfidTag = normalizeRfid(dto.rfidTag);
                            return [4 /*yield*/, this.prisma.vehicle.findFirst({
                                    where: {
                                        OR: [{ plateNumber: plateNumber }, { rfidTag: rfidTag }],
                                    },
                                })];
                        case 1:
                            duplicateVehicle = _b.sent();
                            if (duplicateVehicle) {
                                throw new common_1.ConflictException(duplicateVehicle.plateNumber === plateNumber
                                    ? 'Biển số đã được đăng ký'
                                    : 'RFID đã được đăng ký');
                            }
                            return [4 /*yield*/, this.prisma.vehicle.create({
                                    data: {
                                        userId: userId,
                                        plateNumber: plateNumber,
                                        rfidTag: rfidTag,
                                        label: ((_a = dto.label) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                                        subscription: {
                                            create: {
                                                monthlyFee: DEFAULT_MONTHLY_FEE,
                                                status: 'inactive',
                                            },
                                        },
                                    },
                                    include: { subscription: true },
                                })];
                        case 2:
                            vehicle = _b.sent();
                            return [2 /*return*/, this.mapVehicle(vehicle)];
                    }
                });
            });
        };
        ParkingService_1.prototype.getVehicleForUser = function (userId, vehicleId) {
            return __awaiter(this, void 0, void 0, function () {
                var vehicle;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.vehicle.findFirst({
                                where: {
                                    id: vehicleId,
                                    userId: userId,
                                },
                                include: { subscription: true },
                            })];
                        case 1:
                            vehicle = _a.sent();
                            if (!vehicle) {
                                throw new common_1.NotFoundException('Không tìm thấy xe');
                            }
                            return [2 /*return*/, vehicle];
                    }
                });
            });
        };
        ParkingService_1.prototype.mapVehicle = function (vehicle) {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            var subscription = vehicle.subscription;
            var resolvedStatus = this.resolveSubscriptionStatus(subscription);
            return {
                id: vehicle.id,
                plateNumber: vehicle.plateNumber,
                rfidTag: vehicle.rfidTag,
                label: vehicle.label,
                isActive: vehicle.isActive,
                createdAt: vehicle.createdAt.toISOString(),
                updatedAt: vehicle.updatedAt.toISOString(),
                subscription: {
                    id: (_a = subscription === null || subscription === void 0 ? void 0 : subscription.id) !== null && _a !== void 0 ? _a : '',
                    status: resolvedStatus,
                    monthlyFee: (_b = subscription === null || subscription === void 0 ? void 0 : subscription.monthlyFee) !== null && _b !== void 0 ? _b : DEFAULT_MONTHLY_FEE,
                    startDate: (_d = (_c = subscription === null || subscription === void 0 ? void 0 : subscription.startDate) === null || _c === void 0 ? void 0 : _c.toISOString()) !== null && _d !== void 0 ? _d : null,
                    endDate: (_f = (_e = subscription === null || subscription === void 0 ? void 0 : subscription.endDate) === null || _e === void 0 ? void 0 : _e.toISOString()) !== null && _f !== void 0 ? _f : null,
                    lastPaymentAt: (_h = (_g = subscription === null || subscription === void 0 ? void 0 : subscription.lastPaymentAt) === null || _g === void 0 ? void 0 : _g.toISOString()) !== null && _h !== void 0 ? _h : null,
                },
            };
        };
        ParkingService_1.prototype.resolveSubscriptionStatus = function (subscription) {
            if (!subscription) {
                return 'inactive';
            }
            if (subscription.endDate && subscription.endDate < new Date()) {
                return 'expired';
            }
            return subscription.status;
        };
        return ParkingService_1;
    }());
    __setFunctionName(_classThis, "ParkingService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ParkingService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ParkingService = _classThis;
}();
exports.ParkingService = ParkingService;
