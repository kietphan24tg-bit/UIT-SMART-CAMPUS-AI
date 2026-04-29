import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpdateGradeWeightsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  processWeight!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  practiceWeight!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  midtermWeight!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  finalWeight!: number;
}

export class UpsertGradeSheetRowDto {
  @IsString()
  studentId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  processScore?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  practiceScore?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  midtermScore?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  finalScore?: number | null;
}

export class UpsertGradeSheetDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(300)
  @ValidateNested({ each: true })
  @Type(() => UpsertGradeSheetRowDto)
  rows!: UpsertGradeSheetRowDto[];
}
