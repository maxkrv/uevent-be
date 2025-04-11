import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/core/db/db.module';
import { FileUploadModule } from '@/core/file-upload/file-upload.module';

import { EventController } from './event.controller';
import { EventService } from './event.service';

@Module({
  controllers: [EventController],
  providers: [EventService],
  imports: [DatabaseModule, FileUploadModule],
})
export class EventModule {}
