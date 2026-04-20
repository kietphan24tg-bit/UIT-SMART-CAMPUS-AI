import type { ParkingStatus } from '@smart-campus/shared';

import {
  applyParkingStatusToDashboard,
  applyParkingStatusToOperationsSummary,
  applyParkingStatusToParkingOverview,
  applyTelemetryToOperationsSummary,
} from './parking-realtime-cache';

function makeParkingStatus(): ParkingStatus {
  const liveTimestamp = new Date().toISOString();

  return {
    gateId: 'uit-gate-a',
    totalSlots: 2,
    occupiedSlots: 1,
    availableSlots: 1,
    activeSessions: 1,
    lastUpdated: liveTimestamp,
    sensors: {
      temperature: 28,
      humidity: 61,
      rainDetected: true,
      fireDetected: false,
      deviceIp: '10.0.0.8',
      reportedAt: liveTimestamp,
    },
    slots: [],
  };
}

describe('parking realtime cache helpers', () => {
  it('updates the parking overview cache with live status', () => {
    const parkingStatus = makeParkingStatus();
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
    const parkingStatus = makeParkingStatus();
    const liveTimestamp = parkingStatus.lastUpdated ?? new Date().toISOString();
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
        reportedAt: liveTimestamp,
      },
    );

    expect(dashboard?.parking).toEqual(parkingStatus);
    expect(dashboard?.telemetryHealth).toBe('online');
    expect(operations?.parking).toEqual(parkingStatus);
    expect(operations?.telemetry?.rainDetected).toBe(true);
  });
});
