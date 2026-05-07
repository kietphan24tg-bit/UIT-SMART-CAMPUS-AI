import { Module } from '@nestjs/common';

import { SosController } from './sos.controller';
import { SosRealtimeGateway } from './sos-realtime.gateway';
import { SosService } from './sos.service';

@Module({
  controllers: [SosController],
  providers: [SosService, SosRealtimeGateway],
  exports: [SosService],
})
export class SosModule {}
