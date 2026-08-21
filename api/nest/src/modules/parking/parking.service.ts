import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { SubscriptionStatus } from '@prisma/client';
import type {
  ParkingStatus,
  RegisteredVehicle,
} from '@smart-campus/shared';

import { PrismaService } from '../../database/prisma.service';

import type { CreateVehicleDto } from './dto/create-vehicle.dto';
import {
  DEFAULT_PARKING_GATE_ID,
  getActiveParkingSlotNumbers,
} from './parking-slot-layout';
const DEFAULT_MONTHLY_FEE = 40000;

function normalizePlate(value: string) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function normalizeRfid(value: string) {
  return String(value || '').trim().toUpperCase();
}

function resolveGateId(value?: string) {
  const gateId = String(value || '').trim();
  return gateId || DEFAULT_PARKING_GATE_ID;
}

@Injectable()
export class ParkingService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(gateId = DEFAULT_PARKING_GATE_ID): Promise<ParkingStatus> {
    const resolvedGateId = resolveGateId(gateId);
    const activeSlotNumbers = getActiveParkingSlotNumbers(resolvedGateId);
    const [slots, latestTelemetry, activeSessions] = await Promise.all([
      this.prisma.parkingSlot.findMany({
        where: {
          gateId: resolvedGateId,
          slotNumber: { in: activeSlotNumbers },
        },
      }),
      this.prisma.telemetrySnapshot.findFirst({
        where: { gateId: resolvedGateId },
        orderBy: { reportedAt: 'desc' },
      }),
      this.prisma.parkingSession.count({
        where: {
          gateId: resolvedGateId,
          status: 'active',
        },
      }),
    ]);

    const slotByNumber = new Map(slots.map((slot) => [slot.slotNumber, slot]));
    const mappedSlots = activeSlotNumbers.flatMap((slotNumber) => {
      const slot = slotByNumber.get(slotNumber);
      if (!slot) {
        return [];
      }

      return [
        {
          slotNumber: slot.slotNumber,
          zone: slot.zone,
          isOccupied: slot.isOccupied,
          vehiclePlate: slot.vehiclePlate,
          lastUpdated: slot.lastUpdated.toISOString(),
        },
      ];
    });

    const availableSlots = mappedSlots.filter((slot) => !slot.isOccupied).length;

    return {
      gateId: resolvedGateId,
      totalSlots: mappedSlots.length,
      occupiedSlots: mappedSlots.length - availableSlots,
      availableSlots,
      activeSessions,
      lastUpdated:
        latestTelemetry?.reportedAt.toISOString() ??
        mappedSlots.at(-1)?.lastUpdated ??
        null,
      sensors: {
        temperature: latestTelemetry?.temperature ?? null,
        humidity: latestTelemetry?.humidity ?? null,
        rainDetected: latestTelemetry?.rainDetected ?? false,
        fireDetected: latestTelemetry?.fireDetected ?? false,
        deviceIp: latestTelemetry?.deviceIp ?? null,
        reportedAt: latestTelemetry?.reportedAt.toISOString() ?? null,
      },
      slots: mappedSlots,
    };
  }

  async listVehicles(userId: string): Promise<RegisteredVehicle[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { userId },
      include: { subscription: true },
      orderBy: { createdAt: 'desc' },
    });

    return vehicles.map((vehicle) => this.mapVehicle(vehicle));
  }

  async createVehicle(
    userId: string,
    dto: CreateVehicleDto,
  ): Promise<RegisteredVehicle> {
    const plateNumber = normalizePlate(dto.plateNumber);
    const rfidTag = normalizeRfid(dto.rfidTag);

    const duplicateVehicle = await this.prisma.vehicle.findFirst({
      where: {
        OR: [{ plateNumber }, { rfidTag }],
      },
    });

    if (duplicateVehicle) {
      throw new ConflictException(
        duplicateVehicle.plateNumber === plateNumber
          ? 'Biển số đã được đăng ký'
          : 'RFID đã được đăng ký',
      );
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        userId,
        plateNumber,
        rfidTag,
        label: dto.label?.trim() || null,
        subscription: {
          create: {
            monthlyFee: DEFAULT_MONTHLY_FEE,
            status: 'inactive',
          },
        },
      },
      include: { subscription: true },
    });

    return this.mapVehicle(vehicle);
  }

  async getVehicleForUser(userId: string, vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        userId,
      },
      include: { subscription: true },
    });

    if (!vehicle) {
      throw new NotFoundException('Không tìm thấy xe');
    }

    return vehicle;
  }

  private mapVehicle(vehicle: {
    id: string;
    plateNumber: string;
    rfidTag: string;
    label: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    subscription: {
      id: string;
      status: SubscriptionStatus;
      monthlyFee: number;
      startDate: Date | null;
      endDate: Date | null;
      lastPaymentAt: Date | null;
    } | null;
  }): RegisteredVehicle {
    const subscription = vehicle.subscription;
    const resolvedStatus = this.resolveSubscriptionStatus(subscription);

    return {
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      rfidTag: vehicle.rfidTag,
      label: vehicle.label,
      isActive: vehicle.isActive,
      createdAt: vehicle.createdAt.toISOString(),
      updatedAt: vehicle.updatedAt.toISOString(),
      subscription: {
        id: subscription?.id ?? '',
        status: resolvedStatus,
        monthlyFee: subscription?.monthlyFee ?? DEFAULT_MONTHLY_FEE,
        startDate: subscription?.startDate?.toISOString() ?? null,
        endDate: subscription?.endDate?.toISOString() ?? null,
        lastPaymentAt: subscription?.lastPaymentAt?.toISOString() ?? null,
      },
    };
  }

  private resolveSubscriptionStatus(subscription: {
    status: SubscriptionStatus;
    endDate: Date | null;
  } | null): SubscriptionStatus | 'expired' {
    if (!subscription) {
      return 'inactive';
    }

    if (subscription.endDate && subscription.endDate < new Date()) {
      return 'expired';
    }

    return subscription.status;
  }
}
