import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { NotificationService } from '@/modules/notifications/notification.service';

@Injectable()
export class NotificationCronService {
  constructor(private readonly notificationService: NotificationService) {}

  // avoid double sending
  @Cron(CronExpression.EVERY_30_MINUTES)
  public async eventRemind(): Promise<void> {
    await this.notificationService.sendEventReminderNotification();
  }
}
