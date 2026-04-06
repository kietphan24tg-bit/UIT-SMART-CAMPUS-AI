import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class FireAlertDto {
  @ApiProperty({ example: 'uit-gate-a' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  gateId!: string;

  @ApiPropertyOptional({ example: 'Cam bien lua da kich hoat tai bai xe.' })
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
      slots: [{ slotNumber: 'A1', occupied: true }],
      fireDetected: true,
      rainDetected: false,
    },
  })
  @IsOptional()
  @IsObject()
  telemetrySnapshot?: Record<string, unknown>;
}
