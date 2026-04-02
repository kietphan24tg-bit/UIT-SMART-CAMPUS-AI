import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validate } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { GradesModule } from './modules/grades/grades.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ScheduleModule,
    GradesModule,
    NotificationsModule,
  ],
})
export class AppModule {}
