import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from '@/core/db/db.module';
import { FileUploadModule } from '@/core/file-upload/file-upload.module';

import { StripeModule } from '../stripe/stripe.module';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { CompanyNewsModule } from './company-news/company-news.module';

@Module({
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
  imports: [
    CompanyNewsModule,
    DatabaseModule,
    StripeModule,
    ConfigModule,
    FileUploadModule,
  ],
})
export class CompanyModule {}
