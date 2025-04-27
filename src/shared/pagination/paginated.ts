import { ApiProperty } from '@nestjs/swagger';
import {
  ClassTransformOptions,
  plainToClassFromExist,
  Type,
} from 'class-transformer';

import { PaginationOptionsDto } from './pagination-options.dto';

const DEFAULT_ITEMS_LIMIT = 20;

class PaginationMeta {
  @ApiProperty({ example: 1 })
  totalItemsCount: number;

  @ApiProperty({ example: DEFAULT_ITEMS_LIMIT })
  itemsPerPage: number;

  @ApiProperty({ example: 1 })
  currentPage: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}

export class Paginated<TData extends object> {
  items: TData[];
  @ApiProperty()
  @Type(() => PaginationMeta)
  meta: PaginationMeta;

  constructor(
    data: TData[],
    count: number,
    opt: PaginationOptionsDto,
    options?: ClassTransformOptions,
  ) {
    plainToClassFromExist(this, Paginated.paginate(data, count, opt), options);
  }

  static paginate<TData extends object>(
    data: TData[],
    count: number,
    opt: PaginationOptionsDto,
  ): Paginated<TData> {
    return {
      items: data,
      meta: {
        totalItemsCount: count,
        itemsPerPage: opt.limit,
        currentPage: opt.page,
        totalPages: Math.ceil(count / opt.limit),
      },
    };
  }
}
