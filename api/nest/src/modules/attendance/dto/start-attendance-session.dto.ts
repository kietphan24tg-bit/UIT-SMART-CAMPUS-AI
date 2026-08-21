import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class StartAttendanceSessionDto {
  @ApiProperty({
    description: 'Class section id to start attendance for',
    example: 'class-section-123',
  })
  @IsString()
  classSectionId!: string;

  @ApiPropertyOptional({
    description: 'Session duration in minutes',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 120,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  durationMinutes?: number;
}
