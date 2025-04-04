import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { DatabaseService } from '../db/database.service';
import { FileUploadService } from '../file-upload/file-upload.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  static USER_SELECT: Prisma.UserSelect = {
    id: true,
    email: true,
    name: true,
    avatar: true,
    bio: true,
    createdAt: true,
    updatedAt: true,
    role: true,
    sentNotifications: true,
    emailVerified: true,
  };

  async me(userId: string) {
    return this.databaseService.user.findUnique({
      where: {
        id: userId,
      },
      select: UserService.USER_SELECT,
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
      select: UserService.USER_SELECT,
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
      select: UserService.USER_SELECT,
    });
  }
}
