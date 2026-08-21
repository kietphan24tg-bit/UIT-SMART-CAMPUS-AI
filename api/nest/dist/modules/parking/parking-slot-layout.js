"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PARKING_GATE_ID = void 0;
exports.getActiveParkingSlotNumbers = getActiveParkingSlotNumbers;
exports.getDefaultParkingSlotBitmap = getDefaultParkingSlotBitmap;
exports.normalizeParkingSlotNumber = normalizeParkingSlotNumber;
exports.DEFAULT_PARKING_GATE_ID = 'uit-gate-a';
var DEFAULT_ACTIVE_PARKING_SLOT_NUMBERS = ['A1', 'A2'];
var ACTIVE_PARKING_SLOT_NUMBERS_BY_GATE = (_a = {},
    _a[exports.DEFAULT_PARKING_GATE_ID] = DEFAULT_ACTIVE_PARKING_SLOT_NUMBERS,
    _a);
function getActiveParkingSlotNumbers(gateId) {
    var _a;
    if (gateId === void 0) { gateId = exports.DEFAULT_PARKING_GATE_ID; }
    return __spreadArray([], ((_a = ACTIVE_PARKING_SLOT_NUMBERS_BY_GATE[gateId]) !== null && _a !== void 0 ? _a : DEFAULT_ACTIVE_PARKING_SLOT_NUMBERS), true);
}
function getDefaultParkingSlotBitmap(gateId) {
    if (gateId === void 0) { gateId = exports.DEFAULT_PARKING_GATE_ID; }
    return '0'.repeat(getActiveParkingSlotNumbers(gateId).length);
}
function normalizeParkingSlotNumber(value) {
    return String(value || '').trim().toUpperCase();
}
