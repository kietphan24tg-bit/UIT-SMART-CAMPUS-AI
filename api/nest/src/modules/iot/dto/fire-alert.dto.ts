import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class FireAlertTelemetrySlotDto {
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

export class FireAlertTelemetrySnapshotDto {
  @ApiPropertyOptional({ example: 'uit-gate-a' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  gateId?: string;

  @ApiPropertyOptional({ example: '192.168.1.55' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  deviceIp?: string;

  @ApiPropertyOptional({ example: '01' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  slotBitmap?: string;

  @ApiPropertyOptional({ type: [FireAlertTelemetrySlotDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FireAlertTelemetrySlotDto)
  slots?: FireAlertTelemetrySlotDto[];

  @ApiPropertyOptional({ example: 32.5 })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({ example: 72.4 })
  @IsOptional()
  @IsNumber()
  humidity?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  rainDetected?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  fireDetected?: boolean;

  @ApiPropertyOptional({ example: '2026-04-06T12:15:00.000Z' })
  @IsOptional()
  @IsDateString()
  reportedAt?: string;
}

export class FireAlertDto {
  @ApiProperty({ example: 'uit-gate-a' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  gateId!: string;

  @ApiPropertyOptional({ example: 'Cảm biến lửa đã kích hoạt tại bãi xe.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  message?: string;

  @ApiProperty({ example: '2026-04-06T12:15:00.000Z' })
  @IsDateString()
  reportedAt!: string;

  @ApiPropertyOptional({
    example: {
      gateId: 'uit-gate-a',
      deviceIp: '192.168.1.55',
      slotBitmap: '01',
      slots: [{ slotNumber: 'A1', occupied: true }],
      temperature: 32.5,
      humidity: 72.4,
      fireDetected: true,
      rainDetected: false,
      reportedAt: '2026-04-06T12:15:00.000Z',
    },
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FireAlertTelemetrySnapshotDto)
  telemetrySnapshot?: FireAlertTelemetrySnapshotDto;
}
