import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PaginationOptionsDto } from '@/shared/pagination';

export class GetAtendeesDto extends IntersectionType(PaginationOptionsDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
