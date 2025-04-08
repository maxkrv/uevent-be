import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateCompanyNewsDto } from './create-company-news.dto';

export class UpdateCompanyNewsDto extends PartialType(
  OmitType(CreateCompanyNewsDto, ['companyId']),
) {}
