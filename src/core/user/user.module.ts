import { Module } from '@nestjs/common';

import { ApiConfigModule } from '../../config/api-config.module';
import { CompanyModule } from '../../modules/company/company.module';
import { EventModule } from '../../modules/event/event.module';
import { DatabaseService } from '../db/database.service';
import { DatabaseModule } from '../db/db.module';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { FileUploadService } from '../file-upload/file-upload.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    ApiConfigModule,
    DatabaseModule,
    FileUploadModule,
    EventModule,
    CompanyModule,
  ],
  controllers: [UserController],
  providers: [DatabaseService, UserService, FileUploadService, ApiConfigModule],
})
export class UserModule {}
