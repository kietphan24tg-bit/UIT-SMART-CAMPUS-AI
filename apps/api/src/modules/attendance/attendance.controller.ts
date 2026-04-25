import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { USER_ROLES } from '@smart-campus/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { AttendanceService } from './attendance.service';
import { CheckinAttendanceDto } from './dto/checkin-attendance.dto';
import { GetAttendanceHistoryDto } from './dto/get-attendance-history.dto';
import { GetSessionRecordsDto } from './dto/get-session-records.dto';
import { StartAttendanceSessionDto } from './dto/start-attendance-session.dto';

@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('session/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.LECTURER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start an attendance session' })
  startSession(@CurrentUser('id') lecturerId: string, @Body() dto: StartAttendanceSessionDto) {
    return this.attendanceService.startSession(lecturerId, dto);
  }

  @Post('session/:id/stop')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.LECTURER)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Attendance session id' })
  @ApiOperation({ summary: 'Stop an attendance session early' })
  stopSession(@Param('id') sessionId: string, @CurrentUser('id') lecturerId: string) {
    return this.attendanceService.stopSession(sessionId, lecturerId);
  }

  @Get('session/:id/qr-token')
  @ApiParam({ name: 'id', description: 'Attendance session id' })
  @ApiQuery({ name: 'displayKey', required: true, description: 'Projector display key from start session response' })
  @ApiOperation({ summary: 'Issue a dynamic attendance QR token' })
  issueQrToken(@Param('id') sessionId: string, @Query('displayKey') displayKey: string) {
    return this.attendanceService.issueQrToken(sessionId, displayKey);
  }

  @Post('checkin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check in attendance using dynamic token' })
  checkin(@CurrentUser('id') studentId: string, @Body() dto: CheckinAttendanceDto) {
    return this.attendanceService.checkin(studentId, dto);
  }

  @Get('session/:id/records')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.LECTURER)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Attendance session id' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Get attendance records for a session' })
  getSessionRecords(
    @Param('id') sessionId: string,
    @CurrentUser('id') lecturerId: string,
    @Query() query: GetSessionRecordsDto,
  ) {
    return this.attendanceService.getSessionRecords(sessionId, lecturerId, query);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.LECTURER)
  @ApiBearerAuth()
  @ApiQuery({ name: 'classSectionId', required: true, type: String })
  @ApiQuery({ name: 'date', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Get attendance session history for lecturer by class/date' })
  getHistory(@CurrentUser('id') lecturerId: string, @Query() query: GetAttendanceHistoryDto) {
    return this.attendanceService.getHistory(lecturerId, query);
  }

  @Get('lecturer/class-sections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.LECTURER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get class sections assigned to current lecturer' })
  getLecturerClassSections(@CurrentUser('id') lecturerId: string) {
    return this.attendanceService.getLecturerClassSections(lecturerId);
  }

  @Get('me/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.STUDENT)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Get attendance check-in history of current student' })
  getStudentHistory(
    @CurrentUser('id') studentId: string,
    @Query() query: GetSessionRecordsDto,
  ) {
    return this.attendanceService.getStudentHistory(studentId, query);
  }
}
