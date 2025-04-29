import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from '@/core/db/db.module';
import { FileUploadModule } from '@/core/file-upload/file-upload.module';

import { NotificationModule } from '../notifications/notification.module';
import { StripeModule } from '../stripe/stripe.module';
import { EventController } from './event.controller';
import { EventService } from './event.service';

@Module({
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
  imports: [
    DatabaseModule,
    FileUploadModule,
    StripeModule,
    NotificationModule,
    ConfigModule,
  ],
})
export class EventModule {}
