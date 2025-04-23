import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { EventFormatType, EventThemeType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { PaginationOptionsDto } from '@/shared/pagination';

export class GetEventDto extends IntersectionType(PaginationOptionsDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(EventFormatType, { each: true })
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  format?: EventFormatType[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(EventThemeType, { each: true })
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  themes?: EventThemeType[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  fromDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  toDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  priceFrom?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  priceTo?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(['date', 'price-low', 'price-high', 'name'], { each: true })
  sort?: 'date' | 'price-low' | 'price-high' | 'name';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  lat?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  lng?: number;
}
