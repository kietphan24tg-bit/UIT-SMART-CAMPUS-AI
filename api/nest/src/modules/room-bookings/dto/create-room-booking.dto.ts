import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRoomBookingDto {
  @ApiProperty({ example: 'B1.02' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  roomCode!: string;

  @ApiProperty({ example: '2026-04-24' })
  @IsDateString()
  bookingDate!: string;

  @ApiProperty({ example: ['slot-1', 'slot-2'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  timeSlotIds!: string[];

  @ApiProperty({ example: 'Học nhóm' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  purpose!: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  contactName!: string;

  @ApiPropertyOptional({ example: 'SE346 Team Meeting' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  attendeeCount?: number;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'Khoa Công nghệ phần mềm' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  departmentName?: string;
}
