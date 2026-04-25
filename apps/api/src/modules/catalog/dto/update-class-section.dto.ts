import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateClassSectionDto {
  @ApiPropertyOptional({ example: 'Q22A' })
  @IsOptional()
  @IsString()
  sectionCode?: string;

  @ApiPropertyOptional({ example: 'Lop cap nhat' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 'lecturer-user-id' })
  @IsOptional()
  @IsString()
  lecturerId?: string | null;

  @ApiPropertyOptional({ example: 70 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  registrationOpen?: boolean;
}

