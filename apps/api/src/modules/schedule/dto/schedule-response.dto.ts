import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduleCourseDto {
  @ApiProperty({ example: 'SE346' })
  code!: string;

  @ApiProperty({ example: 'Internet of Things' })
  name!: string;

  @ApiProperty({ example: 4 })
  credits!: number;
}

export class ScheduleSessionDto {
  @ApiProperty({ example: 'schedule-item-1' })
  id!: string;

  @ApiProperty({ example: 'SE346.Q22' })
  classCode!: string;

  @ApiProperty({ example: 'Q22' })
  sectionCode!: string;

  @ApiPropertyOptional({ example: 'Hoc tai phong lab IoT' })
  note?: string | null;

  @ApiPropertyOptional({ example: 'Nguyen Van A', nullable: true })
  instructor!: string | null;

  @ApiPropertyOptional({ example: 'E3.1', nullable: true })
  room!: string | null;

  @ApiProperty({ example: 2, description: '2 = Monday, 8 = Sunday' })
  dayOfWeek!: number;

  @ApiProperty({ example: '07:30' })
  startTime!: string;

  @ApiProperty({ example: '09:30' })
  endTime!: string;

  @ApiPropertyOptional({ example: 1, nullable: true })
  startPeriod?: number | null;

  @ApiPropertyOptional({ example: 3, nullable: true })
  endPeriod?: number | null;

  @ApiProperty({ enum: ['daytime', 'evening'], example: 'daytime' })
  sessionType!: 'daytime' | 'evening';

  @ApiProperty({ example: '2025-01-06T00:00:00.000Z' })
  startDate!: string;

  @ApiProperty({ example: '2025-05-30T00:00:00.000Z' })
  endDate!: string;

  @ApiProperty({ type: () => ScheduleCourseDto })
  course!: ScheduleCourseDto;
}

export class ScheduleSemesterWithSessionsDto {
  @ApiProperty({ example: 'sem-2025-2026-2' })
  id!: string;

  @ApiProperty({ example: 'HK2 2025-2026' })
  name!: string;

  @ApiProperty({ example: '2025-2026' })
  academicYear!: string;

  @ApiProperty({ example: 2 })
  term!: number;

  @ApiProperty({ example: '2026-01-05T00:00:00.000Z' })
  startDate!: string;

  @ApiProperty({ example: '2026-05-31T23:59:59.000Z' })
  endDate!: string;

  @ApiProperty({ example: true })
  isCurrent!: boolean;

  @ApiProperty({ type: () => ScheduleSessionDto, isArray: true })
  sessions!: ScheduleSessionDto[];
}
