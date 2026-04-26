import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoomScheduleSlotDto {
  @ApiProperty({ example: 'slot-1' })
  timeSlotId!: string;

  @ApiProperty({ example: 1 })
  slotNumber!: number;

  @ApiProperty({ example: 'Tiet 1' })
  label!: string;

  @ApiProperty({ example: '07:30' })
  startTime!: string;

  @ApiProperty({ example: '08:15' })
  endTime!: string;

  @ApiPropertyOptional({ example: 'SE346.Q22', nullable: true })
  bookingTitle!: string | null;

  @ApiProperty({ example: 'SE346.Q22' })
  displayText!: string;
}

export class RoomScheduleDayDto {
  @ApiProperty({ example: 2, description: '2 = Monday, 7 = Saturday' })
  dayOfWeek!: number;

  @ApiProperty({ example: '2026-04-20' })
  dateKey!: string;

  @ApiProperty({ example: 'Thu 2' })
  label!: string;

  @ApiProperty({ type: () => RoomScheduleSlotDto, isArray: true })
  slots!: RoomScheduleSlotDto[];
}

export class RoomScheduleResponseDto {
  @ApiProperty({ example: 'B1.02' })
  roomCode!: string;

  @ApiProperty({ example: 'B' })
  buildingCode!: string;

  @ApiProperty({ example: 'Tòa B' })
  buildingName!: string;

  @ApiProperty({ example: 60 })
  capacity!: number;

  @ApiPropertyOptional({ example: 'Phong hoc 1', nullable: true })
  name!: string | null;

  @ApiProperty({
    example: '2026-04-27',
    description: 'Monday (YYYY-MM-DD) of the week returned; first bookable week if omitted on request.',
  })
  weekStart!: string;

  @ApiProperty({ type: () => RoomScheduleDayDto, isArray: true })
  days!: RoomScheduleDayDto[];
}

