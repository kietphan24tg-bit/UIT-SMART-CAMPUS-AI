import { Module } from '@nestjs/common';

import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { UitEventsScraper } from './uit-events.scraper';

@Module({
  controllers: [EventsController],
  providers: [EventsService, UitEventsScraper],
})
export class EventsModule {}
