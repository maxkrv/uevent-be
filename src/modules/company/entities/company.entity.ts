import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import { Company } from '@prisma/client';
import {
  ClassTransformOptions,
  Exclude,
  plainToClassFromExist,
  Type,
} from 'class-transformer';

import { BaseEntity } from '@/common/base/base.entity';
import { UserEntity } from '@/core/user/entities/user.entity';
import { LocationDto } from '@/shared/dto/location.dto';
import { Paginated } from '@/shared/pagination';

export class CompanyDescription implements Company {
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

  @Exclude()
  stripeAccountId: string;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty({ example: '2025-04-02T16:27:17Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-04-02T16:27:17Z' })
  updatedAt: Date;

  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  ownerId: string;

  @ApiProperty({ example: 'https://example.com/cover.jpg' })
  coverImage: string;

  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  locationId: string;
}

class CompanyRelations {
  @ApiProperty({
    type: () => LocationDto,
  })
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({ type: () => UserEntity })
  @Type(() => UserEntity)
  owner: UserEntity;
}

export class CompanyEntity
  extends IntersectionType(CompanyDescription, CompanyRelations)
  implements BaseEntity
{
  @ApiPropertyOptional()
  _count?: {
    events?: number;
    subscribers?: number;
  };
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
