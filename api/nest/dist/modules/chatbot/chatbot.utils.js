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
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSearchText = normalizeSearchText;
exports.applyAliases = applyAliases;
exports.tokenize = tokenize;
exports.includesAnyPhrase = includesAnyPhrase;
exports.includesAllKeywords = includesAllKeywords;
exports.uniqueStrings = uniqueStrings;
exports.buildAction = buildAction;
exports.buildDbCitation = buildDbCitation;
exports.buildDerivedCitation = buildDerivedCitation;
exports.finalizeAnswer = finalizeAnswer;
exports.getWeekdayLabel = getWeekdayLabel;
exports.isAdminRole = isAdminRole;
exports.isOperatorRole = isOperatorRole;
var client_1 = require("@prisma/client");
var STOPWORDS = new Set([
    'ban',
    'toi',
    'cua',
    'cho',
    'voi',
    'the',
    'mot',
    'cac',
    'nhung',
    'duoc',
    'khong',
    'khi',
    'nhu',
    'tren',
    'trong',
    'den',
    'hay',
    'nao',
    'nay',
    'day',
    'tat',
    'rat',
    'gan',
    'biet',
    'bao',
    'moi',
    'dau',
    'sao',
    'con',
    'roi',
    'het',
    'xem',
    'qua',
    'lai',
    'vai',
    'hon',
    'nam',
    'gio',
    'ngay',
    'tuan',
    'thang',
    'hom',
    'xin',
    'vui',
    'long',
    'hien',
    'tai',
    'giup',
    'moi',
    'neu',
    'lam',
    'sao',
]);
var SYNONYMS = {
    'can tin': 'canteen',
    'nha an': 'canteen',
    'quan an': 'canteen',
    'dat mon': 'canteen',
    'thu vien': 'library',
    'muon sach': 'library loan',
    'sach dang muon': 'library loan',
    'tai lieu': 'study material',
    'de thi': 'study material exam',
    'giao trinh': 'study material textbook',
    'lich hoc': 'schedule student',
    'lich day': 'schedule lecturer',
    'mon hoc': 'schedule student',
    'diem danh': 'attendance',
    'dang ky mon': 'registration',
    'dang ky hoc phan': 'registration',
    'dat phong': 'room booking',
    'phong hop': 'room booking',
    'phong trong': 'room booking',
    'su kien': 'event',
    'hoat dong': 'event',
    'thong bao': 'notification',
    'khan cap': 'sos',
    'gps': 'sos',
    'bai gui xe': 'parking',
    'giu xe': 'parking',
    'cam bien': 'telemetry',
    'van hanh': 'ops',
};
function normalizeSearchText(input) {
    return input
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');
}
function applyAliases(text) {
    var result = text;
    for (var _i = 0, _a = Object.entries(SYNONYMS); _i < _a.length; _i++) {
        var _b = _a[_i], alias = _b[0], canonical = _b[1];
        result = result.replace(new RegExp(alias, 'g'), canonical);
    }
    return result;
}
function tokenize(input) {
    var normalized = normalizeSearchText(input);
    var aliased = applyAliases(normalized);
    return aliased
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(function (token) { return token.length >= 3 && !STOPWORDS.has(token); });
}
function includesAnyPhrase(normalizedMessage, phrases) {
    return phrases.some(function (phrase) { return normalizedMessage.includes(normalizeSearchText(phrase)); });
}
function includesAllKeywords(tokens, keywords) {
    return keywords.every(function (keyword) { return tokens.some(function (token) { return token.includes(keyword); }); });
}
function uniqueStrings(items) {
    return Array.from(new Set(items.filter(Boolean)));
}
function buildAction(label, route) {
    return {
        label: label,
        route: route,
        kind: 'navigate',
    };
}
function buildDbCitation(label, sourceId, table, route) {
    return {
        type: 'db',
        label: label,
        sourceId: sourceId,
        table: table,
        route: route,
    };
}
function buildDerivedCitation(label, sourceId, route) {
    return {
        type: 'derived',
        label: label,
        sourceId: sourceId,
        route: route,
    };
}
function finalizeAnswer(answer) {
    return __assign(__assign({}, answer), { deepLinks: answer.actions.map(function (item) { return item.route; }) });
}
function getWeekdayLabel(dayOfWeek) {
    switch (dayOfWeek) {
        case 0:
            return 'Chủ nhật';
        case 1:
            return 'Thứ 2';
        case 2:
            return 'Thứ 3';
        case 3:
            return 'Thứ 4';
        case 4:
            return 'Thứ 5';
        case 5:
            return 'Thứ 6';
        case 6:
            return 'Thứ 7';
        default:
            return "Ng\u00E0y ".concat(dayOfWeek);
    }
}
function isAdminRole(role) {
    return role === client_1.Role.admin || role === client_1.Role.super_admin;
}
function isOperatorRole(role) {
    return role === client_1.Role.admin || role === client_1.Role.super_admin || role === client_1.Role.canteen_admin;
}
