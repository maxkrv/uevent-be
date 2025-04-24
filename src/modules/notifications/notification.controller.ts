import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';

import { Prefix } from '@/common/enums/prefix.enum';
import { JwtPayload } from '@/core/auth/interface/jwt.interface';
import { GetCurrentUser } from '@/shared/decorators';
import { IDDto } from '@/shared/dto';

import { GetNotificationDto } from './dto/get-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  NotificationEntity,
  PaginatedNotification,
} from './notification.entity';
import { NotificationService } from './notification.service';

@Controller(Prefix.NOTIFICATIONS)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiBearerAuth()
  @ApiOkResponse({ type: PaginatedNotification, isArray: true })
  @Get('my')
  async findMy(
    @GetCurrentUser() { sub }: JwtPayload,
    @Query() dto: GetNotificationDto,
  ) {
    return this.notificationService.findAllByUserId(sub, dto);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: NotificationEntity })
  @Patch(':id')
  async update(
    @Body() dto: UpdateNotificationDto,
    @GetCurrentUser() { sub }: JwtPayload,
    @Param() { id }: IDDto,
  ) {
    return new NotificationEntity(
      await this.notificationService.update(id, dto, sub),
    );
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: NotificationEntity })
  @Delete(':id')
  async delete(@GetCurrentUser() { sub }: JwtPayload, @Param() { id }: IDDto) {
    return new NotificationEntity(
      await this.notificationService.delete(id, sub),
    );
  }
}
