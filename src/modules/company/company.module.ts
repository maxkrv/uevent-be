import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/core/db/db.module';

import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { CompanyNewsModule } from './company-news/company-news.module';

@Module({
  controllers: [CompanyController],
  providers: [CompanyService],
  imports: [CompanyNewsModule, DatabaseModule],
})
export class CompanyModule {}
