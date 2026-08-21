import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventCategory, EventStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ example: 'hoi-thao-iot-se346' })
  @IsString()
  slug!: string;

  @ApiProperty({ example: 'Hoi thao IoT cho do an' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Tom tat ngan gon ve noi dung su kien' })
  @IsString()
  excerpt!: string;

  @ApiProperty({ example: 'Phong E4.1' })
  @IsString()
  location!: string;

  @ApiProperty({ example: '<p>Noi dung HTML</p>' })
  @IsString()
  contentHtml!: string;

  @ApiPropertyOptional({ example: 'https://www.uit.edu.vn/sites/vi/files/banner_uit_1.png' })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({ enum: EventStatus, default: EventStatus.open })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({ enum: EventCategory, default: EventCategory.workshop })
  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;

  @ApiProperty({ example: '2026-04-28T08:30:00.000Z' })
  @IsDateString()
  startAt!: string;

  @ApiProperty({ example: '2026-04-28T10:30:00.000Z' })
  @IsDateString()
  endAt!: string;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttendees?: number;
}

