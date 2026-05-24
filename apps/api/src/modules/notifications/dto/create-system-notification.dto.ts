import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ACTIVE_USER_ROLES, type ActiveUserRole } from '@smart-campus/shared';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

const NOTIFICATION_AUDIENCE_SCOPES = ['all', 'roles', 'class_section'] as const;

export class NotificationAudienceDto {
  @ApiProperty({ enum: NOTIFICATION_AUDIENCE_SCOPES, example: 'roles' })
  @IsString()
  @IsIn(NOTIFICATION_AUDIENCE_SCOPES)
  scope!: (typeof NOTIFICATION_AUDIENCE_SCOPES)[number];

  @ApiPropertyOptional({ isArray: true, enum: ACTIVE_USER_ROLES })
  @IsArray()
  @IsOptional()
  @IsIn(ACTIVE_USER_ROLES, { each: true })
  roles?: ActiveUserRole[];

  @ApiPropertyOptional({ example: 'class-section-id' })
  @IsString()
  @IsOptional()
  classSectionId?: string;
}

export class CreateSystemNotificationDto {
  @ApiProperty({ example: 'Campus reminder' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'The main entrance will close at 10 PM today.' })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional({ example: 'general' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;

  @ApiPropertyOptional({
    type: NotificationAudienceDto,
    example: { scope: 'roles', roles: [ACTIVE_USER_ROLES[0]] },
  })
  @ValidateNested()
  @Type(() => NotificationAudienceDto)
  @IsOptional()
  audience?: NotificationAudienceDto;

  @ApiPropertyOptional({ isArray: true, enum: ACTIVE_USER_ROLES })
  @IsArray()
  @IsOptional()
  @IsIn(ACTIVE_USER_ROLES, { each: true })
  roles?: ActiveUserRole[];
}
