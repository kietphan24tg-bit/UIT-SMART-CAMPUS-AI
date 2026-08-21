import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { ParkingService } from './parking.service';

@ApiTags('Parking')
@Controller('parking')
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get current parking status' })
  @ApiQuery({ name: 'gateId', required: false, type: String })
  getStatus(@Query('gateId') gateId?: string) {
    return this.parkingService.getStatus(gateId);
  }

  @Get('vehicles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get vehicles registered by current user' })
  getVehicles(@CurrentUser('id') userId: string) {
    return this.parkingService.listVehicles(userId);
  }

  @Post('vehicles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a vehicle for parking access' })
  createVehicle(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateVehicleDto,
  ) {
    return this.parkingService.createVehicle(userId, dto);
  }
}
