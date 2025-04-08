import { Module } from '@nestjs/common';

import { CompanyModule } from './company/company.module';

@Module({
  imports: [CompanyModule],
})
export class ModulesModule {}
