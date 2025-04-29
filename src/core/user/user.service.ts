import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CompanySubscriptionEntity } from '../../modules/company/entities/company-subscrtiptions.entity';
import { EventSubscriptionEntity } from '../../modules/event/entities/event-subscriptions.entity';
import { DatabaseService } from '../db/database.service';
import { FileUploadService } from '../file-upload/file-upload.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  private include: Prisma.UserInclude = {
    settings: true,
  };

  async me(userId: string) {
    return this.databaseService.user.findUnique({
      where: {
        id: userId,
      },
      include: this.include,
    });
  }

  async findMyEventsSubscriptions(
    userId: string,
  ): Promise<EventSubscriptionEntity[]> {
    const subscriptions = await this.databaseService.eventSubscription.findMany(
      {
        where: {
          userId,
        },
        include: {
          event: {
            include: {
              location: true,
              company: true,
            },
          },
        },
      },
    );
    return subscriptions.map((sub) => new EventSubscriptionEntity(sub));
  }
  async findMyCompaniesSubscriptions(
    userId: string,
  ): Promise<CompanySubscriptionEntity[]> {
    const subscriptions =
      await this.databaseService.companySubscription.findMany({
        where: {
          userId,
        },
        include: {
          company: {
            include: {
              location: true,
              _count: {
                select: {
                  events: true,
                  subscribers: true,
                },
              },
            },
          },
        },
      });
    return subscriptions.map((sub) => new CompanySubscriptionEntity(sub));
  }
  async getById(userId: string) {
    return this.databaseService.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const { location: avatar } = await this.fileUploadService.upload(file);

    return await this.databaseService.user.update({
      where: {
        id: userId,
      },
      data: {
        avatar,
      },
      include: this.include,
    });
  }

  async update(userId: string, dto: UpdateUserDto) {
    return this.databaseService.user.update({
      where: {
        id: userId,
      },
      data: {
        ...dto,
      },
      include: this.include,
    });
  }

  async updateSettings(userId: string, dto: UpdateUserSettingsDto) {
    return this.databaseService.user.update({
      where: {
        id: userId,
      },
      data: {
        settings: {
          upsert: {
            create: {
              ...dto,
            },
            update: {
              ...dto,
            },
            where: {
              userId,
            },
          },
        },
      },
      include: this.include,
    });
  }
}
