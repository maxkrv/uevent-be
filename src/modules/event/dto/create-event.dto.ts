import { ApiProperty } from '@nestjs/swagger';
import { EventFormatType, EventThemeType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { LocationDto } from '@/shared/dto/location.dto';

import { ValidateDateInTheFuture } from '../validators/validate-date-in-the-future.validator';

export class CreateEventDto {
  @ApiProperty({ required: true, example: 'Acme Event' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @ApiProperty({
    required: true,
    example: 'Acme opens its doors to the public',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @ApiProperty({ required: false, example: 'https://example.com/poster.jpg' })
  @IsOptional()
  @IsUrl()
  posterUrl?: string;

  @ApiProperty({ required: false, example: '2025-04-10T10:00:00Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ValidateIf((o) => o.publishDate !== undefined)
  @ValidateDateInTheFuture({ message: 'Publish date cannot be in the past' })
  publishDate?: Date;

  @ApiProperty({ required: true, example: '2025-05-10T10:00:00Z' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  @ValidateDateInTheFuture({ message: 'Start date cannot be in the past' })
  startDate: Date;

  @ApiProperty({ required: true, example: '2025-05-10T18:00:00Z' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  @ValidateDateInTheFuture({ message: 'End date cannot be in the past' })
  endDate: Date;

  @ApiProperty({ required: false, type: () => LocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @ApiProperty({ required: false, example: 20.0, default: 0 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ required: false, example: 100 })
  @IsOptional()
  @IsInt()
  maxAttendees?: number;

  @ApiProperty({ required: false, example: true, default: true })
  @IsOptional()
  @IsBoolean()
  showAttendeeList?: boolean;

  @ApiProperty({ required: false, example: false, default: false })
  @IsOptional()
  @IsBoolean()
  notifyOnNewAttendee?: boolean;

  @ApiProperty({
    required: false,
    enum: EventFormatType,
    default: EventFormatType.OTHER,
  })
  @IsOptional()
  @IsEnum(EventFormatType)
  format?: EventFormatType;

  @ApiProperty({ required: true, example: 'cl8d2k3f7000012xj5wl8a2hj' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({
    required: true,
    example: [EventThemeType.ART],
  })
  @IsArray()
  @IsEnum(EventThemeType, { each: true })
  themes: EventThemeType[];
}
