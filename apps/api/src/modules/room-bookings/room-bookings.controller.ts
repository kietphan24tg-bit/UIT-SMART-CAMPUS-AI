import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { CreateRoomBookingDto } from './dto/create-room-booking.dto';
import { RoomBookingResponseDto } from './dto/room-booking-response.dto';
import { RoomAvailabilityDto } from './dto/room-list-response.dto';
import { RoomScheduleResponseDto } from './dto/room-schedule-response.dto';
import { RoomBookingsService } from './room-bookings.service';

function parsePositiveInteger(value?: string) {
  const parsedValue = Number.parseInt(String(value || '').trim(), 10);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
}

@ApiTags('Room Bookings')
@Controller('room-bookings')
export class RoomBookingsController {
  constructor(private readonly roomBookingsService: RoomBookingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a room booking request with pending status' })
  @ApiCreatedResponse({
    description: 'Room booking request created successfully.',
    type: RoomBookingResponseDto,
  })
  createRoomBooking(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRoomBookingDto,
  ) {
    return this.roomBookingsService.createRoomBooking(userId, dto);
  }

  @Get('rooms/:roomCode/schedule')
  @ApiOperation({ summary: 'Get the fixed weekly schedule grid for a room from Monday to Saturday' })
  @ApiParam({
    name: 'roomCode',
    description: 'Room code.',
    example: 'B1.02',
  })
  @ApiOkResponse({
    description: 'Fixed room schedule with Monday to Saturday and all time slots.',
    type: RoomScheduleResponseDto,
  })
  getRoomSchedule(@Param('roomCode') roomCode: string) {
    return this.roomBookingsService.getRoomSchedule(roomCode);
  }

  @Get('buildings/:buildingCode/rooms')
  @ApiOperation({ summary: 'Get room availability in a building for the current time slot' })
  @ApiParam({
    name: 'buildingCode',
    description: 'Building code.',
    example: 'B',
  })
  @ApiQuery({
    name: 'floorNumber',
    required: false,
    type: Number,
    description: 'Optional floor number filter.',
    example: 3,
  })
  @ApiQuery({
    name: 'minCapacity',
    required: false,
    type: Number,
    description: 'Optional minimum capacity filter.',
    example: 80,
  })
  @ApiOkResponse({
    description: 'Rooms in the building with their current availability.',
    type: RoomAvailabilityDto,
    isArray: true,
  })
  getBuildingRooms(
    @Param('buildingCode') buildingCode: string,
    @Query('floorNumber') floorNumber?: string,
    @Query('minCapacity') minCapacity?: string,
  ) {
    return this.roomBookingsService.getBuildingRooms(buildingCode, {
      floorNumber: parsePositiveInteger(floorNumber),
      minCapacity: parsePositiveInteger(minCapacity),
    });
  }
}
