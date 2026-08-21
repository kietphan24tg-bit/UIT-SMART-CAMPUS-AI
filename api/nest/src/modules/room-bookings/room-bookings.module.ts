import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';

import { RoomBookingsController } from './room-bookings.controller';
import { RoomBookingsService } from './room-bookings.service';

@Module({
  imports: [NotificationsModule],
  controllers: [RoomBookingsController],
  providers: [RoomBookingsService],
  exports: [RoomBookingsService],
})
export class RoomBookingsModule {}
