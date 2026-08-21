"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var chatbot_domain_registry_1 = require("./chatbot.domain-registry");
var chatbot_utils_1 = require("./chatbot.utils");
describe('ChatbotDomainRegistry', function () {
    var registry = new chatbot_domain_registry_1.ChatbotDomainRegistry();
    it('ranks study materials above library for exam-material questions', function () {
        var _a;
        var ranked = registry.rankDomains({
            userId: 'student-1',
            role: client_1.Role.student,
            message: 'Cho minh tai lieu de thi moi',
            normalizedMessage: (0, chatbot_utils_1.normalizeSearchText)('Cho minh tai lieu de thi moi'),
            tokens: (0, chatbot_utils_1.tokenize)('Cho minh tai lieu de thi moi'),
            now: new Date('2026-06-02T00:00:00.000Z'),
        });
        expect((_a = ranked[0]) === null || _a === void 0 ? void 0 : _a.id).toBe('study-materials');
    });
    it('returns role-aware summary scopes for lecturers', function () {
        var _a;
        var scopes = registry.getCapabilityScopes(client_1.Role.lecturer);
        expect(scopes.map(function (item) { return item.scope; })).toEqual(['today', 'work']);
        expect((_a = scopes[0]) === null || _a === void 0 ? void 0 : _a.label).toContain('Lịch dạy');
    });
});
