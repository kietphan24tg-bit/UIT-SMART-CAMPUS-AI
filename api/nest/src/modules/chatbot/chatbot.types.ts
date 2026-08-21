import type { Role } from '@prisma/client';

export type ChatbotDomainId =
  | 'general'
  | 'canteen'
  | 'library'
  | 'schedule'
  | 'grades'
  | 'attendance'
  | 'registrations'
  | 'study-materials'
  | 'room-bookings'
  | 'parking'
  | 'events'
  | 'notifications'
  | 'sos'
  | 'ops'
  | 'campus-map';

export type ChatbotAnswerType = 'live' | 'summary' | 'knowledge' | 'fallback';
export type ChatbotSummaryScope = 'today' | 'work' | 'ops';
export type ChatbotActionKind = 'navigate';

export interface ChatbotAction {
  label: string;
  route: string;
  kind: ChatbotActionKind;
}

export interface ChatbotCitation {
  type: 'db' | 'kb' | 'derived' | 'system';
  label: string;
  sourceId: string;
  route?: string;
  table?: string;
  slug?: string;
  sourceUrl?: string | null;
}

export interface ChatbotAnswer {
  answer: string;
  citations: ChatbotCitation[];
  actions: ChatbotAction[];
  deepLinks: string[];
  suggestedQuestions: string[];
  confidence: number;
  intent: string;
  domain: ChatbotDomainId;
  answerType: ChatbotAnswerType;
}

export interface ChatbotMessageContext {
  userId: string;
  role: Role;
  message: string;
  normalizedMessage: string;
  tokens: string[];
  now: Date;
}

export interface ChatbotSummaryContext {
  userId: string;
  role: Role;
  scope: ChatbotSummaryScope;
  now: Date;
}

export interface ChatbotDomainDefinition {
  id: ChatbotDomainId;
  label: string;
  description: string;
  route: string;
  actionLabel: string;
  roles: Role[];
  keywords: string[];
  phrases: string[];
  knowledgeSlug: string;
}

export interface ChatbotCapabilityDomain {
  id: ChatbotDomainId;
  label: string;
  description: string;
  route: string;
  actionLabel: string;
  quickPrompts: string[];
}

export interface ChatbotCapabilityScope {
  scope: ChatbotSummaryScope;
  label: string;
  description: string;
}

export interface ChatbotCapabilitiesResponse {
  quickPrompts: string[];
  summaryScopes: ChatbotCapabilityScope[];
  domains: ChatbotCapabilityDomain[];
}

export interface ChatbotDomainHandler {
  canHandle: (context: ChatbotMessageContext) => boolean;
  answer: (context: ChatbotMessageContext) => Promise<ChatbotAnswer | null>;
  buildSummary: (context: ChatbotSummaryContext) => Promise<ChatbotAnswer | null>;
  getSuggestedQuestions: (role: Role) => string[];
}
