import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { CompanyNews } from '@prisma/client';
import {
  ClassTransformOptions,
  Exclude,
  plainToClassFromExist,
  Type,
} from 'class-transformer';

import { BaseEntity } from '@/common/base/base.entity';
import { Paginated } from '@/shared/pagination';

import { CompanyEntity } from '../entities/company.entity';

class CompanyNewsDescription implements CompanyNews {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  id: string;
  @ApiProperty({ example: 'This is a news title' })
  title: string;
  @ApiProperty({ example: 'This is a news content' })
  content: string;
  @ApiProperty({ example: 'https://example.com/logo.jpg' })
  imageUrl: string;
  @ApiProperty({ example: '2025-04-02T16:27:17Z' })
  createdAt: Date;
  @Exclude()
  updatedAt: Date;
  @Exclude()
  companyId: string;
}

class CompanyNewsRelations {
  @Type(() => CompanyEntity)
  @ApiProperty({ type: CompanyEntity })
  company: CompanyEntity;
}

export class CompanyNewsEntity
  extends IntersectionType(CompanyNewsDescription, CompanyNewsRelations)
  implements BaseEntity
{
  constructor(data: CompanyNews, options?: ClassTransformOptions) {
    super();
    plainToClassFromExist(this, data, options);
  }
}

export class PaginatedCompanyNewsEntity extends Paginated<CompanyNews> {
  @Type(() => CompanyNewsEntity)
  @ApiProperty({ type: CompanyNewsEntity, isArray: true })
  declare items: CompanyNews[];
}
