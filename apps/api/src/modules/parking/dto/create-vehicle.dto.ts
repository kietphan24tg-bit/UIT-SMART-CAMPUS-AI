import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: '51F-446.14' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  plateNumber!: string;

  @ApiProperty({ example: 'DEMO-RFID-0001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  rfidTag!: string;

  @ApiPropertyOptional({ example: 'Xe may sinh vien' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;
}
