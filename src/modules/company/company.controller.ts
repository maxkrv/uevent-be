import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

import { Prefix } from '@/common/enums/prefix.enum';
import { Success } from '@/core/auth/dto/success.dto';
import { UrlResponse } from '@/core/auth/dto/url.dto';
import { JwtPayload } from '@/core/auth/interface/jwt.interface';
import {
  IMG_ALLOWED_TYPES,
  IMG_MAX_SIZE,
} from '@/core/file-upload/file-upload.contsants';
import {
  UploadFileSizeValidator,
  UploadFileTypeValidator,
} from '@/core/file-upload/validators';
import { GetCurrentUser, Public } from '@/shared/decorators';
import { IDDto } from '@/shared/dto';
import { PaginationOptionsDto } from '@/shared/pagination';

import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import {
  CreatePromoCodeDto,
  PromoCodeQueryDto,
} from './dto/create-promo-code.dto';
import { GetCompanyDto } from './dto/get-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyEntity, PaginatedCompany } from './entities/company.entity';
import { CompanySubscriptionsCount } from './entities/company-subscriptions-count';
import {
  PaginatedPromoCode,
  PromoCodeEntity,
} from './entities/promo-code.entity';

@Controller(Prefix.COMPANIES)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @ApiBearerAuth()
  @ApiOkResponse({ type: CompanyEntity })
  @Post()
  async create(
    @Body() dto: CreateCompanyDto,
    @GetCurrentUser() { sub }: JwtPayload,
  ) {
    return new CompanyEntity(await this.companyService.create(sub, dto));
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: CompanyEntity })
  @Patch(':id')
  async update(
    @Body() dto: UpdateCompanyDto,
    @GetCurrentUser() { sub }: JwtPayload,
    @Param() { id }: IDDto,
  ) {
    return new CompanyEntity(await this.companyService.update(id, dto, sub));
  }

  @Public()
  @ApiOkResponse({ type: PaginatedCompany, isArray: true })
  @Get()
  async findAll(@Query() dto: GetCompanyDto) {
    return this.companyService.findAll(dto);
  }

  @Public()
  @ApiOkResponse({ type: CompanySubscriptionsCount })
  @Get('subscriptions/count')
  async getTotalSubscribersCount() {
    return new CompanySubscriptionsCount(
      await this.companyService.getTotalSubscribers(),
    );
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: PaginatedCompany, isArray: true })
  @Get('my')
  async findMy(
    @GetCurrentUser() { sub }: JwtPayload,
    @Query() dto: GetCompanyDto,
  ) {
    return this.companyService.findAllByUserId(sub, dto);
  }

  @Public()
  @ApiBearerAuth()
  @ApiOkResponse({ type: CompanyEntity })
  @Get(':id')
  async findOne(@Param() { id }: IDDto) {
    return new CompanyEntity(await this.companyService.findById(id));
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: CompanyEntity })
  @Delete(':id')
  async delete(@GetCurrentUser() { sub }: JwtPayload, @Param() { id }: IDDto) {
    return new CompanyEntity(await this.companyService.delete(id, sub));
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: Success })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('logo'))
  @Patch(':id/logo')
  async updateLogo(
    @Param() { id }: IDDto,
    @GetCurrentUser() { sub }: JwtPayload,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addValidator(
          new UploadFileTypeValidator({ fileType: IMG_ALLOWED_TYPES }),
        )
        .addValidator(new UploadFileSizeValidator({ maxSize: IMG_MAX_SIZE }))
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          fileIsRequired: true,
        }),
    )
    logo: Express.Multer.File,
  ) {
    return this.companyService.updateImage(id, sub, logo, 'logo');
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: Success })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('cover'))
  @Patch(':id/cover')
  async updateCover(
    @Param() { id }: IDDto,
    @GetCurrentUser() { sub }: JwtPayload,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addValidator(
          new UploadFileTypeValidator({ fileType: IMG_ALLOWED_TYPES }),
        )
        .addValidator(new UploadFileSizeValidator({ maxSize: IMG_MAX_SIZE }))
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          fileIsRequired: true,
        }),
    )
    cover: Express.Multer.File,
  ) {
    return this.companyService.updateImage(id, sub, cover, 'cover');
  }

  @ApiBearerAuth()
  @ApiCreatedResponse({ type: Success })
  @Post(':id/subscribe')
  async subscribe(
    @GetCurrentUser() { sub }: JwtPayload,
    @Param() { id }: IDDto,
  ) {
    return await this.companyService.subscribe(id, sub);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: Success })
  @Delete(':id/unsubscribe')
  async unsubscribe(
    @GetCurrentUser() { sub }: JwtPayload,
    @Param() { id }: IDDto,
  ) {
    return this.companyService.unsubscribe(id, sub);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: UrlResponse })
  @Post(':id/onboarding-link')
  async createOnboardingLink(
    @GetCurrentUser() { sub }: JwtPayload,
    @Param() { id }: IDDto,
  ) {
    return this.companyService.createOnboardingLink(id, sub);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: UrlResponse })
  @Post(':id/dashboard-link')
  async createDashboardLink(
    @GetCurrentUser() { sub }: JwtPayload,
    @Param() { id }: IDDto,
  ) {
    return this.companyService.createDashboardLink(id, sub);
  }

  @ApiBearerAuth()
  @ApiCreatedResponse({ type: PromoCodeEntity })
  @Post(':id/promo-code')
  async createPromoCode(
    @Param() { id }: IDDto,
    @Body() dto: CreatePromoCodeDto,
    @GetCurrentUser() { sub }: JwtPayload,
  ) {
    return new PromoCodeEntity(
      await this.companyService.createPromoCode(id, sub, dto),
    );
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: Success })
  @Delete(':id/promo-code/:promoCodeId')
  async deletePromoCode(@Param() { id, promoCodeId }: PromoCodeQueryDto) {
    return this.companyService.deletePromoCode(promoCodeId, id);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: PaginatedPromoCode, isArray: true })
  @Get(':id/promo-code')
  async findAllPromoCodes(
    @Param() { id }: IDDto,
    @GetCurrentUser() { sub }: JwtPayload,
    @Query() dto: PaginationOptionsDto,
  ) {
    return this.companyService.findAllPromoCodes(id, sub, dto);
  }
}
