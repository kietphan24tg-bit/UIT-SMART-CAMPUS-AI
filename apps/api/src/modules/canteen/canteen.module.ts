import { Module } from '@nestjs/common';

import { StorageModule } from '../storage/storage.module';

import { CanteenController } from './canteen.controller';
import { CanteenService } from './canteen.service';

@Module({
  imports: [StorageModule],
  controllers: [CanteenController],
  providers: [CanteenService],
  exports: [CanteenService],
})
export class CanteenModule {}
