import type { UserRole } from '../constants/roles';

export type NotificationType =
  | 'general'
  | 'academic'
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
}
