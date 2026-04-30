import { Module } from '@nestjs/common';

import { RolesGuard } from '../../common/guards/roles.guard';

import { ExpoPushService } from './expo-push.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, ExpoPushService, RolesGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}
