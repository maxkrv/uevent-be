import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '@/core/db/database.service';

import { PaginatedComment } from '../comments/comment.entity';
import { NotificationService } from '../notifications/notification.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentDto } from './dto/get-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(userId: string, dto: CreateCommentDto) {
    if (!dto.eventId && !dto.companyNewsId && !dto.parentId) {
      throw new BadRequestException(
        'Either eventId or companyNewsId or parentId must be provided',
      );
    }

    if (dto.eventId) {
      const event = await this.databaseService.event.findUnique({
        where: { id: dto.eventId },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }
    }

    if (dto.companyNewsId) {
      const news = await this.databaseService.companyNews.findUnique({
        where: { id: dto.companyNewsId },
      });

      if (!news) {
        throw new NotFoundException('Company news not found');
      }
    }

    if (dto.parentId) {
      const parentComment = await this.databaseService.comment.findUnique({
        where: { id: dto.parentId },
      });

      if (!parentComment) {
        throw new NotFoundException('Reply target comment not found');
      }
    }

    const comment = await this.databaseService.comment.create({
      data: {
        ...dto,
        userId,
      },
      include: {
        user: true,
      },
    });

    if (dto.parentId) {
      const parentComment = await this.databaseService.comment.findUnique({
        where: { id: dto.parentId },
        select: {
          userId: true,
        },
      });

      if (parentComment && parentComment.userId !== userId) {
        this.notificationService.createCommentReplyNotification({
          recipientId: parentComment.userId,
          senderId: userId,
          commentContent: dto.content,
          commentId: dto.parentId,
        });
      }
    }

    return comment;
  }

  async update(id: string, dto: UpdateCommentDto, userId: string) {
    const comment = await this.databaseService.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this comment',
      );
    }

    return this.databaseService.comment.update({
      where: {
        id,
      },
      data: {
        ...dto,
      },
      include: {
        user: true,
      },
    });
  }

  async findById(id: string) {
    const data = await this.databaseService.comment.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
      },
    });

    if (!data) {
      throw new NotFoundException('Comment not found');
    }

    return data;
  }

  async delete(userId: string, id: string) {
    const comment = await this.databaseService.comment.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this comment',
      );
    }

    return this.databaseService.comment.delete({ where: { id } }).catch(() => {
      throw new NotFoundException('Comment not found');
    });
  }

  async findAll(dto: GetCommentDto) {
    const where: any = {};
    if (dto.eventId) where.eventId = dto.eventId;
    if (dto.companyNewsId) where.companyNewsId = dto.companyNewsId;
    if (dto.parentId) where.parentId = dto.parentId;

    const sortBy = dto.sortBy || 'date';
    const sortOrder = dto.sortOrder || 'desc';

    if (sortBy === 'popularity') {
      const data = await this.databaseService.comment.findMany({
        where,
        include: {
          user: true,
          _count: {
            select: { reactions: true },
          },
        },
        orderBy: {
          reactions: {
            _count: sortOrder,
          },
        },
        skip: (dto.page - 1) * dto.limit,
        take: dto.limit,
      });

      const count = await this.databaseService.comment.count({ where });

      return new PaginatedComment(data, count, dto);
    } else {
      const data = await this.databaseService.comment.findMany({
        where,
        include: {
          user: true,
        },
        orderBy: {
          createdAt: sortOrder,
        },
        skip: (dto.page - 1) * dto.limit,
        take: dto.limit,
      });

      const count = await this.databaseService.comment.count({ where });

      return new PaginatedComment(data, count, dto);
    }
  }
}
