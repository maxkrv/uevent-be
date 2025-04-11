import { ApiProperty } from '@nestjs/swagger';
import { Event, EventFormatType, EventLocation } from '@prisma/client';
import {
  ClassTransformOptions,
  Exclude,
  plainToClassFromExist,
  Type,
} from 'class-transformer';

import { BaseEntity } from '@/common/base/base.entity';
import { CompanyDescription } from '@/modules/company/company.entity';
import { Paginated } from '@/shared/pagination';

class EventLocationDescription implements EventLocation {
  @ApiProperty({ example: '123 Main St' })
  address: string;
  @ApiProperty({ example: 40.7128 })
  lat: number;
  @ApiProperty({ example: -74.006 })
  lng: number;
  @Exclude()
  id: string;
  @Exclude()
  eventId: string;
}

class EventDescription implements Event {
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
  @ApiProperty({
    type: () => EventLocationDescription,
    example: { address: '123 Main St', lat: 40.7128, lng: -74.006 },
  })
  @Type(() => EventLocationDescription)
  eventLocation: EventLocationDescription;
  @ApiProperty({ example: 'UDS' })
  currency: string;
  @ApiProperty({ example: 20.0 })
  price: number;
  @ApiProperty({ example: 100 })
  maxAttendees: number;
  @ApiProperty({ example: true })
  showAttendeeList: boolean;
  @ApiProperty({ example: false })
  notifyOnNewAttendee: boolean;
  @ApiProperty({ example: 'https://example.com/thank-you' })
  redirectUrl: string;
  @ApiProperty({
    enum: EventFormatType,
  })
  format: EventFormatType;
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  creatorId: string;
  @ApiProperty({ example: 'cl8d2k3f7000012xj5wl8a2hj' })
  companyId: string;
  @ApiProperty({ type: () => CompanyDescription })
  @Type(() => CompanyDescription)
  company: CompanyDescription;
  @Exclude()
  createdAt: Date;
  @Exclude()
  updatedAt: Date;
}

export class EventEntity extends EventDescription implements BaseEntity {
  constructor(data: Event, options?: ClassTransformOptions) {
    super();
    plainToClassFromExist(this, data, options);
  }
}

export class PaginatedEvent extends Paginated<Event> {
  @Type(() => EventEntity)
  @ApiProperty({ type: EventEntity, isArray: true })
  declare items: EventEntity[];
}
