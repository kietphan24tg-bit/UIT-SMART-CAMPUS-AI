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

import { GradesSummaryDto, SemesterGradesDto } from './dto/grades-response.dto';
import { GradesService } from './grades.service';

@ApiTags('Grades')
@Controller('grades')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all semester grades',
    description: 'Returns all semesters of the current user with semester summaries and grade records.',
  })
  @ApiOkResponse({
    description: 'All semester grades of the current user.',
    type: SemesterGradesDto,
    isArray: true,
  })
  getAllSemesterGrades(@CurrentUser('id') userId: string) {
    return this.gradesService.getAllSemesterGrades(userId);
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Get cumulative grades summary',
    description: 'Returns the cumulative grades summary across all semesters of the current user.',
  })
  @ApiOkResponse({
    description: 'Cumulative grades summary of the current user.',
    type: GradesSummaryDto,
  })
  getGradesSummary(@CurrentUser('id') userId: string) {
    return this.gradesService.getGradesSummary(userId);
  }

  @Get('current')
  @ApiOperation({
    summary: 'Get current semester grades',
    description:
      'Returns the current semester grades of the current user. If no semester is marked as current, it falls back to the newest semester available for that user.',
  })
  @ApiOkResponse({
    description: 'Current semester grades of the current user.',
    type: SemesterGradesDto,
  })
  getCurrentSemesterGrades(@CurrentUser('id') userId: string) {
    return this.gradesService.getCurrentSemesterGrades(userId);
  }

  @Get('semesters/:semesterId')
  @ApiOperation({
    summary: 'Get grades by semester ID',
    description: 'Returns the grade records for the requested semester of the current user.',
  })
  @ApiParam({
    name: 'semesterId',
    description: 'Semester ID.',
    example: 'sem-2025-2026-2',
  })
  @ApiOkResponse({
    description: 'Semester grades of the current user.',
    type: SemesterGradesDto,
  })
  @ApiNotFoundResponse({ description: 'Semester grades not found.' })
  getSemesterGradesById(
    @CurrentUser('id') userId: string,
    @Param('semesterId') semesterId: string,
  ) {
    return this.gradesService.getSemesterGradesById(userId, semesterId);
  }
}
