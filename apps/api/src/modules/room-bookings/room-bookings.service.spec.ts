import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';

import { RoomBookingsService } from './room-bookings.service';

describe('RoomBookingsService', () => {
  let service: RoomBookingsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    jest.useFakeTimers();

    const module = await Test.createTestingModule({
      providers: [
        RoomBookingsService,
        {
          provide: PrismaService,
          useValue: {
            timeSlot: { findMany: jest.fn(), findUnique: jest.fn() },
            room: { findMany: jest.fn(), findFirst: jest.fn() },
            roomBooking: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get(RoomBookingsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('createRoomBooking', () => {
    beforeEach(() => {
      jest.setSystemTime(new Date('2026-04-22T10:00:00.000Z'));
    });

    it('should create a room booking with pending status', async () => {
      (prisma.room.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: 'room-1', roomCode: 'B1.02' });
      (prisma.timeSlot.findUnique as jest.Mock).mockResolvedValue({
        id: 'slot-1',
        startTime: '07:30',
        endTime: '08:15',
      });
      (prisma.roomBooking.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.roomBooking.create as jest.Mock).mockResolvedValue({
        id: 'booking-1',
        bookingDate: new Date('2026-04-29T00:00:00.000Z'),
        timeSlotId: 'slot-1',
        title: 'SE346 Team Meeting',
        purpose: 'Hoc nhom',
        attendeeCount: 5,
        contactName: 'Nguyen Van A',
        contactPhone: '0901234567',
        departmentName: 'Khoa Cong nghe phan mem',
        status: 'pending',
        createdAt: new Date('2026-04-23T10:00:00.000Z'),
      });

      const result = await service.createRoomBooking('user-1', {
        roomCode: 'b1.02',
        bookingDate: '2026-04-29',
        timeSlotId: 'slot-1',
        title: 'SE346 Team Meeting',
        purpose: 'Hoc nhom',
        contactName: 'Nguyen Van A',
        attendeeCount: 5,
        contactPhone: '0901234567',
        departmentName: 'Khoa Cong nghe phan mem',
      });

      expect(prisma.roomBooking.create).toHaveBeenCalledWith({
        data: {
          roomId: 'room-1',
          userId: 'user-1',
          bookingDate: new Date('2026-04-29T00:00:00.000Z'),
          timeSlotId: 'slot-1',
          startTime: '07:30',
          endTime: '08:15',
          title: 'SE346 Team Meeting',
          purpose: 'Hoc nhom',
          attendeeCount: 5,
          contactName: 'Nguyen Van A',
          contactPhone: '0901234567',
          departmentName: 'Khoa Cong nghe phan mem',
          status: 'pending',
        },
        select: {
          id: true,
          bookingDate: true,
          timeSlotId: true,
          title: true,
          purpose: true,
          attendeeCount: true,
          contactName: true,
          contactPhone: true,
          departmentName: true,
          status: true,
          createdAt: true,
        },
      });
      expect(result).toEqual({
        id: 'booking-1',
        roomCode: 'B1.02',
        bookingDate: '2026-04-29',
        timeSlotId: 'slot-1',
        title: 'SE346 Team Meeting',
        purpose: 'Hoc nhom',
        attendeeCount: 5,
        contactName: 'Nguyen Van A',
        contactPhone: '0901234567',
        departmentName: 'Khoa Cong nghe phan mem',
        status: 'pending',
        createdAt: '2026-04-23T10:00:00.000Z',
      });
    });

    it('should reject invalid bookingDate format', async () => {
      await expect(
        service.createRoomBooking('user-1', {
          roomCode: 'B1.02',
          bookingDate: '2026-04-24T00:00:00.000Z',
          timeSlotId: 'slot-1',
          purpose: 'Hoc nhom',
          contactName: 'Nguyen Van A',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when room is not found', async () => {
      (prisma.room.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.timeSlot.findUnique as jest.Mock).mockResolvedValue({
        id: 'slot-1',
        startTime: '07:30',
        endTime: '08:15',
      });

      await expect(
        service.createRoomBooking('user-1', {
          roomCode: 'B1.02',
          bookingDate: '2026-04-29',
          timeSlotId: 'slot-1',
          purpose: 'Hoc nhom',
          contactName: 'Nguyen Van A',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject when time slot is not found', async () => {
      (prisma.room.findFirst as jest.Mock).mockResolvedValue({
        id: 'room-1',
        roomCode: 'B1.02',
      });
      (prisma.timeSlot.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createRoomBooking('user-1', {
          roomCode: 'B1.02',
          bookingDate: '2026-04-29',
          timeSlotId: 'slot-1',
          purpose: 'Hoc nhom',
          contactName: 'Nguyen Van A',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject when bookingDate is before the first bookable week', async () => {
      (prisma.room.findFirst as jest.Mock).mockResolvedValue({
        id: 'room-1',
        roomCode: 'B1.02',
      });
      (prisma.timeSlot.findUnique as jest.Mock).mockResolvedValue({
        id: 'slot-1',
        startTime: '07:30',
        endTime: '08:15',
      });

      await expect(
        service.createRoomBooking('user-1', {
          roomCode: 'B1.02',
          bookingDate: '2026-04-24',
          timeSlotId: 'slot-1',
          purpose: 'Hoc nhom',
          contactName: 'Nguyen Van A',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when the room slot already has a booking', async () => {
      (prisma.room.findFirst as jest.Mock).mockResolvedValue({
        id: 'room-1',
        roomCode: 'B1.02',
      });
      (prisma.timeSlot.findUnique as jest.Mock).mockResolvedValue({
        id: 'slot-1',
        startTime: '07:30',
        endTime: '08:15',
      });
      (prisma.roomBooking.findFirst as jest.Mock).mockResolvedValue({ id: 'booking-1' });

      await expect(
        service.createRoomBooking('user-1', {
          roomCode: 'B1.02',
          bookingDate: '2026-04-29',
          timeSlotId: 'slot-1',
          purpose: 'Hoc nhom',
          contactName: 'Nguyen Van A',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  it('should return rooms in a building sorted by natural room code order', async () => {
    jest.setSystemTime(new Date('2026-04-22T01:00:00.000Z'));
    (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
      { id: 'slot-1', slotNumber: 1, startTime: '07:30', endTime: '08:15' },
      { id: 'slot-2', slotNumber: 2, startTime: '08:15', endTime: '09:00' },
    ]);
    (prisma.room.findMany as jest.Mock).mockResolvedValue([
      { roomCode: 'B1.10', capacity: 70, roomBookings: [] },
      { roomCode: 'B1.02', capacity: 60, roomBookings: [{ id: 'booking-1' }] },
      { roomCode: 'B1.01', capacity: 60, roomBookings: [] },
    ]);

    const result = await service.getBuildingRooms('b');

    expect(prisma.room.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
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
          roomBookings: {
            where: {
              bookingDate: new Date('2026-04-22T00:00:00.000Z'),
              status: { in: ['approved', 'booked', 'maintenance'] },
              timeSlotId: 'slot-1',
            },
            select: { id: true },
          },
        },
      }),
    );
    expect(result).toEqual([
      { roomCode: 'B1.01', capacity: 60, status: 'Trống hiện tại' },
      { roomCode: 'B1.02', capacity: 60, status: 'Đang được sử dụng' },
      { roomCode: 'B1.10', capacity: 70, status: 'Trống hiện tại' },
    ]);
  });

  it('should return available when there is no occupying booking in the current time slot', async () => {
    jest.setSystemTime(new Date('2026-04-22T01:00:00.000Z'));
    (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
      { id: 'slot-1', slotNumber: 1, startTime: '07:30', endTime: '08:15' },
    ]);
    (prisma.room.findMany as jest.Mock).mockResolvedValue([
      { roomCode: 'B1.02', capacity: 60, roomBookings: [] },
    ]);

    const result = await service.getBuildingRooms('B');

    expect(result).toEqual([
      { roomCode: 'B1.02', capacity: 60, status: 'Trống hiện tại' },
    ]);
  });

  it('should query only occupying statuses for the current time slot', async () => {
    jest.setSystemTime(new Date('2026-04-22T01:00:00.000Z'));
    (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
      { id: 'slot-1', slotNumber: 1, startTime: '07:30', endTime: '08:15' },
      { id: 'slot-2', slotNumber: 2, startTime: '08:15', endTime: '09:00' },
    ]);
    (prisma.room.findMany as jest.Mock).mockResolvedValue([
      { roomCode: 'B1.02', capacity: 60, roomBookings: [] },
    ]);

    const result = await service.getBuildingRooms('B');

    expect(prisma.room.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          roomBookings: expect.objectContaining({
            where: expect.objectContaining({
              timeSlotId: 'slot-1',
            }),
          }),
        }),
      }),
    );
    expect(result[0]?.status).toBe('Trống hiện tại');
  });

  it('should return available when a booking has no time slot id', async () => {
    jest.setSystemTime(new Date('2026-04-22T01:00:00.000Z'));
    (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
      { id: 'slot-1', slotNumber: 1, startTime: '07:30', endTime: '08:15' },
    ]);
    (prisma.room.findMany as jest.Mock).mockResolvedValue([
      { roomCode: 'B1.02', capacity: 60, roomBookings: [] },
    ]);

    const result = await service.getBuildingRooms('B');

    expect(result[0]).toEqual({
      roomCode: 'B1.02',
      capacity: 60,
      status: 'Trống hiện tại',
    });
  });

  it('should return available for all rooms when the current time does not match any time slot', async () => {
    jest.setSystemTime(new Date('2026-04-22T02:50:00.000Z'));
    (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
      { id: 'slot-1', slotNumber: 1, startTime: '07:30', endTime: '08:15' },
      { id: 'slot-2', slotNumber: 2, startTime: '08:15', endTime: '09:00' },
    ]);
    (prisma.room.findMany as jest.Mock).mockResolvedValue([
      { roomCode: 'B1.02', capacity: 60, roomBookings: [] },
    ]);

    const result = await service.getBuildingRooms('B');

    expect(prisma.room.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          roomCode: true,
          capacity: true,
          roomBookings: false,
        },
      }),
    );
    expect(result).toEqual([
      { roomCode: 'B1.02', capacity: 60, status: 'Trống hiện tại' },
    ]);
  });

  it('should query only active rooms', async () => {
    jest.setSystemTime(new Date('2026-04-22T01:00:00.000Z'));
    (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
      { id: 'slot-1', slotNumber: 1, startTime: '07:30', endTime: '08:15' },
    ]);
    (prisma.room.findMany as jest.Mock).mockResolvedValue([]);

    await service.getBuildingRooms('B');

    expect(prisma.room.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'active',
        }),
      }),
    );
  });

  it('should filter rooms by floor number', async () => {
    jest.setSystemTime(new Date('2026-04-22T01:00:00.000Z'));
    (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
      { id: 'slot-1', slotNumber: 1, startTime: '07:30', endTime: '08:15' },
    ]);
    (prisma.room.findMany as jest.Mock).mockResolvedValue([
      { roomCode: 'B3.10', capacity: 80, roomBookings: [] },
    ]);

    const result = await service.getBuildingRooms('B', { floorNumber: 3 });

    expect(prisma.room.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          floor: expect.objectContaining({
            floorNumber: 3,
          }),
        }),
      }),
    );
    expect(result).toEqual([
      { roomCode: 'B3.10', capacity: 80, status: 'Trống hiện tại' },
    ]);
  });

  it('should filter rooms by minimum capacity', async () => {
    jest.setSystemTime(new Date('2026-04-22T01:00:00.000Z'));
    (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
      { id: 'slot-1', slotNumber: 1, startTime: '07:30', endTime: '08:15' },
    ]);
    (prisma.room.findMany as jest.Mock).mockResolvedValue([
      { roomCode: 'B3.14', capacity: 140, roomBookings: [] },
    ]);

    const result = await service.getBuildingRooms('B', { minCapacity: 80 });

    expect(prisma.room.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          capacity: { gte: 80 },
        }),
      }),
    );
    expect(result).toEqual([
      { roomCode: 'B3.14', capacity: 140, status: 'Trống hiện tại' },
    ]);
  });

  it('should combine floor and minimum capacity filters', async () => {
    jest.setSystemTime(new Date('2026-04-22T01:00:00.000Z'));
    (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
      { id: 'slot-1', slotNumber: 1, startTime: '07:30', endTime: '08:15' },
    ]);
    (prisma.room.findMany as jest.Mock).mockResolvedValue([
      { roomCode: 'B3.14', capacity: 140, roomBookings: [] },
    ]);

    const result = await service.getBuildingRooms('B', {
      floorNumber: 3,
      minCapacity: 80,
    });

    expect(prisma.room.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'active',
          floor: {
            building: {
              code: 'B',
            },
            floorNumber: 3,
          },
          capacity: { gte: 80 },
        },
      }),
    );
    expect(result).toEqual([
      { roomCode: 'B3.14', capacity: 140, status: 'Trống hiện tại' },
    ]);
  });
  describe('getRoomSchedule', () => {
    it('should return a fixed Monday-to-Saturday grid with all time slots', async () => {
      jest.setSystemTime(new Date('2026-04-22T01:00:00.000Z'));
      (prisma.room.findFirst as jest.Mock).mockResolvedValue({
        id: 'room-1',
        roomCode: 'B1.02',
        name: null,
        capacity: 60,
      });
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
        { id: 'slot-1', slotNumber: 1, label: 'Tiet 1', startTime: '07:30', endTime: '08:15' },
        { id: 'slot-2', slotNumber: 2, label: 'Tiet 2', startTime: '08:15', endTime: '09:00' },
      ]);
      (prisma.roomBooking.findMany as jest.Mock).mockResolvedValue([
        {
          bookingDate: new Date('2026-04-27T00:00:00.000Z'),
          timeSlotId: 'slot-1',
          title: 'SE346.Q22',
        },
        {
          bookingDate: new Date('2026-04-28T00:00:00.000Z'),
          timeSlotId: 'slot-2',
          title: null,
        },
        {
          bookingDate: new Date('2026-05-10T00:00:00.000Z'),
          timeSlotId: 'slot-1',
          title: 'Outside displayed week',
        },
      ]);

      const result = await service.getRoomSchedule('b1.02');

      expect(prisma.room.findFirst).toHaveBeenCalledWith({
        where: {
          roomCode: 'B1.02',
          status: 'active',
        },
        select: {
          id: true,
          roomCode: true,
          name: true,
          capacity: true,
        },
      });
      expect(prisma.roomBooking.findMany).toHaveBeenCalledWith({
        where: {
          roomId: 'room-1',
          bookingDate: {
            gte: new Date('2026-04-27T00:00:00.000Z'),
            lte: new Date('2026-05-02T00:00:00.000Z'),
          },
          status: { in: ['approved', 'booked', 'maintenance'] },
          timeSlotId: { not: null },
        },
        select: {
          bookingDate: true,
          timeSlotId: true,
          title: true,
        },
        orderBy: { bookingDate: 'desc' },
      });
      expect(result).toMatchObject({
        roomCode: 'B1.02',
        capacity: 60,
        name: null,
        weekStart: '2026-04-27',
      });
      expect(result.days).toHaveLength(6);
      expect(result.days.map((day) => day.dayOfWeek)).toEqual([2, 3, 4, 5, 6, 7]);
      expect(result.days[0]?.slots).toEqual([
        {
          timeSlotId: 'slot-1',
          slotNumber: 1,
          label: 'Tiet 1',
          startTime: '07:30',
          endTime: '08:15',
          bookingTitle: 'SE346.Q22',
          displayText: 'SE346.Q22',
        },
        {
          timeSlotId: 'slot-2',
          slotNumber: 2,
          label: 'Tiet 2',
          startTime: '08:15',
          endTime: '09:00',
          bookingTitle: null,
          displayText: 'Trống',
        },
      ]);
      expect(result.days[1]?.slots[1]).toEqual({
        timeSlotId: 'slot-2',
        slotNumber: 2,
        label: 'Tiet 2',
        startTime: '08:15',
        endTime: '09:00',
        bookingTitle: null,
        displayText: 'Trống',
      });
    });

    it('should ignore bookings outside the loaded bookable week', async () => {
      jest.setSystemTime(new Date('2026-04-22T01:00:00.000Z'));
      (prisma.room.findFirst as jest.Mock).mockResolvedValue({
        id: 'room-1',
        roomCode: 'B1.02',
        name: 'Phong hoc',
        capacity: 60,
      });
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
        { id: 'slot-1', slotNumber: 1, label: 'Tiet 1', startTime: '07:30', endTime: '08:15' },
      ]);
      (prisma.roomBooking.findMany as jest.Mock).mockResolvedValue([
        {
          bookingDate: new Date('2026-04-27T00:00:00.000Z'),
          timeSlotId: 'slot-1',
          title: 'First bookable Monday',
        },
        {
          bookingDate: new Date('2026-05-04T00:00:00.000Z'),
          timeSlotId: 'slot-1',
          title: 'Following week Monday',
        },
      ]);

      const result = await service.getRoomSchedule('B1.02');

      expect(prisma.roomBooking.findMany).toHaveBeenCalledWith({
        where: {
          roomId: 'room-1',
          bookingDate: {
            gte: new Date('2026-04-27T00:00:00.000Z'),
            lte: new Date('2026-05-02T00:00:00.000Z'),
          },
          status: { in: ['approved', 'booked', 'maintenance'] },
          timeSlotId: { not: null },
        },
        select: {
          bookingDate: true,
          timeSlotId: true,
          title: true,
        },
        orderBy: { bookingDate: 'desc' },
      });
      expect(result.days[0]?.slots[0]).toMatchObject({
        bookingTitle: 'First bookable Monday',
        displayText: 'First bookable Monday',
      });
    });

    it('should throw NotFoundException when room does not exist', async () => {
      (prisma.room.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getRoomSchedule('missing-room')).rejects.toThrow(NotFoundException);
    });
  });
});
