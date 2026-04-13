import { Test } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';

import { ParkingService } from './parking.service';

describe('ParkingService', () => {
  let service: ParkingService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ParkingService,
        {
          provide: PrismaService,
          useValue: {
            parkingSlot: {
              findMany: jest.fn(),
            },
            telemetrySnapshot: {
              findFirst: jest.fn(),
            },
            parkingSession: {
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(ParkingService);
    prisma = module.get(PrismaService);
  });

  it('returns status using only the active A1-A2 slot layout', async () => {
    (prisma.parkingSlot.findMany as jest.Mock).mockResolvedValue([
      {
        slotNumber: 'A1',
        zone: 'Main',
        isOccupied: false,
        vehiclePlate: null,
        lastUpdated: new Date('2026-04-14T10:00:00.000Z'),
      },
      {
        slotNumber: 'A2',
        zone: 'Main',
        isOccupied: true,
        vehiclePlate: '51F44614',
        lastUpdated: new Date('2026-04-14T10:00:00.000Z'),
      },
    ]);
    (prisma.telemetrySnapshot.findFirst as jest.Mock).mockResolvedValue({
      reportedAt: new Date('2026-04-14T10:00:00.000Z'),
      temperature: 30,
      humidity: 70,
      rainDetected: false,
      fireDetected: false,
      deviceIp: '192.168.1.10',
    });
    (prisma.parkingSession.count as jest.Mock).mockResolvedValue(1);

    const result = await service.getStatus('uit-gate-a');

    expect(prisma.parkingSlot.findMany).toHaveBeenCalledWith({
      where: {
        gateId: 'uit-gate-a',
        slotNumber: { in: ['A1', 'A2'] },
      },
    });
    expect(result.totalSlots).toBe(2);
    expect(result.availableSlots).toBe(1);
    expect(result.occupiedSlots).toBe(1);
    expect(result.slots.map((slot) => slot.slotNumber)).toEqual(['A1', 'A2']);
  });
});
