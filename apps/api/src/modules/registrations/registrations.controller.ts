import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EnrollmentStatus } from '@prisma/client';
import { USER_ROLES } from '@smart-campus/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { CreateRegistrationDto } from './dto/create-registration.dto';
import { RegistrationsService } from './registrations.service';

@ApiTags('Registrations')
@Controller('registrations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLES.STUDENT)
@ApiBearerAuth()
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Get('available-class-sections')
  @ApiOperation({ summary: 'Get available class sections for registration' })
  getAvailableClassSections(@CurrentUser('id') studentId: string) {
    return this.registrationsService.getAvailableClassSections(studentId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current student registrations' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: EnrollmentStatus,
  })
  getMyRegistrations(
    @CurrentUser('id') studentId: string,
    @Query('status') status?: EnrollmentStatus,
  ) {
    return this.registrationsService.getMyRegistrations(studentId, status);
  }

  @Post()
  @ApiOperation({ summary: 'Register for a class section' })
  register(
    @CurrentUser('id') studentId: string,
    @Body() dto: CreateRegistrationDto,
  ) {
    return this.registrationsService.register(studentId, dto.classSectionId);
  }

  @Patch(':id/drop')
  @ApiOperation({ summary: 'Drop a registration' })
  @ApiParam({ name: 'id', description: 'Enrollment id' })
  drop(@CurrentUser('id') studentId: string, @Param('id') enrollmentId: string) {
    return this.registrationsService.drop(studentId, enrollmentId);
  }
}
