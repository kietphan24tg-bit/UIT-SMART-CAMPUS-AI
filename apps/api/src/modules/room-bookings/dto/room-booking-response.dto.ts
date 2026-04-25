import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class RoomBookingTimeSlotDto {
  @ApiProperty({ example: 'slot-1' })
  id!: string;

  @ApiProperty({ example: 1 })
  slotNumber!: number;

  @ApiProperty({ example: 'Tiết 1' })
  label!: string;

  @ApiProperty({ example: '07:30' })
  startTime!: string;

  @ApiProperty({ example: '08:15' })
  endTime!: string;
}

export class RoomBookingResponseDto {
  @ApiProperty({ example: 'booking-1' })
  id!: string;

  @ApiProperty({ example: 'B1.02' })
  roomCode!: string;

  @ApiPropertyOptional({ example: 'Phòng họp khoa', nullable: true })
  roomName!: string | null;

  @ApiProperty({ example: 'B' })
  buildingCode!: string;

  @ApiProperty({ example: 'Tòa B' })
  buildingName!: string;

  @ApiProperty({ example: '2026-04-24' })
  bookingDate!: string;

  @ApiProperty({ example: ['slot-1', 'slot-2'] })
  timeSlotIds!: string[];

  @ApiProperty({ type: () => RoomBookingTimeSlotDto, isArray: true })
  timeSlots!: RoomBookingTimeSlotDto[];

  @ApiProperty({ example: 2 })
  slotCount!: number;

  @ApiPropertyOptional({ example: '07:30', nullable: true })
  startTime!: string | null;

  @ApiPropertyOptional({ example: '09:00', nullable: true })
  endTime!: string | null;

  @ApiPropertyOptional({ example: 'SE346 Team Meeting', nullable: true })
  title!: string | null;

  @ApiProperty({ example: 'Học nhóm' })
  purpose!: string;

  @ApiPropertyOptional({ example: 5, nullable: true })
  attendeeCount!: number | null;

  @ApiPropertyOptional({ example: 'Nguyen Van A', nullable: true })
  contactName!: string | null;

  @ApiPropertyOptional({ example: '0901234567', nullable: true })
  contactPhone!: string | null;

  @ApiPropertyOptional({ example: 'Khoa Công nghệ phần mềm', nullable: true })
  departmentName!: string | null;

  @ApiPropertyOptional({ example: 'Ghi chú nội bộ', nullable: true })
  notes!: string | null;

  @ApiPropertyOptional({ example: '2026-04-23T10:00:00.000Z', nullable: true })
  approvedAt!: string | null;

  @ApiProperty({ enum: ['pending', 'approved', 'booked', 'maintenance', 'rejected', 'cancelled'] })
  status!: 'pending' | 'approved' | 'booked' | 'maintenance' | 'rejected' | 'cancelled';

  @ApiProperty({ example: '2026-04-23T10:00:00.000Z' })
  createdAt!: string;
}
