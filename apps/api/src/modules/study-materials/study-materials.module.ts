import { Module } from '@nestjs/common';

import { StorageModule } from '../storage/storage.module';

import { StudyMaterialsController } from './study-materials.controller';
import { StudyMaterialsService } from './study-materials.service';

@Module({
  imports: [StorageModule],
  controllers: [StudyMaterialsController],
  providers: [StudyMaterialsService],
  exports: [StudyMaterialsService],
})
export class StudyMaterialsModule {}
