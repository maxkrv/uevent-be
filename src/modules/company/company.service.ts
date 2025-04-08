import { Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '@/core/db/database.service';

import { PaginatedCompany } from './company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { GetCompanyDto } from './dto/get-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompanyService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(userId: string, dto: CreateCompanyDto) {
    return this.databaseService.company.create({
      data: {
        ...dto,
        ownerId: userId,
      },
    });
  }

  async update(id: string, dto: UpdateCompanyDto, userId: string) {
    const company = await this.databaseService.company.findUnique({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.databaseService.company.update({
      where: {
        id,
        ownerId: userId,
      },
      data: {
        ...dto,
      },
    });
  }

  async findAll(dto: GetCompanyDto) {
    const data = await this.databaseService.company.findMany({
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
    });
    const count = await this.databaseService.company.count();

    return new PaginatedCompany(data, count, dto);
  }

  async findAllByUserId(
    userId: string,
    dto: GetCompanyDto,
  ): Promise<PaginatedCompany> {
    const data = await this.databaseService.company.findMany({
      where: {
        ownerId: userId,
      },
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
    });

    const count = await this.databaseService.company.count({
      where: {
        ownerId: userId,
      },
    });

    return new PaginatedCompany(data, count, dto);
  }

  async findById(id: string) {
    const data = await this.databaseService.company.findUnique({
      where: {
        id,
      },
    });

    if (!data) {
      throw new NotFoundException('Company not found');
    }

    return data;
  }

  async delete(id: string, userId: string) {
    return this.databaseService.company
      .delete({
        where: {
          id,
          ownerId: userId,
        },
      })
      .catch(() => {
        throw new NotFoundException('Company not found');
      });
  }
}
