import { apiClient } from './client';

export interface EventListItem {
  slug: string;
  title: string;
  sourceUrl: string;
  dateLabel: string;
  excerpt: string;
  thumbnailUrl: string;
}

export interface ListEventsResponse {
  items: EventListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EventDetail {
  slug: string;
  title: string;
  publishedAtLabel: string;
  excerpt: string;
  thumbnailUrl: string;
  contentHtml: string;
  sourceUrl: string;
}

export const EVENTS_PAGE_SIZE = 12;

function shouldUseMockEvents() {
  return process.env.EXPO_PUBLIC_USE_MOCK_EVENTS === '1';
}

export const eventsApi = {
  list: async ({
    page = 1,
    limit = EVENTS_PAGE_SIZE,
  }: {
    page?: number;
    limit?: number;
  } = {}): Promise<ListEventsResponse> => {
    if (shouldUseMockEvents()) {
      throw new Error('Mock events mode is disabled for this demo build');
    }

    return (await apiClient.get('/events', {
      params: {
        page,
        limit,
      },
    })) as ListEventsResponse;
  },

  detail: async (slug: string): Promise<EventDetail> => {
    if (shouldUseMockEvents()) {
      throw new Error('Mock events mode is disabled for this demo build');
    }

    return (await apiClient.get(`/events/${encodeURIComponent(slug)}`)) as EventDetail;
  },
};

