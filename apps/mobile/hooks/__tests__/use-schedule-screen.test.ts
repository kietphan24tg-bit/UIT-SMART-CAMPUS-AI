import {
  clearFireAlertsFromAlertFeed,
  clearFireAlertsFromOperationsSummary,
  markFireAlertAsReadInAlertFeed,
  markFireAlertAsReadInOperationsSummary,
  removeFireAlertFromAlertFeed,
  removeFireAlertFromOperationsSummary,
} from '../use-schedule-screen';

describe('useScheduleScreen fire alert cache helpers', () => {
  const operationsSummary = {
    parking: null,
    telemetry: null,
    fireAlerts: {
      items: [
        {
          id: 'fire-1',
          gateId: 'uit-gate-a',
          message: 'Phát hiện khói',
          isResolved: false,
          reportedAt: '2026-08-10T16:00:00.000Z',
          resolvedAt: null,
          telemetrySnapshot: null,
        },
        {
          id: 'fire-2',
          gateId: 'uit-gate-b',
          message: 'Phát hiện lửa',
          isResolved: false,
          reportedAt: '2026-08-10T16:05:00.000Z',
          resolvedAt: null,
          telemetrySnapshot: null,
        },
      ],
      meta: { total: 5, unresolvedTotal: 2, page: 1, limit: 10, totalPages: 1 },
    },
    unreadCount: 3,
    gpa: null,
  };

  const alertFeed = [
    {
      id: 'notification-1',
      kind: 'notification' as const,
      title: 'Lịch học thay đổi',
      body: 'Phòng học được cập nhật.',
      timestamp: '2026-08-10T16:10:00.000Z',
      severity: 'warning' as const,
      category: 'academic' as const,
      isRead: false,
    },
    {
      id: 'fire-1',
      kind: 'fire_alert' as const,
      title: 'Cảnh báo cháy bãi xe',
      body: 'Phát hiện khói',
      timestamp: '2026-08-10T16:00:00.000Z',
      severity: 'critical' as const,
      category: 'emergency' as const,
      isRead: false,
    },
  ];

  it('removes one fire alert and decrements the cached total', () => {
    const next = removeFireAlertFromOperationsSummary(operationsSummary, 'fire-1');

    expect(next?.fireAlerts.items).toHaveLength(1);
    expect(next?.fireAlerts.items[0]?.id).toBe('fire-2');
    expect(next?.fireAlerts.meta.total).toBe(4);
    expect(next?.fireAlerts.meta.unresolvedTotal).toBe(1);
  });

  it('clears all fire alerts from the operations summary cache', () => {
    const next = clearFireAlertsFromOperationsSummary(operationsSummary);

    expect(next?.fireAlerts.items).toEqual([]);
    expect(next?.fireAlerts.meta.total).toBe(0);
    expect(next?.fireAlerts.meta.unresolvedTotal).toBe(0);
    expect(next?.fireAlerts.meta.totalPages).toBe(1);
  });

  it('marks one fire alert as read and only decrements the unread total', () => {
    const next = markFireAlertAsReadInOperationsSummary(operationsSummary, 'fire-1');

    expect(next?.fireAlerts.items[0]).toEqual(
      expect.objectContaining({
        id: 'fire-1',
        isResolved: true,
      }),
    );
    expect(next?.fireAlerts.meta.total).toBe(5);
    expect(next?.fireAlerts.meta.unresolvedTotal).toBe(1);
  });

  it('removes only the targeted fire alert from the alert feed cache', () => {
    const next = removeFireAlertFromAlertFeed(alertFeed, 'fire-1');

    expect(next).toHaveLength(1);
    expect(next?.[0]?.kind).toBe('notification');
  });

  it('clears all fire alerts but keeps normal notifications in the feed cache', () => {
    const next = clearFireAlertsFromAlertFeed(alertFeed);

    expect(next).toHaveLength(1);
    expect(next?.[0]?.id).toBe('notification-1');
  });

  it('marks one fire alert as read in the alert feed cache', () => {
    const next = markFireAlertAsReadInAlertFeed(alertFeed, 'fire-1');

    expect(next?.[1]).toEqual(
      expect.objectContaining({
        id: 'fire-1',
        isRead: true,
        severity: 'warning',
      }),
    );
  });
});
