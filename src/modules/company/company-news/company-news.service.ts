import { Injectable, NotFoundException } from '@nestjs/common';

import { Success } from '@/core/auth/dto/success.dto';
import { DatabaseService } from '@/core/db/database.service';
import { FileUploadService } from '@/core/file-upload/file-upload.service';
import { NotificationService } from '@/modules/notifications/notification.service';
import { PaginationOptionsDto } from '@/shared/pagination';

import { PaginatedCompanyNewsEntity } from './company-news.entity';
import { CreateCompanyNewsDto } from './dto/create-company-news.dto';
import { UpdateCompanyNewsDto } from './dto/update-company-news.dto';

@Injectable()
export class CompanyNewsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly fileUploadService: FileUploadService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(userId: string, dto: CreateCompanyNewsDto) {
    const company = await this.databaseService.company.findUnique({
      where: {
        id: dto.companyId,
        ownerId: userId,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const news = await this.databaseService.companyNews.create({
      data: dto,
      include: {
        company: true,
      },
    });

    this.notificationService.createNewsNotification(
      dto.companyId,
      userId,
      dto.title,
    );

    return news;
  }

  async update(id: string, dto: UpdateCompanyNewsDto, userId: string) {
    const newsItem = await this.databaseService.companyNews.findUnique({
      where: {
        id,
        company: {
          ownerId: userId,
        },
      },
    });

    if (!newsItem) {
      throw new NotFoundException('Company news not found');
    }

    return this.databaseService.companyNews.update({
      where: {
        id,
      },
      data: dto,
      include: {
        company: true,
      },
    });
  }

  async updateCover(id: string, userId: string, cover: Express.Multer.File) {
    const newsItem = await this.databaseService.companyNews.findUnique({
      where: {
        id,
        company: {
          ownerId: userId,
        },
      },
    });

    if (!newsItem) {
      throw new NotFoundException('Company news not found');
    }

    const { location } = await this.fileUploadService.upload(cover);

    await this.databaseService.companyNews.update({
      where: {
        id,
      },
      data: {
        imageUrl: location,
      },
    });

    return new Success();
  }

  async findAllByCompany(companyId: string, dto: PaginationOptionsDto) {
    const data = await this.databaseService.companyNews.findMany({
      where: {
        companyId,
      },
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
      include: {
        company: true,
      },
    });
    const count = await this.databaseService.companyNews.count();

    return new PaginatedCompanyNewsEntity(data, count, dto);
  }

  async findById(id: string) {
    const data = await this.databaseService.companyNews.findUnique({
      where: {
        id,
      },
      include: {
        company: { include: { location: true } },
      },
    });

    if (!data) {
      throw new NotFoundException('Company news not found');
    }

    return data;
  }

  async delete(userId: string, id: string) {
    return this.databaseService.companyNews
      .delete({
        where: {
          id,
          company: {
            ownerId: userId,
          },
        },
      })
      .catch(() => {
        throw new NotFoundException('Company news not found');
      });
  }
}
