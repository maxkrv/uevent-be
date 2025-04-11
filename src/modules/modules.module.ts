import { Module } from '@nestjs/common';

import { CompanyModule } from './company/company.module';
import { EventModule } from './event/event.module';

@Module({
  imports: [CompanyModule, EventModule],
})
export class ModulesModule {}
