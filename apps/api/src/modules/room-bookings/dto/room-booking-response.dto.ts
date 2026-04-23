import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoomBookingResponseDto {
  @ApiProperty({ example: 'booking-1' })
  id!: string;

  @ApiProperty({ example: 'B1.02' })
  roomCode!: string;

  @ApiProperty({ example: '2026-04-24' })
  bookingDate!: string;

  @ApiProperty({ example: 'slot-1' })
  timeSlotId!: string;

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

  @ApiProperty({ enum: ['pending', 'approved', 'booked', 'maintenance'] })
  status!: 'pending' | 'approved' | 'booked' | 'maintenance';

  @ApiProperty({ example: '2026-04-23T10:00:00.000Z' })
  createdAt!: string;
}
