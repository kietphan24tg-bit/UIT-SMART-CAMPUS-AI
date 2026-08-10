import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { USER_ROLES } from '@smart-campus/shared';

import { Roles } from '../../common/decorators/roles.decorator';
import { IotSecretGuard } from '../../common/guards/iot-secret.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { FireAlertDto } from './dto/fire-alert.dto';
import { IotService } from './iot.service';

@ApiTags('Safety')
@Controller('safety')
export class SafetyController {
  constructor(private readonly iotService: IotService) {}

  @Post('fire-alerts')
  @UseGuards(IotSecretGuard)
  @ApiOperation({ summary: 'Create a fire alert from gateway telemetry' })
  createFireAlert(@Body() dto: FireAlertDto) {
    return this.iotService.createFireAlert(dto);
  }

  @Get('fire-alerts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List fire alerts for administrators' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getFireAlerts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.iotService.listFireAlerts(page, limit);
  }

  @Delete('fire-alerts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete all fire alerts for administrators' })
  deleteFireAlerts() {
    return this.iotService.deleteFireAlerts();
  }

  @Delete('fire-alerts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a fire alert for administrators' })
  deleteFireAlert(@Param('id') id: string) {
    return this.iotService.deleteFireAlert(id);
  }

  @Patch('fire-alerts/:id/read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a fire alert as read for administrators' })
  markFireAlertAsRead(@Param('id') id: string) {
    return this.iotService.markFireAlertAsRead(id);
  }
}
