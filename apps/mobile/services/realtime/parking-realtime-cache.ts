import type { ParkingStatus } from '@smart-campus/shared';

import type {
  DashboardSnapshot,
  OperationsSummaryState,
  ParkingOverviewState,
  TelemetrySnapshotRecord,
} from '@/types/app-data';
import { getTelemetryHealthState } from '@/utils/app';

export function applyParkingStatusToParkingOverview(
  previous: ParkingOverviewState | undefined,
  status: ParkingStatus,
) {
  if (!previous) {
    return previous;
  }

  return {
    ...previous,
    status,
    telemetryHealth: getTelemetryHealthState(
      status.lastUpdated ?? status.sensors.reportedAt ?? null,
      status.sensors.fireDetected,
    ),
  };
}

export function applyParkingStatusToDashboard(
  previous: DashboardSnapshot | undefined,
  status: ParkingStatus,
) {
  if (!previous) {
    return previous;
  }

  return {
    ...previous,
    parking: status,
    telemetryHealth: getTelemetryHealthState(
      status.lastUpdated ?? status.sensors.reportedAt ?? null,
      status.sensors.fireDetected,
    ),
  };
}

export function applyParkingStatusToOperationsSummary(
  previous: OperationsSummaryState | undefined,
  status: ParkingStatus,
) {
  if (!previous) {
    return previous;
  }

  return {
    ...previous,
    parking: status,
  };
}

export function applyTelemetryToOperationsSummary(
  previous: OperationsSummaryState | undefined,
  telemetry: TelemetrySnapshotRecord,
) {
  if (!previous) {
    return previous;
  }

  return {
    ...previous,
    telemetry,
  };
}
