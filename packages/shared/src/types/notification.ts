import type { UserRole } from '../constants/roles';

export type NotificationType =
  | 'general'
  | 'academic'
  | 'class_announcement'
  | 'schedule_update'
  | 'grade_published'
  | 'payment'
  | 'system'
  | 'deadline'
  | 'emergency'
  | 'fire_alert';

export type NotificationAudience =
  | {
      scope: 'all';
    }
  | {
      scope: 'roles';
      roles: UserRole[];
    }
  | {
      scope: 'class_section';
      classSectionId: string;
    };

export interface NotificationBroadcastRequest {
  title: string;
  body: string;
  type?: NotificationType;
  data?: Record<string, unknown>;
  audience: NotificationAudience;
}

export interface NotificationBroadcastResult {
  count: number;
  push?: {
    targetTokens: number;
    sent: number;
    failed: number;
    deactivatedTokens: number;
  };
}
