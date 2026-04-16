import { Controller, Get, Header, Param, Query } from '@nestjs/common';

import { SkipResponseTransform } from '../../common/decorators/skip-response-transform.decorator';

import { AttendanceService } from './attendance.service';

@Controller('live/attendance')
export class AttendanceLiveController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get(':sessionId')
  @SkipResponseTransform()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getLivePage(
    @Param('sessionId') sessionId: string,
    @Query('displayKey') displayKey?: string,
  ) {
    return this.attendanceService.renderLiveAttendancePage(sessionId, displayKey);
  }
}
