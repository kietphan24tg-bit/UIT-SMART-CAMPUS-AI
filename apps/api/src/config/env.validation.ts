import { Transform, plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

function toOptionalNumber(defaultValue?: number) {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }

    const normalized = typeof value === 'string' ? value.trim() : value;
    if (normalized === '') {
      return defaultValue;
    }

    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? value : parsed;
  });
}

function toOptionalBoolean(defaultValue?: boolean) {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === '') {
        return defaultValue;
      }
      if (normalized === 'true') {
        return true;
      }
      if (normalized === 'false') {
        return false;
      }
    }

    return value;
  });
}

class EnvironmentVariables {
  @toOptionalNumber(3000)
  @IsNumber()
  @IsOptional()
  PORT = 3000;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRATION = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRATION = '7d';

  @IsString()
  @IsOptional()
  CORS_ORIGIN = '*';

  @IsString()
  @IsOptional()
  APP_BASE_URL = 'http://localhost:3000';

  @toOptionalNumber(90)
  @IsNumber()
  @IsOptional()
  ATTENDANCE_TOKEN_TTL_SECONDS = 90;

  @IsString()
  @IsOptional()
  REDIS_URL = 'redis://localhost:6379';

  @IsString()
  @IsOptional()
  IOT_SHARED_SECRET = 'change-me';

  @IsString()
  @IsOptional()
  SMTP_HOST = '';

  @toOptionalNumber(587)
  @IsNumber()
  @IsOptional()
  SMTP_PORT = 587;

  @toOptionalBoolean(false)
  @IsBoolean()
  @IsOptional()
  SMTP_SECURE = false;

  @IsString()
  @IsOptional()
  SMTP_USER = '';

  @IsString()
  @IsOptional()
  SMTP_PASS = '';

  @IsString()
  @IsOptional()
  SMTP_FROM = '';

  @IsString()
  @IsOptional()
  MOMO_PARTNER_CODE = '';

  @IsString()
  @IsOptional()
  MOMO_ACCESS_KEY = '';

  @IsString()
  @IsOptional()
  MOMO_SECRET_KEY = '';

  @IsString()
  @IsOptional()
  MOMO_REDIRECT_URL = 'http://localhost:3000/api/v1/payments/momo/return';

  @IsString()
  @IsOptional()
  MOMO_IPN_URL = 'http://localhost:3000/api/v1/payments/momo/webhook';

  @IsString()
  @IsOptional()
  AVATAR_STORAGE_BUCKET = '';

  @IsString()
  @IsOptional()
  AVATAR_STORAGE_ENDPOINT = '';

  @IsString()
  @IsOptional()
  AVATAR_STORAGE_ACCESS_KEY_ID = '';

  @IsString()
  @IsOptional()
  AVATAR_STORAGE_SECRET_ACCESS_KEY = '';

  @IsString()
  @IsOptional()
  AVATAR_STORAGE_REGION = 'us-east-1';

  @IsString()
  @IsOptional()
  AVATAR_STORAGE_PUBLIC_BASE_URL = '';

  @toOptionalNumber(10)
  @IsNumber()
  @IsOptional()
  UIT_EVENTS_MAX_PAGES = 10;

  @toOptionalNumber(900_000)
  @IsNumber()
  @IsOptional()
  UIT_EVENTS_CACHE_TTL_MS = 900_000;

  @toOptionalNumber(20_000)
  @IsNumber()
  @IsOptional()
  UIT_EVENTS_REQUEST_TIMEOUT_MS = 20_000;

  @IsString()
  @IsOptional()
  TRACK_ASIA_SERVER_KEY = '';

  @IsString()
  @IsOptional()
  TRACK_ASIA_STYLE_URL = '';

  @IsString()
  @IsOptional()
  OPEN_LIBRARY_USER_AGENT = 'smart-campus-demo/1.0';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
