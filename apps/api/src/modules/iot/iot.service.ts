import { Injectable, NotFoundException } from '@nestjs/common';
import { USER_ROLES } from '@smart-campus/shared';

import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

import type { FireAlertDto } from './dto/fire-alert.dto';
import type { IotScanDto } from './dto/iot-scan.dto';
import type { TelemetryDto } from './dto/telemetry.dto';

const DEFAULT_FIRE_ALERT_MESSAGE = 'Cam bien lua da kich hoat tai bai xe UIT Campus.';

function normalizePlate(value: string) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function normalizeRfid(value: string) {
  return String(value || '').trim().toUpperCase();
}

@Injectable()
export class IotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async processParkingScan(dto: IotScanDto) {
    const rfidTag = normalizeRfid(dto.rfidTag);
    const recognizedPlate = normalizePlate(dto.recognizedPlate);
    const availableSlots = await this.countAvailableSlots(dto.gateId);

    if (!recognizedPlate) {
      return this.createDecision('denied', 'Khong nhan dien duoc bien so hop le.', availableSlots);
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { rfidTag },
      include: { subscription: true },
    });

    if (!vehicle || !vehicle.isActive) {
      return this.createDecision(
        'denied',
        'RFID chua duoc dang ky tren app UIT Campus.',
        availableSlots,
      );
    }

    if (normalizePlate(vehicle.plateNumber) !== recognizedPlate) {
      return this.createDecision(
        'denied',
        'Bien so khong khop voi xe da dang ky.',
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
        message: 'Bien so hop le. Mo barrier cho xe ra.',
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
        'Goi gui xe thang chua hop le. Vui long thanh toan 40.000 VND/thang.',
        availableSlots,
      );
    }

    if (availableSlots <= 0) {
      return this.createDecision('denied', 'Bai xe dang het cho trong.', availableSlots);
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
      message: 'Xe hop le. Mo barrier cho xe vao.',
      availableSlots,
      sessionId: session.id,
    };
  }

  async recordTelemetry(dto: TelemetryDto) {
    const slotStates = this.normalizeSlots(dto.slotBitmap, dto.slots);
    const reportedAt = dto.reportedAt ? new Date(dto.reportedAt) : new Date();

    const snapshot = await this.prisma.telemetrySnapshot.create({
      data: {
        gateId: dto.gateId,
        deviceIp: dto.deviceIp || null,
        slotBitmap: dto.slotBitmap || this.buildSlotBitmap(slotStates),
        slots: slotStates,
        temperature: this.normalizeNumber(dto.temperature),
        humidity: this.normalizeNumber(dto.humidity),
        rainDetected: Boolean(dto.rainDetected),
        fireDetected: Boolean(dto.fireDetected),
        reportedAt,
      },
    });

    await Promise.all(
      slotStates.map((slot) =>
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
    );

    return snapshot;
  }

  async getLatestTelemetry(gateId?: string) {
    const snapshot = await this.prisma.telemetrySnapshot.findFirst({
      where: gateId ? { gateId } : undefined,
      orderBy: { reportedAt: 'desc' },
    });

    if (!snapshot) {
      throw new NotFoundException('Chua co du lieu telemetry');
    }

    return snapshot;
  }

  async createFireAlert(dto: FireAlertDto) {
    const reportedAt = new Date(dto.reportedAt);

    let telemetrySnapshot = await this.prisma.telemetrySnapshot.findFirst({
      where: {
        gateId: dto.gateId,
        reportedAt,
      },
      orderBy: { reportedAt: 'desc' },
    });

    if (!telemetrySnapshot && dto.telemetrySnapshot) {
      const snapshotInput = this.coerceTelemetrySnapshot(
        dto.gateId,
        dto.reportedAt,
        dto.telemetrySnapshot,
      );
      telemetrySnapshot = await this.recordTelemetry(snapshotInput);
    }

    const fireAlert = await this.prisma.fireAlert.create({
      data: {
        gateId: dto.gateId,
        telemetrySnapshotId: telemetrySnapshot?.id ?? null,
        message: dto.message?.trim() || DEFAULT_FIRE_ALERT_MESSAGE,
        reportedAt,
      },
    });

    await this.notificationsService.createSystemNotifications(
      'Canh bao chay bai xe',
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
    const [items, total] = await Promise.all([
      this.prisma.fireAlert.findMany({
        orderBy: { reportedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { telemetrySnapshot: true },
      }),
      this.prisma.fireAlert.count(),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  private async countAvailableSlots(gateId: string) {
    return this.prisma.parkingSlot.count({
      where: {
        gateId,
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
    slotBitmap: string | undefined,
    slots: Array<{
      slotNumber: string;
      zone?: string;
      occupied?: boolean;
      isOccupied?: boolean;
    }>,
  ) {
    if (Array.isArray(slots) && slots.length > 0) {
      return slots.map((slot, index) => ({
        slotNumber: String(slot.slotNumber || `A${index + 1}`).trim(),
        zone: String(slot.zone || 'Main').trim(),
        isOccupied: Boolean(slot.isOccupied ?? slot.occupied),
        vehiclePlate: null,
      }));
    }

    return String(slotBitmap || '0000')
      .split('')
      .map((value, index) => ({
        slotNumber: `A${index + 1}`,
        zone: 'Main',
        isOccupied: value === '1',
        vehiclePlate: null,
      }));
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

  private coerceTelemetrySnapshot(
    gateId: string,
    reportedAt: string,
    snapshot: Record<string, unknown>,
  ): TelemetryDto {
    const slots = Array.isArray(snapshot.slots)
      ? snapshot.slots.map((slot, index) => {
          if (!slot || typeof slot !== 'object') {
            return {
              slotNumber: `A${index + 1}`,
              occupied: false,
            };
          }

          const slotRecord = slot as Record<string, unknown>;
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
