import type { NotificationAlertCategory } from '../types/notification';

export function getNotificationAlertCategory(type?: string | null): NotificationAlertCategory {
  const normalized = String(type ?? '').trim().toLowerCase();

  if (normalized.includes('fire')) {
    return 'emergency';
  }

  if (
    normalized.includes('pay') ||
    normalized.includes('bill') ||
    normalized.includes('invoice') ||
    normalized.includes('transaction')
  ) {
    return 'payment';
  }

  if (
    normalized.includes('academic') ||
    normalized.includes('grade') ||
    normalized.includes('schedule') ||
    normalized.includes('class') ||
    normalized.includes('course') ||
    normalized.includes('attendance') ||
    normalized.includes('registration') ||
    normalized.includes('deadline') ||
    normalized.includes('exam')
  ) {
    return 'academic';
  }

  return 'general';
}
