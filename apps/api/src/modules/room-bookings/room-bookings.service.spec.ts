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
    jest.setSystemTime(new Date('2026-04-22T01:00:00.000Z'));

    const module = await Test.createTestingModule({
      providers: [
        RoomBookingsService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            building: { findMany: jest.fn() },
            room: { findMany: jest.fn(), findFirst: jest.fn() },
            roomBooking: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            roomBookingSlot: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
            },
            timeSlot: { findMany: jest.fn() },
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

    it('creates a multi-slot booking and returns the normalized response', async () => {
      (prisma.room.findFirst as jest.Mock).mockResolvedValue({ id: 'room-1', roomCode: 'B1.02' });
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([slot1, slot2]);
      (prisma.roomBookingSlot.findFirst as jest.Mock).mockResolvedValue(null);

      const tx = {
        roomBooking: {
          create: jest.fn().mockResolvedValue({ id: 'booking-1' }),
        },
        roomBookingSlot: {
          create: jest.fn().mockResolvedValue(undefined),
        },
      };
      (prisma.$transaction as jest.Mock).mockImplementation(
        async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
      );
      (prisma.roomBooking.findUnique as jest.Mock).mockResolvedValue({
        id: 'booking-1',
        roomId: 'room-1',
        userId: 'user-1',
        bookingDate: new Date('2026-04-24T00:00:00.000Z'),
        timeSlotId: 'slot-1',
        startTime: '07:30',
        endTime: '09:00',
        title: 'SE346 Team Meeting',
        purpose: 'Học nhóm',
        attendeeCount: 5,
        contactName: 'Nguyen Van A',
        contactPhone: '0901234567',
        departmentName: 'Khoa Công nghệ phần mềm',
        notes: null,
        status: 'pending',
        createdAt: new Date('2026-04-23T10:00:00.000Z'),
        updatedAt: new Date('2026-04-23T10:00:00.000Z'),
        approvedAt: null,
        approvedById: null,
        room: {
          roomCode: 'B1.02',
          name: null,
          floor: {
            building: {
              code: 'B',
              name: 'Tòa B',
            },
          },
        },
        timeSlot: slot1,
        approvedBy: null,
        user: null,
        bookingSlots: [
          { id: 'booking-1-slot-1', bookingId: 'booking-1', roomId: 'room-1', bookingDate: new Date('2026-04-24T00:00:00.000Z'), timeSlotId: 'slot-1', slotOrder: 1, createdAt: new Date('2026-04-23T10:00:00.000Z'), timeSlot: slot1 },
          { id: 'booking-1-slot-2', bookingId: 'booking-1', roomId: 'room-1', bookingDate: new Date('2026-04-24T00:00:00.000Z'), timeSlotId: 'slot-2', slotOrder: 2, createdAt: new Date('2026-04-23T10:00:00.000Z'), timeSlot: slot2 },
        ],
      });

      const result = await service.createRoomBooking('user-1', {
        roomCode: 'b1.02',
        bookingDate: '2026-04-24',
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
          bookingDate: new Date('2026-04-24T00:00:00.000Z'),
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
        select: {
          id: true,
        },
      });
      expect(tx.roomBookingSlot.create).toHaveBeenNthCalledWith(1, {
        data: {
          bookingId: 'booking-1',
          roomId: 'room-1',
          bookingDate: new Date('2026-04-24T00:00:00.000Z'),
          timeSlotId: 'slot-1',
          slotOrder: 1,
        },
      });
      expect(tx.roomBookingSlot.create).toHaveBeenNthCalledWith(2, {
        data: {
          bookingId: 'booking-1',
          roomId: 'room-1',
          bookingDate: new Date('2026-04-24T00:00:00.000Z'),
          timeSlotId: 'slot-2',
          slotOrder: 2,
        },
      });
      expect(result).toMatchObject({
        id: 'booking-1',
        roomCode: 'B1.02',
        bookingDate: '2026-04-24',
        timeSlotIds: ['slot-1', 'slot-2'],
        slotCount: 2,
        startTime: '07:30',
        endTime: '09:00',
        status: 'pending',
      });
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
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects selection when slots are not contiguous', async () => {
      (prisma.room.findFirst as jest.Mock).mockResolvedValue({ id: 'room-1', roomCode: 'B1.02' });
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
        slot1,
        {
          id: 'slot-3',
          slotNumber: 3,
          label: 'Tiết 3',
          startTime: '09:00',
          endTime: '09:45',
        },
      ]);

      await expect(
        service.createRoomBooking('user-1', {
          roomCode: 'B1.02',
          bookingDate: '2026-04-24',
          timeSlotIds: ['slot-1', 'slot-3'],
          purpose: 'Học nhóm',
          contactName: 'Nguyen Van A',
        }),
      ).rejects.toThrow('Chỉ được chọn các khung giờ liền kề');
    });

    it('rejects selection when slots are not submitted in ascending order', async () => {
      (prisma.room.findFirst as jest.Mock).mockResolvedValue({ id: 'room-1', roomCode: 'B1.02' });
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([slot1, slot2]);

      await expect(
        service.createRoomBooking('user-1', {
          roomCode: 'B1.02',
          bookingDate: '2026-04-24',
          timeSlotIds: ['slot-2', 'slot-1'],
          purpose: 'Học nhóm',
          contactName: 'Nguyen Van A',
        }),
      ).rejects.toThrow('Các khung giờ phải được gửi theo đúng thứ tự liên tiếp');
    });

    it('rejects when room is not found', async () => {
      (prisma.room.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([slot1]);

      await expect(
        service.createRoomBooking('user-1', {
          roomCode: 'B1.02',
          bookingDate: '2026-04-24',
          timeSlotIds: ['slot-1'],
          purpose: 'Học nhóm',
          contactName: 'Nguyen Van A',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects when one or more slots are missing', async () => {
      (prisma.room.findFirst as jest.Mock).mockResolvedValue({ id: 'room-1', roomCode: 'B1.02' });
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([slot1]);

      await expect(
        service.createRoomBooking('user-1', {
          roomCode: 'B1.02',
          bookingDate: '2026-04-24',
          timeSlotIds: ['slot-1', 'slot-2'],
          purpose: 'Học nhóm',
          contactName: 'Nguyen Van A',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects when any requested slot already has a booking', async () => {
      (prisma.room.findFirst as jest.Mock).mockResolvedValue({ id: 'room-1', roomCode: 'B1.02' });
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([slot1, slot2]);
      (prisma.roomBookingSlot.findFirst as jest.Mock).mockResolvedValue({
        timeSlot: {
          label: 'Tiết 2',
        },
      });

      await expect(
        service.createRoomBooking('user-1', {
          roomCode: 'B1.02',
          bookingDate: '2026-04-24',
          timeSlotIds: ['slot-1', 'slot-2'],
          purpose: 'Học nhóm',
          contactName: 'Nguyen Van A',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('maps unique constraint race to ConflictException when concurrent create collides', async () => {
      (prisma.room.findFirst as jest.Mock).mockResolvedValue({ id: 'room-1', roomCode: 'B1.02' });
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([slot1, slot2]);
      (prisma.roomBookingSlot.findFirst as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          timeSlot: {
            label: 'Tiết 1',
          },
        });
      (prisma.$transaction as jest.Mock).mockRejectedValue({ code: 'P2002' });

      await expect(
        service.createRoomBooking('user-1', {
          roomCode: 'B1.02',
          bookingDate: '2026-04-24',
          timeSlotIds: ['slot-1', 'slot-2'],
          purpose: 'Học nhóm',
          contactName: 'Nguyen Van A',
        }),
      ).rejects.toThrow('Khung giờ Tiết 1 đã có yêu cầu đặt phòng.');
    });
  });

  it('returns rooms in a building sorted by natural room code order', async () => {
    (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
      { id: 'slot-1', slotNumber: 1, startTime: '07:30', endTime: '08:15' },
      { id: 'slot-2', slotNumber: 2, startTime: '08:15', endTime: '09:00' },
    ]);
    (prisma.room.findMany as jest.Mock).mockResolvedValue([
      { roomCode: 'B1.10', capacity: 70, roomBookingSlots: [] },
      { roomCode: 'B1.02', capacity: 60, roomBookingSlots: [{ id: 'booking-slot-1' }] },
      { roomCode: 'B1.01', capacity: 60, roomBookingSlots: [] },
    ]);

    const result = await service.getBuildingRooms('b');

    expect(prisma.room.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
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
      }),
    );
    expect(result).toEqual([
      { roomCode: 'B1.01', capacity: 60, status: 'Trống hiện tại' },
      { roomCode: 'B1.02', capacity: 60, status: 'Đang được sử dụng' },
      { roomCode: 'B1.10', capacity: 70, status: 'Trống hiện tại' },
    ]);
  });

  describe('getRoomSchedule', () => {
    it('returns a fixed Monday-to-Saturday grid with slot occupancy from room_booking_slots', async () => {
      (prisma.room.findFirst as jest.Mock).mockResolvedValue({
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
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
        { id: 'slot-1', slotNumber: 1, label: 'Tiết 1', startTime: '07:30', endTime: '08:15' },
        { id: 'slot-2', slotNumber: 2, label: 'Tiết 2', startTime: '08:15', endTime: '09:00' },
      ]);
      (prisma.roomBookingSlot.findMany as jest.Mock).mockResolvedValue([
        {
          bookingDate: new Date('2026-04-20T00:00:00.000Z'),
          timeSlotId: 'slot-1',
          booking: {
            title: 'SE346.Q22',
          },
        },
        {
          bookingDate: new Date('2026-04-21T00:00:00.000Z'),
          timeSlotId: 'slot-2',
          booking: {
            title: null,
          },
        },
      ]);

      const result = await service.getRoomSchedule('B1.02');

      expect(prisma.roomBookingSlot.findMany).toHaveBeenCalledWith({
        where: {
          roomId: 'room-1',
          bookingDate: {
            gte: new Date('2026-04-20T00:00:00.000Z'),
            lte: new Date('2026-04-25T00:00:00.000Z'),
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
      expect(result.days).toHaveLength(6);
      expect(result.days[0]?.slots[0]).toEqual({
        timeSlotId: 'slot-1',
        slotNumber: 1,
        label: 'Tiết 1',
        startTime: '07:30',
        endTime: '08:15',
        bookingTitle: 'SE346.Q22',
        displayText: 'SE346.Q22',
      });
      expect(result.days[1]?.slots[1]).toEqual({
        timeSlotId: 'slot-2',
        slotNumber: 2,
        label: 'Tiết 2',
        startTime: '08:15',
        endTime: '09:00',
        bookingTitle: null,
        displayText: 'Trống',
      });
    });

    it('throws NotFoundException when room does not exist', async () => {
      (prisma.room.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getRoomSchedule('missing-room')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('approveBooking', () => {
    it('rechecks all selected slots before approving a block booking', async () => {
      const pendingBooking = {
        id: 'booking-1',
        roomId: 'room-1',
        userId: 'user-1',
        bookingDate: new Date('2026-04-24T00:00:00.000Z'),
        timeSlotId: 'slot-1',
        startTime: '07:30',
        endTime: '09:00',
        title: 'SE346 Team Meeting',
        purpose: 'Học nhóm',
        attendeeCount: 5,
        contactName: 'Nguyen Van A',
        contactPhone: '0901234567',
        departmentName: 'Khoa Công nghệ phần mềm',
        notes: null,
        status: 'pending',
        createdAt: new Date('2026-04-23T10:00:00.000Z'),
        updatedAt: new Date('2026-04-23T10:00:00.000Z'),
        approvedAt: null,
        approvedById: null,
        room: {
          roomCode: 'B1.02',
          name: null,
          floor: {
            building: {
              code: 'B',
              name: 'Tòa B',
            },
          },
        },
        timeSlot: {
          id: 'slot-1',
          slotNumber: 1,
          label: 'Tiết 1',
          startTime: '07:30',
          endTime: '08:15',
        },
        approvedBy: null,
        user: null,
        bookingSlots: [
          {
            id: 'booking-slot-1',
            bookingId: 'booking-1',
            roomId: 'room-1',
            bookingDate: new Date('2026-04-24T00:00:00.000Z'),
            timeSlotId: 'slot-1',
            slotOrder: 1,
            createdAt: new Date('2026-04-23T10:00:00.000Z'),
            timeSlot: {
              id: 'slot-1',
              slotNumber: 1,
              label: 'Tiết 1',
              startTime: '07:30',
              endTime: '08:15',
            },
          },
          {
            id: 'booking-slot-2',
            bookingId: 'booking-1',
            roomId: 'room-1',
            bookingDate: new Date('2026-04-24T00:00:00.000Z'),
            timeSlotId: 'slot-2',
            slotOrder: 2,
            createdAt: new Date('2026-04-23T10:00:00.000Z'),
            timeSlot: {
              id: 'slot-2',
              slotNumber: 2,
              label: 'Tiết 2',
              startTime: '08:15',
              endTime: '09:00',
            },
          },
        ],
      };
      const approvedBooking = {
        ...pendingBooking,
        status: 'approved',
        approvedAt: new Date('2026-04-23T10:05:00.000Z'),
        approvedById: 'admin-1',
      };
      (prisma.roomBooking.findUnique as jest.Mock)
        .mockResolvedValueOnce(pendingBooking)
        .mockResolvedValueOnce(approvedBooking);
      (prisma.roomBookingSlot.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.roomBooking.update as jest.Mock).mockResolvedValue(undefined);

      const result = await service.approveBooking('booking-1', 'admin-1');

      expect(prisma.roomBookingSlot.findFirst).toHaveBeenCalledWith({
        where: {
          bookingId: { not: 'booking-1' },
          roomId: 'room-1',
          bookingDate: new Date('2026-04-24T00:00:00.000Z'),
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
      expect(result.status).toBe('approved');
      expect(result.timeSlotIds).toEqual(['slot-1', 'slot-2']);
    });
  });
});
