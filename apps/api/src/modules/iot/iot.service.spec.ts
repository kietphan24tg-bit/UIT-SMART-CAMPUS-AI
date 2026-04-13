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

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        IotService,
        {
          provide: NotificationsService,
          useValue: {
            createSystemNotifications: jest.fn(),
          },
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
              count: jest.fn(),
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
});
