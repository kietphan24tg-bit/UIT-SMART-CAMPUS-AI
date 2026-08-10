import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ParkingService } from '../parking/parking.service';

import { IotService } from './iot.service';
import { ParkingRealtimeGateway } from './parking-realtime.gateway';

describe('IotService', () => {
  let service: IotService;
  let prisma: jest.Mocked<PrismaService>;
  let realtimeGateway: jest.Mocked<ParkingRealtimeGateway>;
  let notificationsService: {
    createSystemNotifications: jest.Mock;
  };

  beforeEach(async () => {
    notificationsService = {
      createSystemNotifications: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        IotService,
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
        {
          provide: ParkingService,
          useValue: {
            getStatus: jest.fn().mockResolvedValue({
              gateId: 'uit-gate-a',
              totalSlots: 2,
              occupiedSlots: 1,
              availableSlots: 1,
              activeSessions: 0,
              lastUpdated: '2026-04-14T10:00:00.000Z',
              sensors: {
                temperature: 30,
                humidity: 70,
                rainDetected: false,
                fireDetected: false,
                deviceIp: '192.168.1.10',
                reportedAt: '2026-04-14T10:00:00.000Z',
              },
              slots: [],
            }),
          },
        },
        {
          provide: ParkingRealtimeGateway,
          useValue: {
            publishParkingStatus: jest.fn(),
            publishTelemetrySnapshot: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            telemetrySnapshot: {
              create: jest.fn(),
              findFirst: jest.fn(),
            },
            parkingSlot: {
              deleteMany: jest.fn(),
              upsert: jest.fn(),
              count: jest.fn(),
            },
            vehicle: {
              findUnique: jest.fn(),
            },
            parkingSession: {
              findFirst: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
            fireAlert: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              count: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(IotService);
    prisma = module.get(PrismaService);
    realtimeGateway = module.get(ParkingRealtimeGateway);
  });

  it('normalizes telemetry to A1-A2 and removes legacy slots', async () => {
    (prisma.telemetrySnapshot.create as jest.Mock).mockResolvedValue({
      id: 'snapshot-1',
    });
    (prisma.parkingSlot.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });
    (prisma.parkingSlot.upsert as jest.Mock).mockResolvedValue({});

    await service.recordTelemetry({
      gateId: 'uit-gate-a',
      deviceIp: '192.168.1.10',
      slotBitmap: '0101',
      slots: [
        { slotNumber: 'A1', occupied: false },
        { slotNumber: 'A2', occupied: true },
        { slotNumber: 'A3', occupied: false },
        { slotNumber: 'A4', occupied: true },
      ],
      temperature: 30,
      humidity: 70,
      rainDetected: false,
      fireDetected: false,
      reportedAt: '2026-04-14T10:00:00.000Z',
    });

    expect(prisma.telemetrySnapshot.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slotBitmap: '01',
          slots: [
            { slotNumber: 'A1', zone: 'Main', isOccupied: false, vehiclePlate: null },
            { slotNumber: 'A2', zone: 'Main', isOccupied: true, vehiclePlate: null },
          ],
        }),
      }),
    );
    expect(prisma.parkingSlot.deleteMany).toHaveBeenCalledWith({
      where: {
        gateId: 'uit-gate-a',
        slotNumber: { notIn: ['A1', 'A2'] },
      },
    });
    expect(prisma.parkingSlot.upsert).toHaveBeenCalledTimes(2);
    expect(realtimeGateway.publishTelemetrySnapshot).toHaveBeenCalledWith(
      'uit-gate-a',
      expect.objectContaining({
        id: 'snapshot-1',
      }),
    );
    expect(realtimeGateway.publishParkingStatus).toHaveBeenCalledWith(
      'uit-gate-a',
      expect.objectContaining({
        gateId: 'uit-gate-a',
        totalSlots: 2,
      }),
    );
  });

  it('creates a fire alert on MQTT fire edge', async () => {
    const reportedAt = new Date('2026-04-14T10:00:00.000Z');
    (prisma.telemetrySnapshot.findFirst as jest.Mock).mockResolvedValue({
      id: 'snapshot-prev',
      gateId: 'uit-gate-a',
      fireDetected: false,
      reportedAt: new Date('2026-04-14T09:59:00.000Z'),
    });
    (prisma.telemetrySnapshot.create as jest.Mock).mockResolvedValue({
      id: 'snapshot-next',
      gateId: 'uit-gate-a',
      fireDetected: true,
      reportedAt,
    });
    (prisma.parkingSlot.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
    (prisma.parkingSlot.upsert as jest.Mock).mockResolvedValue({});
    (prisma.fireAlert.create as jest.Mock).mockResolvedValue({
      id: 'fire-alert-1',
      gateId: 'uit-gate-a',
      reportedAt,
      message: 'default',
    });

    await service.recordTelemetryFromMqtt({
      gateId: 'uit-gate-a',
      deviceIp: '192.168.1.10',
      slotBitmap: '01',
      slots: [
        { slotNumber: 'A1', occupied: false },
        { slotNumber: 'A2', occupied: true },
      ],
      temperature: 30,
      humidity: 70,
      rainDetected: false,
      fireDetected: true,
      reportedAt: reportedAt.toISOString(),
    });

    expect(prisma.fireAlert.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          gateId: 'uit-gate-a',
          reportedAt,
        }),
      }),
    );
    expect(notificationsService.createSystemNotifications).toHaveBeenCalled();
  });

  it('creates a rain notification only when telemetry transitions from dry to rain', async () => {
    const reportedAt = new Date('2026-04-14T11:00:00.000Z');
    (prisma.telemetrySnapshot.findFirst as jest.Mock).mockResolvedValue({
      id: 'snapshot-prev',
      gateId: 'uit-gate-a',
      fireDetected: false,
      rainDetected: false,
      reportedAt: new Date('2026-04-14T10:59:00.000Z'),
    });
    (prisma.telemetrySnapshot.create as jest.Mock).mockResolvedValue({
      id: 'snapshot-next',
      gateId: 'uit-gate-a',
      fireDetected: false,
      rainDetected: true,
      reportedAt,
    });
    (prisma.parkingSlot.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
    (prisma.parkingSlot.upsert as jest.Mock).mockResolvedValue({});

    await service.recordTelemetry({
      gateId: 'uit-gate-a',
      deviceIp: '192.168.1.10',
      slotBitmap: '01',
      slots: [
        { slotNumber: 'A1', occupied: false },
        { slotNumber: 'A2', occupied: true },
      ],
      temperature: 30,
      humidity: 70,
      rainDetected: true,
      fireDetected: false,
      reportedAt: reportedAt.toISOString(),
    });

    expect(notificationsService.createSystemNotifications).toHaveBeenCalledWith(
      'Cảnh báo thời tiết tại bãi xe',
      'Hệ thống vừa phát hiện mưa tại khu vực bãi xe UIT Campus.',
      'rain_alert',
      {
        gateId: 'uit-gate-a',
        telemetrySnapshotId: 'snapshot-next',
      },
      { scope: 'all' },
    );
  });

  it('does not create duplicate rain notifications while rain state stays true', async () => {
    const reportedAt = new Date('2026-04-14T11:05:00.000Z');
    (prisma.telemetrySnapshot.findFirst as jest.Mock).mockResolvedValue({
      id: 'snapshot-prev',
      gateId: 'uit-gate-a',
      fireDetected: false,
      rainDetected: true,
      reportedAt: new Date('2026-04-14T11:04:00.000Z'),
    });
    (prisma.telemetrySnapshot.create as jest.Mock).mockResolvedValue({
      id: 'snapshot-next',
      gateId: 'uit-gate-a',
      fireDetected: false,
      rainDetected: true,
      reportedAt,
    });
    (prisma.parkingSlot.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
    (prisma.parkingSlot.upsert as jest.Mock).mockResolvedValue({});

    await service.recordTelemetry({
      gateId: 'uit-gate-a',
      deviceIp: '192.168.1.10',
      slotBitmap: '01',
      slots: [
        { slotNumber: 'A1', occupied: false },
        { slotNumber: 'A2', occupied: true },
      ],
      temperature: 30,
      humidity: 70,
      rainDetected: true,
      fireDetected: false,
      reportedAt: reportedAt.toISOString(),
    });

    expect(notificationsService.createSystemNotifications).not.toHaveBeenCalled();
  });

  it('deletes a fire alert without touching telemetry snapshots', async () => {
    (prisma.fireAlert.findUnique as jest.Mock).mockResolvedValue({ id: 'fire-alert-1' });
    (prisma.fireAlert.delete as jest.Mock).mockResolvedValue({ id: 'fire-alert-1' });

    await expect(service.deleteFireAlert('fire-alert-1')).resolves.toEqual({ deleted: true });

    expect(prisma.fireAlert.findUnique).toHaveBeenCalledWith({
      where: { id: 'fire-alert-1' },
      select: { id: true },
    });
    expect(prisma.fireAlert.delete).toHaveBeenCalledWith({
      where: { id: 'fire-alert-1' },
    });
    expect(prisma.telemetrySnapshot.create).not.toHaveBeenCalled();
  });

  it('rejects deleting a missing fire alert', async () => {
    (prisma.fireAlert.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.deleteFireAlert('missing-alert')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.fireAlert.delete).not.toHaveBeenCalled();
  });

  it('deletes all fire alerts through the fireAlert model only', async () => {
    (prisma.fireAlert.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

    await expect(service.deleteFireAlerts()).resolves.toEqual({ count: 3 });

    expect(prisma.fireAlert.deleteMany).toHaveBeenCalledWith();
    expect(prisma.telemetrySnapshot.create).not.toHaveBeenCalled();
  });
});
