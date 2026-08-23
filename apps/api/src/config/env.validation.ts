import { Transform, plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
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
  @IsIn(['development', 'test', 'staging', 'production'])
  @IsOptional()
  NODE_ENV?: 'development' | 'test' | 'staging' | 'production';

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
  REDIS_URL = '';

  @IsString()
  @IsOptional()
  AI_SERVICE_URL = '';

  @IsString()
  @IsOptional()
  AI_SERVICE_TOKEN = '';

  @toOptionalBoolean(false)
  @IsBoolean()
  @IsOptional()
  AI_AGENT_ENABLED = false;

  @toOptionalNumber(30_000)
  @IsNumber()
  @IsOptional()
  AI_AGENT_TIMEOUT_MS = 30_000;

  @IsString()
  @IsOptional()
  IOT_SHARED_SECRET = 'change-me';

  @toOptionalBoolean(false)
  @IsBoolean()
  @IsOptional()
  IOT_MQTT_ENABLED = false;

  @IsString()
  @IsOptional()
  IOT_MQTT_BROKER_URL = '';

  @IsString()
  @IsOptional()
  IOT_MQTT_USERNAME = '';

  @IsString()
  @IsOptional()
  IOT_MQTT_PASSWORD = '';

  @IsString()
  @IsOptional()
  IOT_MQTT_CLIENT_ID = 'smart-campus-api';

  @IsString()
  @IsOptional()
  IOT_MQTT_TELEMETRY_TOPIC = 'uit/parking/telemetry';

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
  SEPAY_API_TOKEN = '';

  @IsString()
  @IsOptional()
  SEPAY_BANK_ACCOUNT_UUID = '';

  @IsString()
  @IsOptional()
  SEPAY_API_BASE_URL = 'https://userapi.sepay.vn/v2';

  @IsString()
  @IsOptional()
  SEPAY_VA_PREFIX = '';

  @IsString()
  @IsOptional()
  SEPAY_WEBHOOK_API_KEY = '';

  @IsString()
  @IsOptional()
  SEPAY_BANK_NAME = '';

  @IsString()
  @IsOptional()
  SEPAY_ACCOUNT_NUMBER = '';

  @IsString()
  @IsOptional()
  SEPAY_ACCOUNT_NAME = '';

  @IsString()
  @IsOptional()
  SEPAY_QR_BASE_URL = 'https://qr.sepay.vn/img';

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

  @toOptionalNumber(2)
  @IsNumber()
  @IsOptional()
  UIT_EVENTS_INITIAL_PAGES = 2;

  @toOptionalNumber(3_600_000)
  @IsNumber()
  @IsOptional()
  UIT_EVENTS_CACHE_TTL_MS = 3_600_000;

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
  EXPO_PUBLIC_TRACK_ASIA_MAP_KEY = '';

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

  const isProduction = validatedConfig.NODE_ENV === 'production';
  if (isProduction && validatedConfig.AI_AGENT_ENABLED) {
    if (!validatedConfig.AI_SERVICE_URL.trim()) {
      throw new Error('AI_SERVICE_URL is required when AI_AGENT_ENABLED=true in production.');
    }
    if (!validatedConfig.AI_SERVICE_TOKEN.trim()) {
      throw new Error('AI_SERVICE_TOKEN is required when AI_AGENT_ENABLED=true in production.');
    }
  }

  return validatedConfig;
}
