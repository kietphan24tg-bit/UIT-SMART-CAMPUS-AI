import { apiClient } from './client';

export interface EventListItem {
  id: string;
  slug: string;
  title: string;
  url: string;
  dateLabel: string;
  excerpt: string;
  thumbnailUrl: string;
  location?: string;
  status?: 'planned' | 'open' | 'closed';
  category?: 'workshop' | 'seminar' | 'community' | 'club';
  startAt?: string;
  endAt?: string;
  maxAttendees?: number | null;
  attendeeCount?: number;
  isRegistered?: boolean;
}

export interface ListEventsResponse {
  items: EventListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EventDetail {
  id: string;
  slug: string;
  title: string;
  publishedAtLabel: string;
  contentHtml: string;
  excerpt?: string;
  location?: string;
  status?: 'planned' | 'open' | 'closed';
  category?: 'workshop' | 'seminar' | 'community' | 'club';
  startAt?: string;
  endAt?: string;
  maxAttendees?: number | null;
  attendeeCount?: number;
  isRegistered?: boolean;
  coverImageUrl?: string | null;
  owner?: {
    id: string;
    email: string;
    fullName: string;
  };
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

  register: async (eventId: string) => {
    return (await apiClient.post(
      `/events/${encodeURIComponent(eventId)}/register`,
    )) as { id: string };
  },

  unregister: async (eventId: string) => {
    return (await apiClient.delete(
      `/events/${encodeURIComponent(eventId)}/register`,
    )) as { success: boolean };
  },
};

