/// <reference path="./attendance.controller.ts" />
/// <reference path="./attendance.service.ts" />
import { Module } from '@nestjs/common';

import { RolesGuard } from '../../common/guards/roles.guard';

import { AttendanceLiveController } from './attendance-live.controller';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

@Module({
  controllers: [AttendanceController, AttendanceLiveController],
  providers: [AttendanceService, RolesGuard],
  exports: [AttendanceService],
})
export class AttendanceModule {}
