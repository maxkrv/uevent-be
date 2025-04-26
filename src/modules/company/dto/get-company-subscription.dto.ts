import { IntersectionType } from '@nestjs/swagger';

import { PaginationOptionsDto } from '@/shared/pagination';

export class GetCompanySubscriptionDto extends IntersectionType(
  PaginationOptionsDto,
) {}
