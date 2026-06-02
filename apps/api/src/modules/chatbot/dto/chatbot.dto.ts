import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class QueryChatbotDto {
  @ApiProperty()
  @IsString()
  message!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class UpsertKnowledgeDocumentDto {
  @ApiProperty()
  @IsString()
  slug!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: 'manual' | 'faq' | 'policy' | 'service';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @ApiProperty()
  @IsString()
  contentText!: string;
}

export class GetChatbotSummaryDto {
  @ApiPropertyOptional({
    enum: ['today', 'work', 'ops'],
    default: 'today',
  })
  @IsOptional()
  @IsString()
  @IsIn(['today', 'work', 'ops'])
  scope?: 'today' | 'work' | 'ops';
}
