import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/core/db/db.module';

import { NotificationModule } from '../notifications/notification.module';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

@Module({
  controllers: [CommentController],
  providers: [CommentService],
  imports: [DatabaseModule, NotificationModule],
})
export class CommentModule {}
