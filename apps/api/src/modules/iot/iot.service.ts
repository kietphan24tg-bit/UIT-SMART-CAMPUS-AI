import { Injectable, NotFoundException } from '@nestjs/common';
import { USER_ROLES } from '@smart-campus/shared';

import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ParkingService } from '../parking/parking.service';
import {
  getActiveParkingSlotNumbers,
  getDefaultParkingSlotBitmap,
  normalizeParkingSlotNumber,
} from '../parking/parking-slot-layout';

import type {
  FireAlertDto,
  FireAlertTelemetrySnapshotDto,
} from './dto/fire-alert.dto';
import type { IotScanDto } from './dto/iot-scan.dto';
import type { TelemetryDto } from './dto/telemetry.dto';
import { ParkingRealtimeGateway } from './parking-realtime.gateway';

const DEFAULT_FIRE_ALERT_MESSAGE = 'Cảm biến lửa đã kích hoạt tại bãi xe UIT Campus.';

function normalizePlate(value: string) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function normalizeRfid(value: string) {
  return String(value || '').trim().toUpperCase();
}

function normalizeGateId(value?: string) {
  const gateId = String(value || '').trim();
  return gateId || undefined;
}

function clampInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const normalized = Math.trunc(parsed);
  return Math.min(max, Math.max(min, normalized));
}

@Injectable()
export class IotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly parkingService: ParkingService,
    private readonly parkingRealtimeGateway: ParkingRealtimeGateway,
  ) {}

  async processParkingScan(dto: IotScanDto) {
    const rfidTag = normalizeRfid(dto.rfidTag);
    const recognizedPlate = normalizePlate(dto.recognizedPlate);
    const availableSlots = await this.countAvailableSlots(dto.gateId);

    if (!recognizedPlate) {
      return this.createDecision('denied', 'Không nhận diện được biển số hợp lệ.', availableSlots);
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { rfidTag },
      include: { subscription: true },
    });

    if (!vehicle || !vehicle.isActive) {
      return this.createDecision(
        'denied',
        'RFID chưa được đăng ký trên app UIT Campus.',
        availableSlots,
      );
    }

    if (normalizePlate(vehicle.plateNumber) !== recognizedPlate) {
      return this.createDecision(
        'denied',
        'Biển số không khớp với xe đã đăng ký.',
        availableSlots,
      );
    }

    const activeSession = await this.prisma.parkingSession.findFirst({
      where: {
        vehicleId: vehicle.id,
        status: 'active',
      },
      orderBy: { entryTime: 'desc' },
    });

    if (activeSession) {
      const completed = await this.prisma.parkingSession.update({
        where: { id: activeSession.id },
        data: {
          status: 'completed',
          recognizedExitPlate: recognizedPlate,
          exitTime: new Date(dto.capturedAt),
        },
      });

      return {
        action: 'exit_allowed',
        message: 'Biển số hợp lệ. Mở barrier cho xe ra.',
        availableSlots,
        sessionId: completed.id,
      };
    }

    const subscriptionExpired =
      !vehicle.subscription ||
      vehicle.subscription.status !== 'active' ||
      !vehicle.subscription.endDate ||
      vehicle.subscription.endDate < new Date();

    if (subscriptionExpired) {
      return this.createDecision(
        'denied',
        'Gói gửi xe tháng chưa hợp lệ. Vui lòng thanh toán 40.000 VND/tháng.',
        availableSlots,
      );
    }

    if (availableSlots <= 0) {
      return this.createDecision('denied', 'Bãi xe đang hết chỗ trống.', availableSlots);
    }

    const session = await this.prisma.parkingSession.create({
      data: {
        vehicleId: vehicle.id,
        gateId: dto.gateId,
        recognizedEntryPlate: recognizedPlate,
        entryTime: new Date(dto.capturedAt),
      },
    });

    return {
      action: 'entry_allowed',
      message: 'Xe hợp lệ. Mở barrier cho xe vào.',
      availableSlots,
      sessionId: session.id,
    };
  }

  async recordTelemetry(dto: TelemetryDto) {
    const activeSlotNumbers = getActiveParkingSlotNumbers(dto.gateId);
    const slotStates = this.normalizeSlots(dto.gateId, dto.slotBitmap, dto.slots);
    const reportedAt = dto.reportedAt ? new Date(dto.reportedAt) : new Date();
    const slotBitmap = this.buildSlotBitmap(slotStates);

    const snapshot = await this.prisma.telemetrySnapshot.create({
      data: {
        gateId: dto.gateId,
        deviceIp: dto.deviceIp || null,
        slotBitmap,
        slots: slotStates,
        temperature: this.normalizeNumber(dto.temperature),
        humidity: this.normalizeNumber(dto.humidity),
        rainDetected: Boolean(dto.rainDetected),
        fireDetected: Boolean(dto.fireDetected),
        reportedAt,
      },
    });

    await Promise.all(
      [
        this.prisma.parkingSlot.deleteMany({
          where: {
            gateId: dto.gateId,
            slotNumber: { notIn: activeSlotNumbers },
          },
        }),
        ...slotStates.map((slot) =>
          this.prisma.parkingSlot.upsert({
            where: {
              gateId_slotNumber: {
                gateId: dto.gateId,
                slotNumber: slot.slotNumber,
              },
            },
            update: {
              zone: slot.zone,
              isOccupied: slot.isOccupied,
              vehiclePlate: slot.vehiclePlate,
              lastUpdated: reportedAt,
            },
            create: {
              gateId: dto.gateId,
              zone: slot.zone,
              slotNumber: slot.slotNumber,
              isOccupied: slot.isOccupied,
              vehiclePlate: slot.vehiclePlate,
              lastUpdated: reportedAt,
            },
          }),
        ),
      ],
    );

    const parkingStatus = await this.parkingService.getStatus(dto.gateId);
    this.parkingRealtimeGateway.publishTelemetrySnapshot(dto.gateId, snapshot);
    this.parkingRealtimeGateway.publishParkingStatus(dto.gateId, parkingStatus);

    return snapshot;
  }

  async getLatestTelemetry(gateId?: string) {
    const resolvedGateId = normalizeGateId(gateId);
    const snapshot = await this.prisma.telemetrySnapshot.findFirst({
      where: resolvedGateId ? { gateId: resolvedGateId } : undefined,
      orderBy: { reportedAt: 'desc' },
    });

    if (!snapshot) {
      throw new NotFoundException('Chưa có dữ liệu telemetry');
    }

    return snapshot;
  }

  async createFireAlert(dto: FireAlertDto) {
    const reportedAt = new Date(dto.reportedAt);
    const gateId = normalizeGateId(dto.gateId) ?? dto.gateId;

    let telemetrySnapshot = await this.prisma.telemetrySnapshot.findFirst({
      where: {
        gateId,
        reportedAt,
      },
      orderBy: { reportedAt: 'desc' },
    });

    if (!telemetrySnapshot && dto.telemetrySnapshot) {
      const snapshotInput = this.coerceTelemetrySnapshot(
        gateId,
        dto.reportedAt,
        dto.telemetrySnapshot,
      );
      telemetrySnapshot = await this.recordTelemetry(snapshotInput);
    }

    const fireAlert = await this.prisma.fireAlert.create({
      data: {
        gateId,
        telemetrySnapshotId: telemetrySnapshot?.id ?? null,
        message: dto.message?.trim() || DEFAULT_FIRE_ALERT_MESSAGE,
        reportedAt,
      },
    });

    await this.notificationsService.createSystemNotifications(
      'Cảnh báo cháy bãi xe',
      fireAlert.message,
      'fire_alert',
      {
        gateId: dto.gateId,
        fireAlertId: fireAlert.id,
        telemetrySnapshotId: telemetrySnapshot?.id ?? null,
      },
      [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    );

    return fireAlert;
  }

  async listFireAlerts(page = 1, limit = 20) {
    const safePage = clampInteger(page, 1, 1, 1000);
    const safeLimit = clampInteger(limit, 20, 1, 100);
    const [items, total] = await Promise.all([
      this.prisma.fireAlert.findMany({
        orderBy: { reportedAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        include: { telemetrySnapshot: true },
      }),
      this.prisma.fireAlert.count(),
    ]);

    return {
      items,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  }

  private async countAvailableSlots(gateId: string) {
    return this.prisma.parkingSlot.count({
      where: {
        gateId,
        slotNumber: {
          in: getActiveParkingSlotNumbers(gateId),
        },
        isOccupied: false,
      },
    });
  }

  private createDecision(
    action: 'denied',
    message: string,
    availableSlots: number,
  ) {
    return {
      action,
      message,
      availableSlots,
      sessionId: null,
    };
  }

  private normalizeSlots(
    gateId: string,
    slotBitmap: string | undefined,
    slots: Array<{
      slotNumber: string;
      zone?: string;
      occupied?: boolean;
      isOccupied?: boolean;
    }>,
  ) {
    const activeSlotNumbers = getActiveParkingSlotNumbers(gateId);
    const normalizedBitmap = this.normalizeSlotBitmap(slotBitmap, gateId);
    const slotByNumber = new Map(
      (Array.isArray(slots) ? slots : []).map((slot) => [
        normalizeParkingSlotNumber(slot.slotNumber),
        slot,
      ]),
    );

    return activeSlotNumbers.map((slotNumber, index) => {
      const slot = slotByNumber.get(slotNumber);
      return {
        slotNumber,
        zone: String(slot?.zone || 'Main').trim() || 'Main',
        isOccupied:
          slot != null
            ? Boolean(slot.isOccupied ?? slot.occupied)
            : normalizedBitmap.charAt(index) === '1',
        vehiclePlate: null,
      };
    });
  }

  private buildSlotBitmap(
    slots: Array<{
      isOccupied: boolean;
    }>,
  ) {
    return slots.map((slot) => (slot.isOccupied ? '1' : '0')).join('');
  }

  private normalizeNumber(value: number | undefined) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private normalizeSlotBitmap(slotBitmap: string | undefined, gateId: string) {
    const size = getActiveParkingSlotNumbers(gateId).length;
    const sanitized = String(slotBitmap || '').replace(/[^01]/g, '');

    if (sanitized.length === 0) {
      return getDefaultParkingSlotBitmap(gateId);
    }

    return sanitized.padEnd(size, '0').slice(0, size);
  }

  private coerceTelemetrySnapshot(
    gateId: string,
    reportedAt: string,
    snapshot: FireAlertTelemetrySnapshotDto,
  ): TelemetryDto {
    const slots = Array.isArray(snapshot.slots)
      ? snapshot.slots.map((slot, index) => {
          if (!slot || typeof slot !== 'object') {
            return {
              slotNumber: `A${index + 1}`,
              occupied: false,
            };
          }

          const slotRecord = slot as unknown as Record<string, unknown>;
          return {
            slotNumber: String(slotRecord.slotNumber || `A${index + 1}`),
            zone: String(slotRecord.zone || 'Main'),
            occupied: Boolean(slotRecord.occupied ?? slotRecord.isOccupied),
          };
        })
      : [];

    return {
      gateId,
      deviceIp: typeof snapshot.deviceIp === 'string' ? snapshot.deviceIp : undefined,
      slotBitmap:
        typeof snapshot.slotBitmap === 'string' ? snapshot.slotBitmap : undefined,
      slots,
      temperature:
        typeof snapshot.temperature === 'number' ? snapshot.temperature : undefined,
      humidity: typeof snapshot.humidity === 'number' ? snapshot.humidity : undefined,
      rainDetected: Boolean(snapshot.rainDetected),
      fireDetected: Boolean(snapshot.fireDetected),
      reportedAt,
    };
  }
}
