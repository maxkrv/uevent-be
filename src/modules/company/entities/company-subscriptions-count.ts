import { ApiProperty } from '@nestjs/swagger';

export class CompanySubscriptionsCount {
  @ApiProperty({ example: 112432 })
  companySubscriptions: number;

  constructor(companySubscriptions: number) {
    this.companySubscriptions = companySubscriptions;
  }
}
