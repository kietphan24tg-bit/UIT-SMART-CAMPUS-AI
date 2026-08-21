import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateClassSectionDto {
  @ApiProperty({ example: 'sem-2025-2026-2' })
  @IsString()
  semesterId!: string;

  @ApiProperty({ example: 'SE346' })
  @IsString()
  courseCode!: string;

  @ApiProperty({ example: 'SE346.Q22' })
  @IsString()
  classCode!: string;

  @ApiProperty({ example: 'Q22' })
  @IsString()
  sectionCode!: string;

  @ApiPropertyOptional({ example: 'Lop do an IoT' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 'lecturer-user-id' })
  @IsOptional()
  @IsString()
  lecturerId?: string;

  @ApiPropertyOptional({ example: 60, default: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  registrationOpen?: boolean;
}

