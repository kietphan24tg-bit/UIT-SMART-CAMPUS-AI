import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { RoomBookingStatus } from '@prisma/client';
import { USER_ROLES } from '@smart-campus/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

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

  @Get('buildings')
  @ApiOperation({ summary: 'Get building availability summary' })
  @ApiOkResponse({
    description: 'Buildings with availability summary',
  })
  getBuildings() {
    return this.roomBookingsService.getBuildings();
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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get room booking requests of current user' })
  @ApiQuery({ name: 'status', required: false, enum: RoomBookingStatus })
  getMyBookings(
    @CurrentUser('id') userId: string,
    @Query('status') status?: RoomBookingStatus,
  ) {
    return this.roomBookingsService.getMyBookings(userId, status);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get booking queue for admin' })
  @ApiQuery({ name: 'status', required: false, enum: RoomBookingStatus })
  getAdminBookings(@Query('status') status?: RoomBookingStatus) {
    return this.roomBookingsService.getAdminBookings(status);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Room booking id' })
  @ApiOperation({ summary: 'Approve room booking request' })
  approveBooking(@Param('id') bookingId: string, @CurrentUser('id') approverId: string) {
    return this.roomBookingsService.approveBooking(bookingId, approverId);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Room booking id' })
  @ApiOperation({ summary: 'Reject room booking request' })
  rejectBooking(@Param('id') bookingId: string, @CurrentUser('id') approverId: string) {
    return this.roomBookingsService.rejectBooking(bookingId, approverId);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Room booking id' })
  @ApiOperation({ summary: 'Cancel room booking request' })
  cancelBooking(
    @Param('id') bookingId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role?: string,
  ) {
    const isAdmin = role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN;
    return this.roomBookingsService.cancelBooking(bookingId, userId, isAdmin);
  }
}
