import { ApiProperty } from '@nestjs/swagger';
import { Company } from '@prisma/client';
import {
  ClassTransformOptions,
  Exclude,
  plainToClassFromExist,
  Type,
} from 'class-transformer';

import { BaseEntity } from '@/common/base/base.entity';
import { Paginated } from '@/shared/pagination';

class CompanyDescription implements Company {
  @ApiProperty({ example: 'Acme Corporation' })
  name: string;
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  id: string;
  @ApiProperty({ example: 'info@acme.com' })
  email: string;
  @ApiProperty({ example: 'description' })
  description: string;
  @ApiProperty({ example: 'https://example.com/logo.jpg' })
  logo: string;
  @ApiProperty({ example: 'https://acme.com' })
  website: string;
  @ApiProperty({ example: '123 Main St, City, Country' })
  location: string;
  @Exclude()
  createdAt: Date;
  @Exclude()
  updatedAt: Date;
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  ownerId: string;
}

export class CompanyEntity extends CompanyDescription implements BaseEntity {
  constructor(data: Company, options?: ClassTransformOptions) {
    super();
    plainToClassFromExist(this, data, options);
  }
}

export class PaginatedCompany extends Paginated<Company> {
  @Type(() => CompanyEntity)
  @ApiProperty({ type: CompanyEntity, isArray: true })
  declare items: CompanyEntity[];
}
