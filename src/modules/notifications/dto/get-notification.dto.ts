import { IntersectionType } from '@nestjs/swagger';

import { PaginationOptionsDto } from '@/shared/pagination';

export class GetNotificationDto extends IntersectionType(
  PaginationOptionsDto,
) {}
