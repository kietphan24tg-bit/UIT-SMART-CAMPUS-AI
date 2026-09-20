import { apiClient, isRateLimitError } from './client';

export interface ChatbotAction {
  label: string;
  route: string;
  kind: 'navigate';
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

export interface ChatbotAnswerResponse {
  answer: string;
  citations: ChatbotCitation[];
  deepLinks: string[];
  actions?: ChatbotAction[];
  suggestedQuestions: string[];
  confidence: number;
  intent: string;
  domain: string;
  answerType: 'live' | 'summary' | 'knowledge' | 'clarification' | 'fallback';
}

export interface ChatbotQueryResponse {
  sessionId: string;
  answer: string;
  citations: ChatbotCitation[];
  deepLinks: string[];
  actions?: ChatbotAction[];
  suggestedQuestions: string[];
  confidence: number;
  intent: string;
  domain: string;
  answerType: 'live' | 'summary' | 'knowledge' | 'clarification' | 'fallback';
}

const MAX_AGENT_RATE_LIMIT_RETRIES = 1;

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

export interface ChatbotSessionRecord {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatbotMessageRecord {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent: string | null;
  confidence: number | null;
  citations: ChatbotCitation[] | unknown;
  deepLinks: unknown;
  actions?: ChatbotAction[];
  createdAt: string;
}

export interface ChatbotCapabilityScope {
  scope: 'today' | 'work' | 'ops';
  label: string;
  description: string;
}

export interface ChatbotCapabilityDomain {
  id: string;
  label: string;
  description: string;
  route: string;
  actionLabel: string;
  quickPrompts: string[];
}

export interface ChatbotCapabilitiesResponse {
  quickPrompts: string[];
  summaryScopes: ChatbotCapabilityScope[];
  domains: ChatbotCapabilityDomain[];
}

const ROUTE_LABELS: Record<string, string> = {
  '/services/canteen': 'Mở canteen',
  '/services/canteen/admin': 'Mở quản trị canteen',
  '/services/library': 'Mở thư viện',
  '/services/library/admin': 'Mở quản trị thư viện',
  '/services/gps-sos': 'Mở GPS/SOS',
  '/services/attendance': 'Mở điểm danh',
  '/services/attendance/lecturer': 'Mở điểm danh giảng viên',
  '/services/grades': 'Mở điểm',
  '/services/grades/lecturer': 'Mở bảng nhập điểm',
  '/services/room-booking': 'Mở đặt phòng',
  '/services/room-booking/my': 'Mở yêu cầu phòng của tôi',
  '/services/room-booking/approvals': 'Mở queue đặt phòng',
  '/services/study-materials': 'Mở tài liệu',
  '/services/study-materials/admin': 'Mở quản trị tài liệu',
  '/services/parking': 'Mở parking',
  '/services/events': 'Mở sự kiện',
  '/services/course-registration': 'Mở đăng ký môn',
  '/services/campus-map': 'Mở bản đồ',
  '/services/admin-tools': 'Mở quản trị',
  '/schedule': 'Mở lịch',
  '/alerts': 'Mở cảnh báo',
  '/services': 'Mở dịch vụ',
};

export function buildChatbotActionsFromDeepLinks(deepLinks: string[] | unknown): ChatbotAction[] {
  if (!Array.isArray(deepLinks)) {
    return [];
  }

  const normalized = Array.from(
    new Set(deepLinks.filter((item): item is string => typeof item === 'string' && item.length > 0)),
  );

  return normalized.map((route) => ({
    label: ROUTE_LABELS[route] ?? 'Mở chi tiết',
    route,
    kind: 'navigate' as const,
  }));
}

export const chatbotApi = {
  query: async (payload: { message: string; sessionId?: string }) => {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return (await apiClient.post('/chatbot/query', payload)) as ChatbotQueryResponse;
      } catch (error) {
        if (!isRateLimitError(error) || attempt >= MAX_AGENT_RATE_LIMIT_RETRIES) {
          throw error;
        }
        const delaySeconds = Math.min(error.retryAfterSeconds ?? 1, 30);
        await wait(delaySeconds * 1000);
      }
    }
  },

  getSummary: async (scope: 'today' | 'work' | 'ops') => {
    return (await apiClient.get(`/chatbot/summary?scope=${encodeURIComponent(scope)}`)) as ChatbotAnswerResponse;
  },

  getCapabilities: async () => {
    return (await apiClient.get('/chatbot/capabilities')) as ChatbotCapabilitiesResponse;
  },

  listSessions: async () => {
    return (await apiClient.get('/chatbot/sessions')) as ChatbotSessionRecord[];
  },

  getMessages: async (sessionId: string) => {
    return (await apiClient.get(
      `/chatbot/sessions/${encodeURIComponent(sessionId)}/messages`,
    )) as ChatbotMessageRecord[];
  },
};
