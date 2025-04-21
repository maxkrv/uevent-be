import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { $Enums, Ticket } from '@prisma/client';
import {
  ClassTransformOptions,
  Exclude,
  plainToClassFromExist,
  Type,
} from 'class-transformer';

import { BaseEntity } from '@/common/base/base.entity';
import { UserEntity } from '@/core/user/entities/user.entity';
import { Paginated } from '@/shared/pagination';

import { EventEntity } from '../event/entities/event.entity';

class TicketDescription implements Ticket {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  id: string;

  @ApiProperty({ example: '2025-04-02T16:27:17Z' })
  purchaseDate: Date;

  @ApiProperty({
    enum: $Enums.TicketStatusType,
    example: $Enums.TicketStatusType.VALID,
  })
  status: $Enums.TicketStatusType;

  @Exclude()
  attendeeId: string;

  @Exclude()
  promoCodeId: string;

  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  eventId: string;

  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  userId: string;
}

class TicketRelations {
  @Type(() => UserEntity)
  @ApiProperty({ type: UserEntity })
  user: UserEntity;

  @Type(() => EventEntity)
  @ApiProperty({ type: EventEntity })
  event: EventEntity;
}

export class TicketEntity
  extends IntersectionType(TicketDescription, TicketRelations)
  implements BaseEntity
{
  constructor(data: Ticket, options?: ClassTransformOptions) {
    super();
    plainToClassFromExist(this, data, options);
  }
}

export class PaginatedTickets extends Paginated<Ticket> {
  @Type(() => TicketEntity)
  @ApiProperty({ type: () => TicketEntity, isArray: true })
  declare items: Ticket[];
}
