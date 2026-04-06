import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class TelemetrySlotDto {
  @ApiProperty({ example: 'A1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  slotNumber!: string;

  @ApiPropertyOptional({ example: 'Main' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  zone?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  occupied?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isOccupied?: boolean;
}

export class TelemetryDto {
  @ApiProperty({ example: 'uit-gate-a' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  gateId!: string;

  @ApiPropertyOptional({ example: '192.168.1.55' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  deviceIp?: string;

  @ApiPropertyOptional({ example: '0101' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  slotBitmap?: string;

  @ApiProperty({ type: [TelemetrySlotDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TelemetrySlotDto)
  slots!: TelemetrySlotDto[];

  @ApiPropertyOptional({ example: 32.5 })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({ example: 72.4 })
  @IsOptional()
  @IsNumber()
  humidity?: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  rainDetected!: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  fireDetected!: boolean;

  @ApiPropertyOptional({ example: '2026-04-06T12:15:00.000Z' })
  @IsOptional()
  @IsDateString()
  reportedAt?: string;
}
