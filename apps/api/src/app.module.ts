import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validate } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { EventsModule } from './modules/events/events.module';
import { AuthModule } from './modules/auth/auth.module';
import { GradesModule } from './modules/grades/grades.module';
import { HealthModule } from './modules/health/health.module';
import { IotModule } from './modules/iot/iot.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ParkingModule } from './modules/parking/parking.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { RoomBookingsModule } from './modules/room-bookings/room-bookings.module';
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
    AttendanceModule,
    UsersModule,
    ScheduleModule,
    GradesModule,
    HealthModule,
    EventsModule,
    NotificationsModule,
    ParkingModule,
    RoomBookingsModule,
    IotModule,
    PaymentsModule,
  ],
})
export class AppModule {}
