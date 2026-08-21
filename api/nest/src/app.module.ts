import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validate } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { CanteenModule } from './modules/canteen/canteen.module';
import { EventsModule } from './modules/events/events.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { GradesModule } from './modules/grades/grades.module';
import { HealthModule } from './modules/health/health.module';
import { IotModule } from './modules/iot/iot.module';
import { LibraryModule } from './modules/library/library.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ParkingModule } from './modules/parking/parking.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { RoomBookingsModule } from './modules/room-bookings/room-bookings.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { SosModule } from './modules/sos/sos.module';
import { StudyMaterialsModule } from './modules/study-materials/study-materials.module';
import { UsersModule } from './modules/users/users.module';

import { AiToolsModule } from './modules/ai-tools/ai-tools.module';

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
    CatalogModule,
    UsersModule,
    ScheduleModule,
    GradesModule,
    HealthModule,
    EventsModule,
    NotificationsModule,
    LibraryModule,
    CanteenModule,
    SosModule,
    ChatbotModule,
    ParkingModule,
    RoomBookingsModule,
    RegistrationsModule,
    IotModule,
    PaymentsModule,
    StudyMaterialsModule,
    AiToolsModule,
  ],
})
export class AppModule {}
