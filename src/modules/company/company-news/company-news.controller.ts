import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';

import { Prefix } from '@/common/enums/prefix.enum';
import { JwtPayload } from '@/core/auth/interface/jwt.interface';
import { GetCurrentUser, Public } from '@/shared/decorators';
import { IDDto } from '@/shared/dto';
import { PaginationOptionsDto } from '@/shared/pagination';

import {
  CompanyNewsEntity,
  PaginatedCompanyNewsEntity,
} from './company-news.entity';
import { CompanyNewsService } from './company-news.service';
import { CreateCompanyNewsDto } from './dto/create-company-news.dto';
import { UpdateCompanyNewsDto } from './dto/update-company-news.dto';

@Controller(Prefix.COMPANIES_NEWS)
export class CompanyNewsController {
  constructor(private readonly companyNewsService: CompanyNewsService) {}

  @ApiBearerAuth()
  @ApiOkResponse({ type: CompanyNewsEntity })
  @Post()
  async create(
    @Body() dto: CreateCompanyNewsDto,
    @GetCurrentUser() { sub }: JwtPayload,
  ) {
    return new CompanyNewsEntity(
      await this.companyNewsService.create(sub, dto),
    );
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: CompanyNewsEntity })
  @Patch(':id')
  async update(
    @Body() dto: UpdateCompanyNewsDto,
    @Param() { id }: IDDto,
    @GetCurrentUser() { sub }: JwtPayload,
  ) {
    return new CompanyNewsEntity(
      await this.companyNewsService.update(id, dto, sub),
    );
  }

  @ApiOkResponse({ type: PaginatedCompanyNewsEntity, isArray: true })
  @Public()
  @Get('/company/:id')
  getCompanyNews(@Query() dto: PaginationOptionsDto, @Param() { id }: IDDto) {
    return this.companyNewsService.findAllByCompany(id, dto);
  }

  @Public()
  @ApiOkResponse({ type: CompanyNewsEntity })
  @Get(':id')
  async findOne(@Param() { id }: IDDto) {
    return new CompanyNewsEntity(await this.companyNewsService.findById(id));
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: CompanyNewsEntity })
  @Delete(':id')
  async delete(@Param() { id }: IDDto, @GetCurrentUser() { sub }: JwtPayload) {
    return new CompanyNewsEntity(await this.companyNewsService.delete(sub, id));
  }
}
