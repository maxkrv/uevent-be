import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { NotificationModule } from '@/modules/notifications/notification.module';

import { DbCronService } from './db-cron.service';
import { NotificationCronService } from './notification-cron.service';

@Module({
  imports: [ScheduleModule.forRoot(), NotificationModule],
  providers: [DbCronService, NotificationCronService],
})
export class CronModule {}
