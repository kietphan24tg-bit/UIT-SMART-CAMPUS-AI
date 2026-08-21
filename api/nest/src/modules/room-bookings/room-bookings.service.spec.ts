import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { NotificationsService } from '../notifications/notifications.service';

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
      findUnique: jest.Mock;
      findFirst: jest.Mock;
    };
    room: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
    };
    roomBooking: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    roomBookingSlot: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      deleteMany: jest.Mock;
    };
    classMeeting: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
    roomScheduleOverride: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    building: {
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let notificationsService: jest.Mocked<Pick<NotificationsService, 'createNotificationsForClassSection'>>;

  beforeEach(() => {
    jest.useFakeTimers();

    prisma = {
      timeSlot: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      room: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      roomBooking: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      roomBookingSlot: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      classMeeting: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      roomScheduleOverride: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      building: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    prisma.roomScheduleOverride.findFirst.mockResolvedValue(null);
    prisma.roomScheduleOverride.findMany.mockResolvedValue([]);
    notificationsService = {
      createNotificationsForClassSection: jest.fn(),
    };

    service = new RoomBookingsService(prisma as never, notificationsService as never);
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
        .mockResolvedValue(expectedBooking as never);

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
          timeSlotId: null,
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
      prisma.roomBooking.findMany.mockResolvedValue([]);
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
    it('returns schedule data with fixed schedule taking priority over approved bookings', async () => {
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
          bookingId: 'booking-1',
          bookingDate: new Date('2026-05-04T00:00:00.000Z'),
          timeSlotId: 'slot-1',
          booking: {
            title: 'SE346.Q22',
            purpose: 'Học nhóm',
            contactName: 'Nguyen Van A',
          },
        },
        {
          bookingId: 'booking-2',
          bookingDate: new Date('2026-05-05T00:00:00.000Z'),
          timeSlotId: 'slot-2',
          booking: {
            title: null,
            purpose: 'Workshop',
            contactName: 'Tran Thi B',
          },
        },
      ]);
      prisma.classMeeting.findMany.mockResolvedValue([
        {
          dayOfWeek: 2,
          startPeriod: 1,
          endPeriod: 1,
          startTime: '07:30',
          endTime: '08:15',
          classSection: {
            id: 'section-1',
            classCode: 'SE346.Q22',
            course: {
              code: 'SE346',
              name: 'Software Engineering',
            },
            semester: {
              startDate: new Date('2026-01-01T00:00:00.000Z'),
              endDate: new Date('2026-12-31T00:00:00.000Z'),
            },
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
          bookingId: true,
          bookingDate: true,
          timeSlotId: true,
          booking: {
            select: {
              title: true,
              purpose: true,
              contactName: true,
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
      expect(result.days[0]?.slots[0]).toMatchObject({
        timeSlotId: 'slot-1',
        slotNumber: 1,
        label: 'Tiết 1',
        startTime: '07:30',
        endTime: '08:15',
        status: 'occupied',
        source: 'semester',
        title: 'SE346.Q22',
        subtitle: 'Software Engineering',
        bookingId: null,
        classSectionId: 'section-1',
        bookable: false,
      });
      expect(result.days[1]?.slots[1]).toMatchObject({
        status: 'occupied',
        source: 'booking',
        title: 'Tran Thi B',
        subtitle: 'Workshop',
        bookingId: 'booking-2',
        classSectionId: null,
        bookable: false,
      });
    });

    it('throws NotFoundException when room does not exist', async () => {
      prisma.room.findFirst.mockResolvedValue(null);

      await expect(service.getRoomSchedule('missing-room')).rejects.toThrow(NotFoundException);
    });
  });

  describe('approveBooking', () => {
    it('rechecks all selected slots before approving a booking and rejects overlaps', async () => {
      const tx = {
        roomBooking: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'booking-1',
            roomId: 'room-1',
            bookingDate: new Date('2026-04-29T00:00:00.000Z'),
            status: 'pending',
            bookingSlots: [{ timeSlotId: 'slot-1' }, { timeSlotId: 'slot-2' }],
          }),
          findMany: jest.fn().mockResolvedValue([{ id: 'booking-2' }]),
          update: jest.fn().mockResolvedValue(undefined),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        roomBookingSlot: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
        classMeeting: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
        timeSlot: {
          findMany: jest.fn().mockResolvedValue([slot1, slot2]),
        },
        roomScheduleOverride: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };
      prisma.roomBooking.findUnique.mockResolvedValue({
        id: 'booking-1',
        roomId: 'room-1',
        bookingDate: new Date('2026-04-29T00:00:00.000Z'),
        status: 'pending',
        room: {
          roomCode: 'B1.02',
        },
        bookingSlots: [{ timeSlotId: 'slot-1' }, { timeSlotId: 'slot-2' }],
      });
      prisma.$transaction.mockImplementation(async (callback: (client: typeof tx) => Promise<unknown>) =>
        callback(tx),
      );
      jest
        .spyOn(service as never, 'getBookingById' as never)
        .mockResolvedValue({ id: 'booking-1', status: 'approved' } as never);

      const result = await service.approveBooking('booking-1', 'admin-1');

      expect(tx.roomBookingSlot.findFirst).toHaveBeenCalledWith({
        where: {
          roomId: 'room-1',
          bookingDate: new Date('2026-04-29T00:00:00.000Z'),
          timeSlotId: { in: ['slot-1', 'slot-2'] },
          booking: {
            id: { not: 'booking-1' },
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
      expect(tx.roomBooking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: {
          status: 'approved',
          approvedById: 'admin-1',
          approvedAt: expect.any(Date),
          timeSlotId: 'slot-1',
        },
      });
      expect(tx.roomBooking.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['booking-2'],
          },
        },
        data: {
          status: 'rejected',
          approvedById: 'admin-1',
          approvedAt: expect.any(Date),
          notes: 'Slot đã được duyệt cho yêu cầu khác',
        },
      });
      expect(result).toEqual({ id: 'booking-1', status: 'approved' });
    });
  });

  describe('deleteOwnBooking', () => {
    it('deletes the current user booking and its room booking slots', async () => {
      prisma.roomBooking.findUnique.mockResolvedValue({
        id: 'booking-1',
        userId: 'user-1',
      });
      prisma.roomBookingSlot.deleteMany.mockResolvedValue({ count: 2 });
      prisma.roomBooking.delete.mockResolvedValue({ id: 'booking-1' });
      prisma.$transaction.mockImplementation(async (operations: unknown[]) => operations);

      const result = await service.deleteOwnBooking('booking-1', 'user-1');

      expect(prisma.roomBookingSlot.deleteMany).toHaveBeenCalledWith({
        where: { bookingId: 'booking-1' },
      });
      expect(prisma.roomBooking.delete).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
      });
      expect(prisma.$transaction).toHaveBeenCalledWith([
        expect.any(Promise),
        expect.any(Promise),
      ]);
      expect(result).toEqual({ id: 'booking-1', deleted: true });
    });

    it('rejects deleting another user booking', async () => {
      prisma.roomBooking.findUnique.mockResolvedValue({
        id: 'booking-1',
        userId: 'user-2',
      });

      await expect(service.deleteOwnBooking('booking-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.roomBooking.delete).not.toHaveBeenCalled();
    });
  });

  describe('class schedule overrides', () => {
    it('notifies enrolled students when an admin cancels a class meeting occurrence', async () => {
      const meeting = {
        id: 'meeting-1',
        dayOfWeek: 2,
        room: 'B1.02',
        startPeriod: 1,
        endPeriod: 2,
        startTime: '07:30',
        endTime: '09:00',
        classSection: {
          id: 'section-1',
          classCode: 'SE346.Q21',
          course: {
            code: 'SE346',
            name: 'Mobile',
          },
        },
      };
      prisma.classMeeting.findUnique.mockResolvedValue(meeting);
      prisma.timeSlot.findFirst.mockResolvedValue({ id: 'slot-1' });
      prisma.room.findFirst.mockResolvedValue({ id: 'room-1', roomCode: 'B1.02' });
      prisma.roomScheduleOverride.create.mockResolvedValue({
        id: 'override-1',
        roomId: 'room-1',
        overrideDate: new Date('2026-05-04T00:00:00.000Z'),
        timeSlotId: 'slot-1',
        type: 'cancel_class',
        title: 'SE346.Q21',
        note: 'Phòng bảo trì',
        sourceClassMeetingId: 'meeting-1',
        createdById: 'admin-1',
        createdAt: new Date('2026-04-30T00:00:00.000Z'),
        updatedAt: new Date('2026-04-30T00:00:00.000Z'),
      });
      notificationsService.createNotificationsForClassSection.mockResolvedValue({
        count: 2,
      } as never);

      await service.cancelClassMeetingOccurrence(
        'meeting-1',
        { overrideDate: '2026-05-04', note: 'Phòng bảo trì' },
        'admin-1',
      );

      expect(notificationsService.createNotificationsForClassSection).toHaveBeenCalledWith(
        expect.objectContaining({
          classSectionId: 'section-1',
          type: 'schedule_update',
          data: expect.objectContaining({
            classSectionId: 'section-1',
            courseCode: 'SE346',
            courseName: 'Mobile',
            classCode: 'SE346.Q21',
            date: '2026-05-04',
            overrideType: 'cancel_class',
            classMeetingId: 'meeting-1',
          }),
        }),
      );
    });
  });
});
