import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { GradesService } from './grades.service';

@ApiTags('Grades')
@Controller('grades')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user grades' })
  @ApiQuery({ name: 'semesterId', required: false })
  getGrades(
    @CurrentUser('id') userId: string,
    @Query('semesterId') semesterId?: string,
  ) {
    return this.gradesService.getGrades(userId, semesterId);
  }

  @Get('gpa')
  @ApiOperation({ summary: 'Calculate GPA' })
  @ApiQuery({ name: 'semesterId', required: false })
  getGPA(
    @CurrentUser('id') userId: string,
    @Query('semesterId') semesterId?: string,
  ) {
    return this.gradesService.calculateGPA(userId, semesterId);
  }
}
