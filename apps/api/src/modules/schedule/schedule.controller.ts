import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { ScheduleService } from './schedule.service';

@ApiTags('Schedule')
@Controller('schedules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user schedule' })
  @ApiQuery({ name: 'semesterId', required: false })
  getSchedule(
    @CurrentUser('id') userId: string,
    @Query('semesterId') semesterId?: string,
  ) {
    return this.scheduleService.getSchedule(userId, semesterId);
  }

  @Get('semesters')
  @ApiOperation({ summary: 'Get all semesters' })
  getSemesters() {
    return this.scheduleService.getSemesters();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a schedule item by ID' })
  getScheduleItem(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.scheduleService.getScheduleItemById(id, userId);
  }
}
