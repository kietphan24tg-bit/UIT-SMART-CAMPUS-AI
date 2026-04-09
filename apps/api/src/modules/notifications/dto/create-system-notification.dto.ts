import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { USER_ROLES } from '@smart-campus/shared';
import { IsArray, IsIn, IsObject, IsOptional, IsString, IsNotEmpty } from 'class-validator';

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

  @ApiPropertyOptional({ isArray: true, enum: Object.values(USER_ROLES) })
  @IsArray()
  @IsOptional()
  @IsIn(Object.values(USER_ROLES), { each: true })
  roles?: (typeof USER_ROLES)[keyof typeof USER_ROLES][];
}
