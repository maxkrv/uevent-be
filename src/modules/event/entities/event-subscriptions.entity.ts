import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { EventSubscription } from '@prisma/client';
import {
  ClassTransformOptions,
  Exclude,
  plainToClassFromExist,
  Type,
} from 'class-transformer';

import { BaseEntity } from '@/common/base/base.entity';
import { UserEntity } from '@/core/user/entities/user.entity';
import { Paginated } from '@/shared/pagination';

import { EventEntity } from './event.entity';

class EventSubscriptionDescription implements EventSubscription {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  id: string;
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  eventId: string;
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  userId: string;
  @Exclude()
  createdAt: Date;
}

export class EventSubscriptionRelations {
  @Type(() => EventEntity)
  @ApiProperty({ required: true, type: EventEntity })
  event: EventEntity;

  @Type(() => UserEntity)
  // @ApiProperty({ required: false, type: UserEntity })
  user?: UserEntity;
}

export class EventSubscriptionEntity
  extends IntersectionType(
    EventSubscriptionDescription,
    EventSubscriptionRelations,
  )
  implements BaseEntity
{
  constructor(data: EventSubscription, options?: ClassTransformOptions) {
    super();
    plainToClassFromExist(this, data, options);
  }
}

export class PaginatedEventSubscription extends Paginated<EventSubscriptionEntity> {
  @Type(() => EventSubscriptionEntity)
  @ApiProperty({ type: EventSubscriptionEntity, isArray: true })
  declare items: EventSubscriptionEntity[];
}
