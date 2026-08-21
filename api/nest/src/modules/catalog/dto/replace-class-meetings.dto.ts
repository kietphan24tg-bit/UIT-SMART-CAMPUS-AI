import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const scheduleSessionTypeValues = ['daytime', 'evening'] as const;
type ScheduleSessionTypeValue = (typeof scheduleSessionTypeValues)[number];

class ClassMeetingInputDto {
  @ApiProperty({ example: 2, description: '2 = Monday, 7 = Saturday' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek!: number;

  @ApiProperty({ example: '07:30' })
  @IsString()
  startTime!: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  endTime!: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  startPeriod?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  endPeriod?: number;

  @ApiPropertyOptional({ example: 'B1.02' })
  @IsOptional()
  @IsString()
  room?: string;

  @ApiPropertyOptional({ enum: scheduleSessionTypeValues, default: 'daytime' })
  @IsOptional()
  @IsEnum(scheduleSessionTypeValues)
  sessionType?: ScheduleSessionTypeValue;

  @ApiPropertyOptional({ example: 'Thuc hanh phong lab' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ReplaceClassMeetingsDto {
  @ApiProperty({ type: () => [ClassMeetingInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassMeetingInputDto)
  meetings!: ClassMeetingInputDto[];
}

