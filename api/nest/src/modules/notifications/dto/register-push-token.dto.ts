import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

const PUSH_PLATFORMS = ['ios', 'android'] as const;

export class RegisterPushTokenDto {
  @ApiProperty({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' })
  @IsString()
  expoPushToken!: string;

  @ApiProperty({ enum: PUSH_PLATFORMS, example: 'android' })
  @IsString()
  @IsIn(PUSH_PLATFORMS)
  platform!: (typeof PUSH_PLATFORMS)[number];

  @ApiPropertyOptional({ example: 'f2f01ea8-e4eb-4b8d-8c2f-df9e6e74f806' })
  @IsString()
  @IsOptional()
  deviceId?: string;
}
