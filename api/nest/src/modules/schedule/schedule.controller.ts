import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import {
  ScheduleSemesterWithSessionsDto,
} from './dto/schedule-response.dto';
import { ScheduleService } from './schedule.service';

@ApiTags('Schedule')
@Controller('schedules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all semesters with schedule sessions',
    description: 'Returns all semesters of the current user, each with its schedule sessions.',
  })
  @ApiOkResponse({
    description: 'All semesters with schedule sessions of the current user.',
    type: ScheduleSemesterWithSessionsDto,
    isArray: true,
  })
  getAllSemestersWithSchedules(@CurrentUser('id') userId: string) {
    return this.scheduleService.getAllSemestersWithSchedules(userId);
  }

  @Get('current')
  @ApiOperation({
    summary: 'Get current semester schedule',
    description: 'Returns the current semester and its schedule sessions for the current user.',
  })
  @ApiOkResponse({
    description: 'Current semester with schedule sessions.',
    type: ScheduleSemesterWithSessionsDto,
  })
  @ApiNotFoundResponse({ description: 'Current semester not found.' })
  getCurrentSemesterSchedule(@CurrentUser('id') userId: string) {
    return this.scheduleService.getCurrentSemesterSchedule(userId);
  }

  @Get('semesters/:semesterId')
  @ApiOperation({
    summary: 'Get schedule by semester ID',
    description: 'Returns the requested semester and its schedule sessions for the current user.',
  })
  @ApiParam({
    name: 'semesterId',
    description: 'Semester ID.',
    example: 'sem-2025-2026-2',
  })
  @ApiOkResponse({
    description: 'Semester with schedule sessions.',
    type: ScheduleSemesterWithSessionsDto,
  })
  @ApiNotFoundResponse({ description: 'Semester not found.' })
  getSemesterScheduleById(
    @Param('semesterId') semesterId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.scheduleService.getSemesterScheduleById(userId, semesterId);
  }
}
