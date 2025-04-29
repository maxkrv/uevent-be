import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { PaginationOptionsDto } from '@/shared/pagination';

export enum CompanySortBy {
  NAME = 'name',
  EVENTS = 'events',
  NEWEST = 'newest',
  OLDEST = 'oldest',
}
export class GetCompanyDto extends IntersectionType(PaginationOptionsDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  lat?: number;
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  lng?: number;

  @ApiProperty({ required: false, enum: CompanySortBy })
  @IsOptional()
  @IsEnum(CompanySortBy)
  sortBy?: CompanySortBy;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Boolean)
  isVerified?: boolean;
}
