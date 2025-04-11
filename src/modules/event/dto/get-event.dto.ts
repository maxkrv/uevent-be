import { IntersectionType } from '@nestjs/swagger';

import { PaginationOptionsDto } from '@/shared/pagination';

export class GetEventDto extends IntersectionType(PaginationOptionsDto) {}
