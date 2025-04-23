import { ApiProperty } from '@nestjs/swagger';
import { EventFormatType, EventThemeType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
} from 'class-validator';

const DEFAULT_EVENTS_SEARCH_RADIUS = 10;

export class GetEventDto {
  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  page?: number;

  @ApiProperty({ required: false, maximum: 100 })
  @Max(100)
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number;

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

  @ApiProperty({
    required: false,
    description: 'Latitude for location-based search',
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  lat?: number;

  @ApiProperty({
    required: false,
    description: 'Longitude for location-based search',
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  lng?: number;

  @ApiProperty({
    required: false,
    description: 'Search radius in kilometers',
    default: DEFAULT_EVENTS_SEARCH_RADIUS,
  })
  @IsOptional()
  @Max(30)
  @IsNumber()
  @Transform(({ value }) =>
    value ? Number(value) : DEFAULT_EVENTS_SEARCH_RADIUS,
  )
  radius: number;
}
