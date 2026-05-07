import { apiClient } from './client';

export interface ChatbotQueryResponse {
  sessionId: string;
  answer: string;
  citations: Array<Record<string, unknown>>;
  deepLinks: string[];
  suggestedQuestions: string[];
  confidence: number;
  intent: string;
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
  citations: unknown;
  deepLinks: unknown;
  createdAt: string;
}

export const chatbotApi = {
  query: async (payload: { message: string; sessionId?: string }) => {
    return (await apiClient.post('/chatbot/query', payload)) as ChatbotQueryResponse;
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
