import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { EventAttendee } from '@prisma/client';
import {
  ClassTransformOptions,
  Exclude,
  plainToClassFromExist,
  Type,
} from 'class-transformer';

import { BaseEntity } from '@/common/base/base.entity';
import { UserEntity } from '@/core/user/entities/user.entity';
import { TicketEntity } from '@/modules/tickets/ticket.entity';
import { Paginated } from '@/shared/pagination';

import { EventEntity } from './event.entity';

class EventAtendeesDescription implements EventAttendee {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  id: string;
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  userId: string;
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  eventId: string;
  @Exclude()
  createdAt: Date;
}

export class EventAtendeesRelations {
  @Type(() => UserEntity)
  // @ApiProperty({ required: false, type: UserEntity })
  user?: UserEntity;
  @Type(() => EventEntity)
  // @ApiProperty({ required: false, type: EventEntity })
  event?: EventEntity;
  @Type(() => TicketEntity)
  // @ApiProperty({ required: false, type: TicketEntity })
  ticket?: TicketEntity;
}

export class EventAtendeesEntity
  extends IntersectionType(EventAtendeesDescription, EventAtendeesRelations)
  implements BaseEntity
{
  constructor(data: Event, options?: ClassTransformOptions) {
    super();
    plainToClassFromExist(this, data, options);
  }
}

export class PaginatedEventAtendees extends Paginated<EventAtendeesEntity> {
  @Type(() => EventAtendeesEntity)
  @ApiProperty({ type: EventAtendeesEntity, isArray: true })
  declare items: EventAtendeesEntity[];
}
