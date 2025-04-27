import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { CompanySubscription } from '@prisma/client';
import {
  ClassTransformOptions,
  Exclude,
  plainToClassFromExist,
  Type,
} from 'class-transformer';

import { BaseEntity } from '@/common/base/base.entity';
import { UserEntity } from '@/core/user/entities/user.entity';
import { Paginated } from '@/shared/pagination';

import { CompanyEntity } from './company.entity';

class CompanySubscriptionDescription implements CompanySubscription {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  id: string;
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  companyId: string;
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  userId: string;
  @Exclude()
  createdAt: Date;
}

export class CompanySubscriptionRelations {
  @Type(() => CompanyEntity)
  @ApiProperty({ required: true, type: CompanyEntity })
  company: CompanyEntity;

  @Type(() => UserEntity)
  // @ApiProperty({ required: false, type: UserEntity })
  user?: UserEntity;
}

export class CompanySubscriptionEntity
  extends IntersectionType(
    CompanySubscriptionDescription,
    CompanySubscriptionRelations,
  )
  implements BaseEntity
{
  constructor(data: CompanySubscription, options?: ClassTransformOptions) {
    super();
    plainToClassFromExist(this, data, options);
  }
}

export class PaginatedCompanySubscription extends Paginated<CompanySubscriptionEntity> {
  @Type(() => CompanySubscriptionEntity)
  @ApiProperty({ type: CompanySubscriptionEntity, isArray: true })
  declare items: CompanySubscriptionEntity[];
}
