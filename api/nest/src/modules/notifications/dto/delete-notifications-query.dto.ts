import { ApiPropertyOptional } from '@nestjs/swagger';
import type { NotificationAlertCategory } from '@smart-campus/shared';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';

const ALERT_CATEGORIES: NotificationAlertCategory[] = [
  'general',
  'academic',
  'payment',
  'emergency',
];

function toOptionalBoolean(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }

  return value;
}

export class DeleteNotificationsQueryDto {
  @ApiPropertyOptional({ enum: ALERT_CATEGORIES })
  @IsOptional()
  @IsIn(ALERT_CATEGORIES)
  category?: NotificationAlertCategory;

  @ApiPropertyOptional({ type: Boolean })
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;
}
