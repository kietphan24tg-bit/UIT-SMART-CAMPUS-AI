import { Role } from '@prisma/client';

import type { ChatbotAction, ChatbotAnswer, ChatbotCitation } from './chatbot.types';

const STOPWORDS = new Set([
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

const SYNONYMS: Record<string, string> = {
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

export function normalizeSearchText(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function applyAliases(text: string) {
  let result = text;
  for (const [alias, canonical] of Object.entries(SYNONYMS)) {
    result = result.replace(new RegExp(alias, 'g'), canonical);
  }
  return result;
}

export function tokenize(input: string) {
  const normalized = normalizeSearchText(input);
  const aliased = applyAliases(normalized);
  return aliased
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

export function includesAnyPhrase(normalizedMessage: string, phrases: string[]) {
  return phrases.some((phrase) => normalizedMessage.includes(normalizeSearchText(phrase)));
}

export function includesAllKeywords(tokens: string[], keywords: string[]) {
  return keywords.every((keyword) => tokens.some((token) => token.includes(keyword)));
}

export function uniqueStrings(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

export function buildAction(label: string, route: string): ChatbotAction {
  return {
    label,
    route,
    kind: 'navigate',
  };
}

export function buildDbCitation(
  label: string,
  sourceId: string,
  table: string,
  route?: string,
): ChatbotCitation {
  return {
    type: 'db',
    label,
    sourceId,
    table,
    route,
  };
}

export function buildDerivedCitation(
  label: string,
  sourceId: string,
  route?: string,
): ChatbotCitation {
  return {
    type: 'derived',
    label,
    sourceId,
    route,
  };
}

export function finalizeAnswer(answer: Omit<ChatbotAnswer, 'deepLinks' | 'trace' | 'proposal'>): ChatbotAnswer {
  return {
    ...answer,
    deepLinks: answer.actions.map((item) => item.route),
    trace: [],
    proposal: null,
  };
}

export function getWeekdayLabel(dayOfWeek: number) {
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
      return `Ngày ${dayOfWeek}`;
  }
}

export function isAdminRole(role: Role) {
  return role === Role.admin || role === Role.super_admin;
}

export function isOperatorRole(role: Role) {
  return role === Role.admin || role === Role.super_admin || role === Role.canteen_admin;
}

