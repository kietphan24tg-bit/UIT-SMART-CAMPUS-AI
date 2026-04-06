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

import { IotScanDto } from './dto/iot-scan.dto';
import { TelemetryDto } from './dto/telemetry.dto';
import { IotService } from './iot.service';

@ApiTags('IoT')
@Controller('iot')
export class IotController {
  constructor(private readonly iotService: IotService) {}

  @Post('parking/scan')
  @UseGuards(IotSecretGuard)
  @ApiOperation({ summary: 'Process RFID + license plate parking scan' })
  processParkingScan(@Body() dto: IotScanDto) {
    return this.iotService.processParkingScan(dto);
  }

  @Post('telemetry')
  @UseGuards(IotSecretGuard)
  @ApiOperation({ summary: 'Receive telemetry from the local gateway' })
  recordTelemetry(@Body() dto: TelemetryDto) {
    return this.iotService.recordTelemetry(dto);
  }

  @Get('telemetry/latest')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get latest telemetry snapshot' })
  @ApiQuery({ name: 'gateId', required: false, type: String })
  getLatestTelemetry(@Query('gateId') gateId?: string) {
    return this.iotService.getLatestTelemetry(gateId);
  }
}
