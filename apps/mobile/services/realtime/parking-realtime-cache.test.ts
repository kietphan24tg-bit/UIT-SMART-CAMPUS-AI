import type { ParkingStatus } from '@smart-campus/shared';

import {
  applyParkingStatusToDashboard,
  applyParkingStatusToOperationsSummary,
  applyParkingStatusToParkingOverview,
  applyTelemetryToOperationsSummary,
} from './parking-realtime-cache';

const parkingStatus: ParkingStatus = {
  gateId: 'uit-gate-a',
  totalSlots: 2,
  occupiedSlots: 1,
  availableSlots: 1,
  activeSessions: 1,
  lastUpdated: '2026-04-14T10:00:00.000Z',
  sensors: {
    temperature: 28,
    humidity: 61,
    rainDetected: true,
    fireDetected: false,
    deviceIp: '10.0.0.8',
    reportedAt: '2026-04-14T10:00:00.000Z',
  },
  slots: [],
};

describe('parking realtime cache helpers', () => {
  it('updates the parking overview cache with live status', () => {
    const updated = applyParkingStatusToParkingOverview(
      {
        status: null,
        vehicles: [],
        telemetryHealth: 'offline',
      },
      parkingStatus,
    );

    expect(updated).toEqual(
      expect.objectContaining({
        status: parkingStatus,
        telemetryHealth: 'online',
      }),
    );
  });

  it('updates dashboard and operations caches', () => {
    const dashboard = applyParkingStatusToDashboard(
      {
        role: 'student',
        todayClasses: [],
        nextClass: null,
        gpa: null,
        unreadCount: 0,
        parking: null,
        telemetryHealth: 'no-data',
      },
      parkingStatus,
    );
    const operations = applyTelemetryToOperationsSummary(
      applyParkingStatusToOperationsSummary(
        {
          parking: null,
          telemetry: null,
          fireAlerts: {
            items: [],
            meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
          },
          unreadCount: 2,
          gpa: null,
        },
        parkingStatus,
      ),
      {
        id: 'telemetry-1',
        gateId: 'uit-gate-a',
        deviceIp: '10.0.0.8',
        slotBitmap: '10',
        slots: [{ slotNumber: 'A1', isOccupied: true }],
        temperature: 28,
        humidity: 61,
        rainDetected: true,
        fireDetected: false,
        reportedAt: '2026-04-14T10:00:00.000Z',
      },
    );

    expect(dashboard?.parking).toEqual(parkingStatus);
    expect(dashboard?.telemetryHealth).toBe('online');
    expect(operations?.parking).toEqual(parkingStatus);
    expect(operations?.telemetry?.rainDetected).toBe(true);
  });
});
