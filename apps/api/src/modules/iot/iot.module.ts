import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { ParkingModule } from '../parking/parking.module';

import { IotController } from './iot.controller';
import { ParkingRealtimeGateway } from './parking-realtime.gateway';
import { SafetyController } from './safety.controller';
import { IotService } from './iot.service';

@Module({
  imports: [NotificationsModule, ParkingModule],
  controllers: [IotController, SafetyController],
  providers: [IotService, ParkingRealtimeGateway],
  exports: [IotService],
})
export class IotModule {}
