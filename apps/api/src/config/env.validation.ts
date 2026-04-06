import { plainToInstance } from 'class-transformer';
import { IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
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

  @IsString()
  @IsOptional()
  IOT_SHARED_SECRET = 'change-me';

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
  MOMO_REDIRECT_URL = 'http://localhost:3000/api/v1/payments/momo/mock-return';

  @IsString()
  @IsOptional()
  MOMO_IPN_URL = 'http://localhost:3000/api/v1/payments/momo/webhook';
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
