import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class IotScanDto {
  @ApiProperty({ example: 'DEMO-RFID-0001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  rfidTag!: string;

  @ApiProperty({ example: '51F44614' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  recognizedPlate!: string;

  @ApiProperty({ example: 'uit-gate-a' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  gateId!: string;

  @ApiProperty({ example: '2026-04-06T12:15:00.000Z' })
  @IsDateString()
  capturedAt!: string;
}
