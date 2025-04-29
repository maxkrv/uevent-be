import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PaginationOptionsDto } from '../../shared/pagination';

export class GetTicketsDto extends PaginationOptionsDto {
  @ApiProperty({ required: false, example: 'vvnwerwerwewrjwnpesfw' })
  @IsOptional()
  @IsString()
  eventId?: string;
}
