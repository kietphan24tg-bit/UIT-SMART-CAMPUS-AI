import {
  Body,
  Controller,
  Get,
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
}
