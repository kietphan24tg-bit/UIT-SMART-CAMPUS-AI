import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
import {
  ApproveOneRoomBookingDto,
  ClassMeetingOverrideDto,
  CreateRoomScheduleOverrideDto,
  MoveClassMeetingDto,
  RejectRoomBookingSlotDto,
  UpdateRoomScheduleOverrideDto,
} from './dto/admin-room-booking.dto';
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
  @ApiOperation({
    summary:
      'Get the fixed weekly schedule grid for a room from Monday to Saturday (bookable weeks only: from next week onward)',
  })
  @ApiParam({
    name: 'roomCode',
    description: 'Room code.',
    example: 'B1.02',
  })
  @ApiQuery({
    name: 'weekStart',
    required: false,
    description: 'Monday (YYYY-MM-DD) of the week to load. Defaults to the first bookable week.',
    example: '2026-04-27',
  })
  @ApiOkResponse({
    description: 'Fixed room schedule with Monday to Saturday and all time slots.',
    type: RoomScheduleResponseDto,
  })
  getRoomSchedule(
    @Param('roomCode') roomCode: string,
    @Query('weekStart') weekStart?: string,
  ) {
    return this.roomBookingsService.getRoomSchedule(roomCode, weekStart);
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

  @Get('admin/request-rooms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending request summary grouped by room for admin' })
  getAdminRequestRooms(@Query('status') status?: RoomBookingStatus) {
    return this.roomBookingsService.getAdminRequestRooms(status);
  }

  @Get('admin/rooms/:roomCode/request-slots')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'roomCode', description: 'Room code' })
  @ApiOperation({ summary: 'Get pending request slots in one room for admin' })
  getAdminRoomRequestSlots(
    @Param('roomCode') roomCode: string,
    @Query('status') status?: RoomBookingStatus,
  ) {
    return this.roomBookingsService.getAdminRoomRequestSlots(roomCode, status);
  }

  @Get('admin/rooms/:roomCode/request-slots/:date/:timeSlotId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'roomCode', description: 'Room code' })
  @ApiParam({ name: 'date', description: 'Booking date YYYY-MM-DD' })
  @ApiParam({ name: 'timeSlotId', description: 'Time slot id' })
  @ApiOperation({ summary: 'Get booking requests for one room/date/slot' })
  getAdminSlotRequests(
    @Param('roomCode') roomCode: string,
    @Param('date') date: string,
    @Param('timeSlotId') timeSlotId: string,
  ) {
    return this.roomBookingsService.getAdminSlotRequests(roomCode, date, timeSlotId);
  }

  @Patch('admin/request-slots/approve-one')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve one request and reject overlapping pending requests' })
  approveOneBooking(
    @Body() dto: ApproveOneRoomBookingDto,
    @CurrentUser('id') approverId: string,
  ) {
    return this.roomBookingsService.approveBooking(dto.bookingId, approverId);
  }

  @Patch('admin/request-slots/reject-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject all pending requests in a room/date/slot group' })
  rejectSlotRequests(
    @Body() dto: RejectRoomBookingSlotDto,
    @CurrentUser('id') approverId: string,
  ) {
    return this.roomBookingsService.rejectSlotRequests(dto, approverId);
  }

  @Post('admin/schedule-overrides')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create manual or maintenance schedule override' })
  createScheduleOverride(
    @Body() dto: CreateRoomScheduleOverrideDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.roomBookingsService.createScheduleOverride(dto, adminId);
  }

  @Patch('admin/schedule-overrides/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Schedule override id' })
  @ApiOperation({ summary: 'Update schedule override' })
  updateScheduleOverride(
    @Param('id') overrideId: string,
    @Body() dto: UpdateRoomScheduleOverrideDto,
  ) {
    return this.roomBookingsService.updateScheduleOverride(overrideId, dto);
  }

  @Delete('admin/schedule-overrides/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Schedule override id' })
  @ApiOperation({ summary: 'Delete schedule override' })
  deleteScheduleOverride(@Param('id') overrideId: string) {
    return this.roomBookingsService.deleteScheduleOverride(overrideId);
  }

  @Post('admin/class-meetings/:classMeetingId/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel one class meeting occurrence' })
  cancelClassMeetingOccurrence(
    @Param('classMeetingId') classMeetingId: string,
    @Body() dto: ClassMeetingOverrideDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.roomBookingsService.cancelClassMeetingOccurrence(classMeetingId, dto, adminId);
  }

  @Post('admin/class-meetings/:classMeetingId/move')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Move one class meeting occurrence' })
  moveClassMeetingOccurrence(
    @Param('classMeetingId') classMeetingId: string,
    @Body() dto: MoveClassMeetingDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.roomBookingsService.moveClassMeetingOccurrence(classMeetingId, dto, adminId);
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
