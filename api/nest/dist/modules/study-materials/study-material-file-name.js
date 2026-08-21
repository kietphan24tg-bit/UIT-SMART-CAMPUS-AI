"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeStudyMaterialFileName = decodeStudyMaterialFileName;
exports.normalizeStudyMaterialFileName = normalizeStudyMaterialFileName;
var ENCODED_SEGMENT_PATTERN = /%[0-9A-Fa-f]{2}/;
function decodeOnce(value) {
    try {
        return decodeURIComponent(value);
    }
    catch (_a) {
        return value;
    }
}
function decodeStudyMaterialFileName(value) {
    var trimmed = value === null || value === void 0 ? void 0 : value.trim();
    if (!trimmed) {
        return '';
    }
    var current = trimmed;
    for (var attempt = 0; attempt < 3 && ENCODED_SEGMENT_PATTERN.test(current); attempt += 1) {
        var decoded = decodeOnce(current).trim();
        if (!decoded || decoded === current) {
            break;
        }
        current = decoded;
    }
    return current;
}
function normalizeStudyMaterialFileName(value, fallback) {
    var decoded = decodeStudyMaterialFileName(value);
    return decoded || fallback;
}
