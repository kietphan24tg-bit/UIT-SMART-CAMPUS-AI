import { getOperationsTaskConfig } from '../role-ui';

describe('role-ui operations routes', () => {
  const liveData = {
    fireAlerts: {
      items: [
        {
          id: 'fire-1',
          gateId: 'uit-gate-a',
          message: 'Smoke detected',
          isResolved: false,
          reportedAt: '2026-04-07T05:00:00.000Z',
          resolvedAt: null,
          telemetrySnapshot: null,
        },
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    },
    parking: {
      availableSlots: 1,
      totalSlots: 2,
      activeSessions: 1,
      lastUpdated: '2026-04-07T05:00:00.000Z',
    },
    telemetry: {
      deviceIp: '192.168.1.10',
      reportedAt: '2026-04-07T05:00:00.000Z',
    },
  };

  it('keeps fire alert follow-up routes inside the operations tree', () => {
    const config = getOperationsTaskConfig('fire-alerts', 'admin', liveData);

    expect(config?.primaryAction?.route).toBe('/operations/alerts');
    expect(config?.sections[1]?.records?.[0]?.route).toBe('/operations/alerts');
  });

  it('keeps parking follow-up routes inside the operations tree', () => {
    const config = getOperationsTaskConfig('parking-ops', 'admin', liveData);

    expect(config?.primaryAction?.route).toBe('/operations/parking');
  });
});
