import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { PaginationOptionsDto } from '@/shared/pagination';

import { AtLeastOneOf } from '../validators/at-least-one.validator';

export class GetCommentDto extends IntersectionType(PaginationOptionsDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  newsId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({
    enum: ['date', 'popularity'],
    default: 'date',
  })
  @IsOptional()
  @IsIn(['date', 'popularity'])
  sortBy?: 'date' | 'popularity';

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @AtLeastOneOf(['eventId', 'newsId', 'parentId'], {
    message:
      'At least one of eventId, companyNewsId, or parentId must be provided',
  })
  dummyValidatorField!: any;
}
