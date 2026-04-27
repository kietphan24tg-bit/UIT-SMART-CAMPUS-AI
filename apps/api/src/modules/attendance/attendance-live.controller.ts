import { Controller, Get, Header, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

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
    @Res() response: Response,
    @Query('displayKey') displayKey?: string,
  ) {
    return this.attendanceService.renderLiveAttendancePage(sessionId, displayKey, response);
  }
}
