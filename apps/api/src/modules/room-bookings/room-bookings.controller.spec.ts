import { Test } from '@nestjs/testing';

import { RoomBookingsController } from './room-bookings.controller';
import { RoomBookingsService } from './room-bookings.service';

describe('RoomBookingsController', () => {
  let controller: RoomBookingsController;
  let service: jest.Mocked<RoomBookingsService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [RoomBookingsController],
      providers: [
        {
          provide: RoomBookingsService,
          useValue: {
            createRoomBooking: jest.fn().mockResolvedValue({
              id: 'booking-1',
              roomCode: 'B1.02',
              roomName: null,
              buildingCode: 'B',
              buildingName: 'Tòa B',
              bookingDate: '2026-04-24',
              timeSlotIds: ['slot-1', 'slot-2'],
              timeSlots: [
                {
                  id: 'slot-1',
                  slotNumber: 1,
                  label: 'Tiết 1',
                  startTime: '07:30',
                  endTime: '08:15',
                },
                {
                  id: 'slot-2',
                  slotNumber: 2,
                  label: 'Tiết 2',
                  startTime: '08:15',
                  endTime: '09:00',
                },
              ],
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
            }),
            getRoomSchedule: jest.fn().mockResolvedValue({
              roomCode: 'B1.02',
              buildingCode: 'B',
              buildingName: 'Tòa B',
              capacity: 60,
              name: null,
              weekStart: '2026-04-27',
              days: [],
            }),
            getBuildingRooms: jest.fn().mockResolvedValue([
              {
                roomCode: 'B1.02',
                capacity: 60,
                status: 'Trống hiện tại',
              },
            ]),
          },
        },
      ],
    }).compile();

    controller = module.get(RoomBookingsController);
    service = module.get(RoomBookingsService);
  });

  it('should create a room booking with pending status', async () => {
    const dto = {
      roomCode: 'B1.02',
      bookingDate: '2026-04-24',
      timeSlotIds: ['slot-1', 'slot-2'],
      title: 'SE346 Team Meeting',
      purpose: 'Học nhóm',
      contactName: 'Nguyen Van A',
      attendeeCount: 5,
      contactPhone: '0901234567',
      departmentName: 'Khoa Công nghệ phần mềm',
      status: 'booked',
    };

    const result = await controller.createRoomBooking('user-1', dto as never);

    expect(service.createRoomBooking).toHaveBeenCalledWith('user-1', dto);
    expect(result).toMatchObject({
      id: 'booking-1',
      roomCode: 'B1.02',
      timeSlotIds: ['slot-1', 'slot-2'],
      status: 'pending',
    });
  });

  it('should return the fixed weekly schedule for a room', async () => {
    const result = await controller.getRoomSchedule('B1.02', undefined);

    expect(service.getRoomSchedule).toHaveBeenCalledWith('B1.02', undefined);
    expect(result).toEqual({
      roomCode: 'B1.02',
      buildingCode: 'B',
      buildingName: 'Tòa B',
      capacity: 60,
      name: null,
      weekStart: '2026-04-27',
      days: [],
    });
  });

  it('should return rooms for the requested building code', async () => {
    const result = await controller.getBuildingRooms('B');

    expect(service.getBuildingRooms).toHaveBeenCalledWith('B', {
      floorNumber: undefined,
      minCapacity: undefined,
    });
    expect(result).toEqual([
      {
        roomCode: 'B1.02',
        capacity: 60,
        status: 'Trống hiện tại',
      },
    ]);
  });

  it('should parse and forward floor and capacity filters', async () => {
    await controller.getBuildingRooms('B', '3', '80');

    expect(service.getBuildingRooms).toHaveBeenCalledWith('B', {
      floorNumber: 3,
      minCapacity: 80,
    });
  });

  it('should ignore invalid filter values', async () => {
    await controller.getBuildingRooms('B', 'abc', '0');

    expect(service.getBuildingRooms).toHaveBeenCalledWith('B', {
      floorNumber: undefined,
      minCapacity: undefined,
    });
  });
});
