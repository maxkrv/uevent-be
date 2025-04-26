import { ApiProperty } from '@nestjs/swagger';
import { PromoCode } from '@prisma/client';
import { Exclude, plainToClassFromExist, Type } from 'class-transformer';

import { BaseEntity } from '@/common/base/base.entity';
import { Paginated } from '@/shared/pagination';

class PromoCodeDescription implements PromoCode {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  id: string;

  @Exclude()
  companyId: string;

  @ApiProperty({ example: 'ABCD' })
  code: string;

  @ApiProperty({ example: 400 })
  maxUses: number;

  @ApiProperty({ example: 20 })
  uses: number;

  @ApiProperty({ example: 20 })
  discount: number;

  @Exclude()
  stripeId: string;

  @Exclude()
  stripeCouponId: string;
}

export class PromoCodeEntity
  extends PromoCodeDescription
  implements BaseEntity
{
  constructor(promo: PromoCode) {
    super();
    plainToClassFromExist(this, promo);
  }
}

export class PaginatedPromoCode extends Paginated<PromoCode> {
  @Type(() => PromoCodeEntity)
  @ApiProperty({ type: PromoCodeEntity, isArray: true })
  declare items: PromoCodeEntity[];
}
