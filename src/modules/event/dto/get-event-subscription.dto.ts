import { IntersectionType } from '@nestjs/swagger';

import { PaginationOptionsDto } from '@/shared/pagination';

export class GetEventSubscriptionDto extends IntersectionType(
  PaginationOptionsDto,
) {}
