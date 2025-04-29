import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { $Enums, Event, EventFormatType } from '@prisma/client';
import {
  ClassTransformOptions,
  Exclude,
  plainToClassFromExist,
  Type,
} from 'class-transformer';

import { BaseEntity } from '@/common/base/base.entity';
import { CompanyDescription } from '@/modules/company/entities/company.entity';
import { LocationDto } from '@/shared/dto/location.dto';
import { Paginated } from '@/shared/pagination';

class EventDescription implements Event {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  locationId: string;

  @ApiProperty({
    enum: $Enums.EventFormatType,
    example: $Enums.EventFormatType.CEREMONY,
  })
  themes: $Enums.EventThemeType[];

  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  id: string;
  @ApiProperty({ example: 'Acme Event' })
  title: string;
  @ApiProperty({
    example: 'Acme opens its doors to the public',
  })
  description: string;
  @ApiProperty({ example: 'https://example.com/poster.jpg' })
  posterUrl: string;
  @ApiProperty({ example: '2025-04-07T10:00:00Z' })
  publishDate: Date;
  @ApiProperty({ example: '2025-05-10T10:00:00Z' })
  startDate: Date;
  @ApiProperty({ example: '2025-05-10T18:00:00Z' })
  endDate: Date;
  @ApiProperty({ example: 20.0 })
  price: number;
  @ApiProperty({ example: 100 })
  maxAttendees: number;
  @ApiProperty({ example: true })
  showAttendeeList: boolean;
  @ApiProperty({ example: false })
  notifyOnNewAttendee: boolean;
  @ApiProperty({
    enum: EventFormatType,
  })
  format: EventFormatType;
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  creatorId: string;
  @ApiProperty({ example: 'cl8d2k3f7000012xj5wl8a2hj' })
  companyId: string;
  @Exclude()
  stripeProductId: string;
  @Exclude()
  stripePriceId: string;
  @Exclude()
  createdAt: Date;
  @Exclude()
  updatedAt: Date;
}

export class EventRelations {
  @ApiProperty({
    type: () => LocationDto,
  })
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({ type: () => CompanyDescription })
  @Type(() => CompanyDescription)
  company: CompanyDescription;
}

export class EventEntity
  extends IntersectionType(EventDescription, EventRelations)
  implements BaseEntity
{
  constructor(data: Event, options?: ClassTransformOptions) {
    super();
    plainToClassFromExist(this, data, options);
  }
}

export class PaginatedEvent extends Paginated<EventEntity> {
  @Type(() => EventEntity)
  @ApiProperty({ type: EventEntity, isArray: true })
  declare items: EventEntity[];
}
