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

import { CompanyEntity, PaginatedCompany } from './company.entity';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { GetCompanyDto } from './dto/get-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

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
  @Patch('update/:id')
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
}
