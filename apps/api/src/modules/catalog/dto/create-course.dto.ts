import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'SE346' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Internet of Things' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  @Max(10)
  credits!: number;

  @ApiPropertyOptional({ example: 'Khoa Cong nghe phan mem' })
  @IsOptional()
  @IsString()
  faculty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

