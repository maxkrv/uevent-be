import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/core/db/db.module';

import { CompanyNewsController } from './company-news.controller';
import { CompanyNewsService } from './company-news.service';

@Module({
  controllers: [CompanyNewsController],
  providers: [CompanyNewsService],
  imports: [DatabaseModule],
})
export class CompanyNewsModule {}
