import { Module } from '@nestjs/common';

import { StorageModule } from '../storage/storage.module';

import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';

@Module({
  imports: [StorageModule],
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService],
})
export class LibraryModule {}
