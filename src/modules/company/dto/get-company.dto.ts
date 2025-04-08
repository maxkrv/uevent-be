import { IntersectionType } from '@nestjs/swagger';

import { PaginationOptionsDto } from '@/shared/pagination';

export class GetCompanyDto extends IntersectionType(PaginationOptionsDto) {}
