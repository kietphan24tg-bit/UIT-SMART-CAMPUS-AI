import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { LibraryLoanRequestStatus } from '@prisma/client';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateLibraryBookDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  authors!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  openLibraryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  isbn13?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  publisher?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  publishedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shelfCode?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateLibraryBookDto extends PartialType(CreateLibraryBookDto) {}

export class CreateLibraryCopyDto {
  @ApiProperty()
  @IsString()
  copyCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conditionNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  acquiredAt?: string;
}

export class UpdateLibraryCopyDto extends PartialType(CreateLibraryCopyDto) {}

export class CheckoutLibraryLoanDto {
  @ApiProperty()
  @IsString()
  borrowerId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  copyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateReservationDto {
  @ApiProperty()
  @IsString()
  bookId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateLibraryLoanRequestDto {
  @ApiProperty()
  @IsString()
  bookId!: string;

  @ApiProperty()
  @IsString()
  copyId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class ListLibraryLoanRequestsQueryDto {
  @ApiPropertyOptional({ enum: LibraryLoanRequestStatus })
  @IsOptional()
  @IsEnum(LibraryLoanRequestStatus)
  status?: LibraryLoanRequestStatus;
}

export class ListLibraryBooksQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

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
