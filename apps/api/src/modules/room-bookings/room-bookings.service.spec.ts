import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { RoomBookingsService } from './room-bookings.service';

const slot1 = {
  id: 'slot-1',
  slotNumber: 1,
  label: 'Tiết 1',
  startTime: '07:30',
  endTime: '08:15',
};

const slot2 = {
  id: 'slot-2',
  slotNumber: 2,
  label: 'Tiết 2',
  startTime: '08:15',
  endTime: '09:00',
};

const slot4 = {
  id: 'slot-4',
  slotNumber: 4,
  label: 'Tiết 4',
  startTime: '10:00',
  endTime: '10:45',
};

describe('RoomBookingsService', () => {
  let service: RoomBookingsService;
  let prisma: {
    timeSlot: {
      findMany: jest.Mock;
    };
    room: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
    };
    roomBooking: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    roomBookingSlot: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
    };
    building: {
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    jest.useFakeTimers();

    prisma = {
      timeSlot: {
        findMany: jest.fn(),
      },
      room: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      roomBooking: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      roomBookingSlot: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      building: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    service = new RoomBookingsService(prisma as never);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('createRoomBooking', () => {
    beforeEach(() => {
      jest.setSystemTime(new Date('2026-04-22T10:00:00.000Z'));
    });

    it('creates a multi-slot booking and returns the mapped booking payload', async () => {
      const tx = {
        roomBooking: {
          create: jest.fn().mockResolvedValue({ id: 'booking-1' }),
        },
        roomBookingSlot: {
          create: jest.fn().mockResolvedValue(undefined),
        },
      };
      const expectedBooking = {
        id: 'booking-1',
        roomCode: 'B1.02',
        roomName: null,
        buildingCode: 'B',
        buildingName: 'Tòa B',
        bookingDate: '2026-04-29',
        timeSlotIds: ['slot-1', 'slot-2'],
        timeSlots: [slot1, slot2],
        slotCount: 2,
        startTime: '07:30',
        endTime: '09:00',
        title: 'SE346 Team Meeting',
        purpose: 'Học nhóm',
        attendeeCount: 5,
        contactName: 'Nguyen Van A',
        contactPhone: '0901234567',
        departmentName: 'Khoa Công nghệ phần mềm',
        notes: null,
        approvedAt: null,
        status: 'pending',
        createdAt: '2026-04-23T10:00:00.000Z',
      };

      prisma.room.findFirst.mockResolvedValue({ id: 'room-1', roomCode: 'B1.02' });
      prisma.timeSlot.findMany.mockResolvedValue([slot1, slot2]);
      prisma.roomBookingSlot.findFirst.mockResolvedValue(null);
      prisma.$transaction.mockImplementation(async (callback: (client: typeof tx) => Promise<unknown>) =>
        callback(tx),
      );
      jest
        .spyOn(service as never, 'getBookingById' as never)
        .mockResolvedValue(expectedBooking);

      const result = await service.createRoomBooking('user-1', {
        roomCode: 'b1.02',
        bookingDate: '2026-04-29',
        timeSlotIds: ['slot-1', 'slot-2'],
        title: 'SE346 Team Meeting',
        purpose: 'Học nhóm',
        contactName: 'Nguyen Van A',
        attendeeCount: 5,
        contactPhone: '0901234567',
        departmentName: 'Khoa Công nghệ phần mềm',
      });

      expect(tx.roomBooking.create).toHaveBeenCalledWith({
        data: {
          roomId: 'room-1',
          userId: 'user-1',
          bookingDate: new Date('2026-04-29T00:00:00.000Z'),
          timeSlotId: 'slot-1',
          startTime: '07:30',
          endTime: '09:00',
          title: 'SE346 Team Meeting',
          purpose: 'Học nhóm',
          attendeeCount: 5,
          contactName: 'Nguyen Van A',
          contactPhone: '0901234567',
          departmentName: 'Khoa Công nghệ phần mềm',
          status: 'pending',
        },
        select: { id: true },
      });
      expect(tx.roomBookingSlot.create).toHaveBeenNthCalledWith(1, {
        data: {
          bookingId: 'booking-1',
          roomId: 'room-1',
          bookingDate: new Date('2026-04-29T00:00:00.000Z'),
          timeSlotId: 'slot-1',
          slotOrder: 1,
        },
      });
      expect(tx.roomBookingSlot.create).toHaveBeenNthCalledWith(2, {
        data: {
          bookingId: 'booking-1',
          roomId: 'room-1',
          bookingDate: new Date('2026-04-29T00:00:00.000Z'),
          timeSlotId: 'slot-2',
          slotOrder: 2,
        },
      });
      expect(result).toEqual(expectedBooking);
    });

    it('rejects invalid bookingDate format', async () => {
      await expect(
        service.createRoomBooking('user-1', {
          roomCode: 'B1.02',
          bookingDate: '2026-04-24T00:00:00.000Z',
          timeSlotIds: ['slot-1'],
          purpose: 'Học nhóm',
          contactName: 'Nguyen Van A',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects booking dates before the first bookable week', async () => {
      prisma.room.findFirst.mockResolvedValue({ id: 'room-1', roomCode: 'B1.02' });
      prisma.timeSlot.findMany.mockResolvedValue([slot1]);

      await expect(
        service.createRoomBooking('user-1', {
          roomCode: 'B1.02',
          bookingDate: '2026-04-24',
          timeSlotIds: ['slot-1'],
          purpose: 'Học nhóm',
          contactName: 'Nguyen Van A',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects time slots submitted out of order', async () => {
      prisma.room.findFirst.mockResolvedValue({ id: 'room-1', roomCode: 'B1.02' });
      prisma.timeSlot.findMany.mockResolvedValue([slot1, slot2]);

      await expect(
        service.createRoomBooking('user-1', {
          roomCode: 'B1.02',
          bookingDate: '2026-04-29',
          timeSlotIds: ['slot-2', 'slot-1'],
          purpose: 'Học nhóm',
          contactName: 'Nguyen Van A',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects non-contiguous time slots', async () => {
      prisma.room.findFirst.mockResolvedValue({ id: 'room-1', roomCode: 'B1.02' });
      prisma.timeSlot.findMany.mockResolvedValue([slot1, slot4]);

      await expect(
        service.createRoomBooking('user-1', {
          roomCode: 'B1.02',
          bookingDate: '2026-04-29',
          timeSlotIds: ['slot-1', 'slot-4'],
          purpose: 'Học nhóm',
          contactName: 'Nguyen Van A',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when one of the selected slots is already booked', async () => {
      prisma.room.findFirst.mockResolvedValue({ id: 'room-1', roomCode: 'B1.02' });
      prisma.timeSlot.findMany.mockResolvedValue([slot1, slot2]);
      prisma.roomBookingSlot.findFirst.mockResolvedValue({
        timeSlot: { label: 'Tiết 2' },
      });

      await expect(
        service.createRoomBooking('user-1', {
          roomCode: 'B1.02',
          bookingDate: '2026-04-29',
          timeSlotIds: ['slot-1', 'slot-2'],
          purpose: 'Học nhóm',
          contactName: 'Nguyen Van A',
        }),
      ).rejects.toThrow(new ConflictException('Khung giờ Tiết 2 đã có yêu cầu đặt phòng.'));
    });

    it('maps unique-constraint races to ConflictException', async () => {
      const tx = {
        roomBooking: {
          create: jest.fn().mockResolvedValue({ id: 'booking-1' }),
        },
        roomBookingSlot: {
          create: jest.fn(),
        },
      };

      prisma.room.findFirst.mockResolvedValue({ id: 'room-1', roomCode: 'B1.02' });
      prisma.timeSlot.findMany.mockResolvedValue([slot1, slot2]);
      prisma.roomBookingSlot.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          timeSlot: { label: 'Tiết 1' },
        });
      prisma.$transaction.mockImplementation(async (callback: (client: typeof tx) => Promise<unknown>) => {
        await callback(tx);
        throw { code: 'P2002' };
      });

      await expect(
        service.createRoomBooking('user-1', {
          roomCode: 'B1.02',
          bookingDate: '2026-04-29',
          timeSlotIds: ['slot-1', 'slot-2'],
          purpose: 'Học nhóm',
          contactName: 'Nguyen Van A',
        }),
      ).rejects.toThrow(new ConflictException('Khung giờ Tiết 1 đã có yêu cầu đặt phòng.'));
    });
  });

  describe('getBuildingRooms', () => {
    it('uses roomBookingSlots for the current time slot and sorts room codes naturally', async () => {
      jest.setSystemTime(new Date('2026-04-22T01:00:00.000Z'));
      prisma.timeSlot.findMany.mockResolvedValue([slot1, slot2]);
      prisma.room.findMany.mockResolvedValue([
        { roomCode: 'B1.10', capacity: 70, roomBookingSlots: [] },
        { roomCode: 'B1.02', capacity: 60, roomBookingSlots: [{ id: 'booking-slot-1' }] },
        { roomCode: 'B1.01', capacity: 60, roomBookingSlots: [] },
      ]);

      const result = await service.getBuildingRooms('b');

      expect(prisma.room.findMany).toHaveBeenCalledWith({
        where: {
          status: 'active',
          floor: {
            building: {
              code: 'B',
            },
          },
        },
        select: {
          roomCode: true,
          capacity: true,
          roomBookingSlots: {
            where: {
              bookingDate: new Date('2026-04-22T00:00:00.000Z'),
              timeSlotId: 'slot-1',
              booking: {
                status: { in: ['approved', 'booked', 'maintenance'] },
              },
            },
            select: { id: true },
          },
        },
      });
      expect(result).toEqual([
        { roomCode: 'B1.01', capacity: 60, status: 'Trống hiện tại' },
        { roomCode: 'B1.02', capacity: 60, status: 'Đang được sử dụng' },
        { roomCode: 'B1.10', capacity: 70, status: 'Trống hiện tại' },
      ]);
    });
  });

  describe('getRoomSchedule', () => {
    it('returns schedule data with weekStart and building fields', async () => {
      jest.setSystemTime(new Date('2026-04-22T01:00:00.000Z'));
      prisma.room.findFirst.mockResolvedValue({
        id: 'room-1',
        roomCode: 'B1.02',
        name: null,
        capacity: 60,
        floor: {
          building: {
            code: 'B',
            name: 'Tòa B',
          },
        },
      });
      prisma.timeSlot.findMany.mockResolvedValue([slot1, slot2]);
      prisma.roomBookingSlot.findMany.mockResolvedValue([
        {
          bookingDate: new Date('2026-05-04T00:00:00.000Z'),
          timeSlotId: 'slot-1',
          booking: {
            title: 'SE346.Q22',
          },
        },
        {
          bookingDate: new Date('2026-05-05T00:00:00.000Z'),
          timeSlotId: 'slot-2',
          booking: {
            title: null,
          },
        },
      ]);

      const result = await service.getRoomSchedule('b1.02', '2026-05-04');

      expect(prisma.roomBookingSlot.findMany).toHaveBeenCalledWith({
        where: {
          roomId: 'room-1',
          bookingDate: {
            gte: new Date('2026-05-04T00:00:00.000Z'),
            lte: new Date('2026-05-09T00:00:00.000Z'),
          },
          booking: {
            status: { in: ['approved', 'booked', 'maintenance'] },
          },
        },
        select: {
          bookingDate: true,
          timeSlotId: true,
          booking: {
            select: {
              title: true,
            },
          },
        },
      });
      expect(result).toMatchObject({
        roomCode: 'B1.02',
        capacity: 60,
        name: null,
        buildingCode: 'B',
        buildingName: 'Tòa B',
        weekStart: '2026-05-04',
      });
      expect(result.days[0]?.slots[0]).toEqual({
        timeSlotId: 'slot-1',
        slotNumber: 1,
        label: 'Tiết 1',
        startTime: '07:30',
        endTime: '08:15',
        bookingTitle: 'SE346.Q22',
        displayText: 'SE346.Q22',
      });
      expect(result.days[1]?.slots[1]?.displayText).toBe('Trống');
    });

    it('throws NotFoundException when room does not exist', async () => {
      prisma.room.findFirst.mockResolvedValue(null);

      await expect(service.getRoomSchedule('missing-room')).rejects.toThrow(NotFoundException);
    });
  });

  describe('approveBooking', () => {
    it('rechecks all selected slots before approving a booking', async () => {
      prisma.roomBooking.findUnique.mockResolvedValue({
        id: 'booking-1',
        roomId: 'room-1',
        bookingDate: new Date('2026-04-29T00:00:00.000Z'),
        status: 'pending',
        bookingSlots: [{ timeSlotId: 'slot-1' }, { timeSlotId: 'slot-2' }],
      });
      prisma.roomBookingSlot.findFirst.mockResolvedValue(null);
      prisma.roomBooking.update.mockResolvedValue(undefined);
      jest
        .spyOn(service as never, 'getBookingById' as never)
        .mockResolvedValue({ id: 'booking-1', status: 'approved' });

      const result = await service.approveBooking('booking-1', 'admin-1');

      expect(prisma.roomBookingSlot.findFirst).toHaveBeenCalledWith({
        where: {
          bookingId: { not: 'booking-1' },
          roomId: 'room-1',
          bookingDate: new Date('2026-04-29T00:00:00.000Z'),
          timeSlotId: { in: ['slot-1', 'slot-2'] },
          booking: {
            status: {
              in: ['approved', 'booked', 'maintenance'],
            },
          },
        },
        select: {
          timeSlot: {
            select: {
              label: true,
            },
          },
        },
      });
      expect(prisma.roomBooking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: {
          status: 'approved',
          approvedById: 'admin-1',
          approvedAt: expect.any(Date),
        },
      });
      expect(result).toEqual({ id: 'booking-1', status: 'approved' });
    });
  });
});
