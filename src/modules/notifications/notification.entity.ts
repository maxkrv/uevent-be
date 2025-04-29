import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Notification } from '@prisma/client';
import {
  ClassTransformOptions,
  plainToClassFromExist,
  Type,
} from 'class-transformer';

import { BaseEntity } from '@/common/base/base.entity';
import { UserEntity } from '@/core/user/entities/user.entity';
import { Paginated } from '@/shared/pagination';

class NotificationDescription implements Notification {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  id: string;
  @ApiProperty({ example: 'EVENT_REMINDER' })
  type: string;
  @ApiProperty({ example: 'Hi there!' })
  title: string;
  @ApiProperty({ example: 'This is a reminder for your event.' })
  content: string;
  @ApiProperty({ example: 'false' })
  isRead: boolean;
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  userId: string;
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  sentById: string;
  @ApiProperty({ example: 'https://example.com', required: false })
  link: string | undefined;
  @ApiProperty({ example: new Date().toISOString() })
  createdAt: Date;
}

class NotificationRelations {
  @Type(() => UserEntity)
  // @ApiProperty({ required: false, type: UserEntity })
  user?: UserEntity;
}

export class NotificationEntity
  extends IntersectionType(NotificationDescription, NotificationRelations)
  implements BaseEntity
{
  constructor(data: Notification, options?: ClassTransformOptions) {
    super();
    plainToClassFromExist(this, data, options);
  }
}

export class PaginatedNotification extends Paginated<NotificationEntity> {
  @Type(() => NotificationEntity)
  @ApiProperty({ type: NotificationEntity, isArray: true })
  declare items: NotificationEntity[];
}
