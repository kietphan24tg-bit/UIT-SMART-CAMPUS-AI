import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { StudyMaterialCategory } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListStudyMaterialsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: StudyMaterialCategory })
  @IsOptional()
  @IsEnum(StudyMaterialCategory)
  category?: StudyMaterialCategory;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

export class CreateStudyMaterialDto {
  @ApiProperty({ enum: StudyMaterialCategory })
  @IsEnum(StudyMaterialCategory)
  category!: StudyMaterialCategory;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateStudyMaterialDto extends PartialType(CreateStudyMaterialDto) {}
