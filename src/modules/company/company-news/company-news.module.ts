import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/core/db/db.module';
import { FileUploadModule } from '@/core/file-upload/file-upload.module';
import { NotificationModule } from '@/modules/notifications/notification.module';

import { CompanyNewsController } from './company-news.controller';
import { CompanyNewsService } from './company-news.service';

@Module({
  controllers: [CompanyNewsController],
  providers: [CompanyNewsService],
  imports: [DatabaseModule, FileUploadModule, NotificationModule],
})
export class CompanyNewsModule {}
