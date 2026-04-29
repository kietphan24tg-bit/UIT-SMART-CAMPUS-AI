import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ApproveOneRoomBookingDto {
  @ApiProperty({ example: 'booking-1' })
  @IsString()
  @IsNotEmpty()
  bookingId!: string;
}

export class RejectRoomBookingSlotDto {
  @ApiProperty({ example: 'B1.14' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  roomCode!: string;

  @ApiProperty({ example: '2026-05-04' })
  @IsDateString()
  bookingDate!: string;

  @ApiProperty({ example: ['slot-2'] })
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  timeSlotIds!: string[];

  @ApiPropertyOptional({ example: 'Khong duoc phe duyet' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

export class CreateRoomScheduleOverrideDto {
  @ApiProperty({ example: 'B1.14' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  roomCode!: string;

  @ApiProperty({ example: '2026-05-04' })
  @IsDateString()
  overrideDate!: string;

  @ApiProperty({ example: 'slot-2' })
  @IsString()
  @IsNotEmpty()
  timeSlotId!: string;

  @ApiProperty({ enum: ['manual', 'maintenance'], example: 'manual' })
  @IsIn(['manual', 'maintenance'])
  type!: 'manual' | 'maintenance';

  @ApiProperty({ example: 'Hoc bu SE346' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 'Muc dich: Hoc bu\nSo nguoi: 45' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class UpdateRoomScheduleOverrideDto {
  @ApiPropertyOptional({ example: 'Bao tri phong' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Cap nhat ghi chu' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class ClassMeetingOverrideDto {
  @ApiProperty({ example: '2026-05-04' })
  @IsDateString()
  overrideDate!: string;

  @ApiPropertyOptional({ example: 'Phong bao tri' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class MoveClassMeetingDto extends ClassMeetingOverrideDto {
  @ApiProperty({ example: 'B1.14' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  roomCode!: string;

  @ApiProperty({ example: 'slot-3' })
  @IsString()
  @IsNotEmpty()
  timeSlotId!: string;
}
