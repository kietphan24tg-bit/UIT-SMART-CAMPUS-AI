import { Role } from '@prisma/client';

import { ChatbotDomainRegistry } from './chatbot.domain-registry';
import { normalizeSearchText, tokenize } from './chatbot.utils';

describe('ChatbotDomainRegistry', () => {
  const registry = new ChatbotDomainRegistry();

  it('ranks study materials above library for exam-material questions', () => {
    const ranked = registry.rankDomains({
      userId: 'student-1',
      role: Role.student,
      message: 'Cho minh tai lieu de thi moi',
      normalizedMessage: normalizeSearchText('Cho minh tai lieu de thi moi'),
      tokens: tokenize('Cho minh tai lieu de thi moi'),
      now: new Date('2026-06-02T00:00:00.000Z'),
    });

    expect(ranked[0]?.id).toBe('study-materials');
  });

  it('returns role-aware summary scopes for lecturers', () => {
    const scopes = registry.getCapabilityScopes(Role.lecturer);

    expect(scopes.map((item) => item.scope)).toEqual(['today', 'work']);
    expect(scopes[0]?.label).toContain('Lịch dạy');
  });
});
