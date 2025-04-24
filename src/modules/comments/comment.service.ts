import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { DatabaseService } from '@/core/db/database.service';

import { PaginatedComment } from '../comments/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentDto } from './dto/get-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentService {
  constructor(private readonly databaseService: DatabaseService) {}

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

    return this.databaseService.comment.create({
      data: {
        ...dto,
        userId,
      },
      include: {
        user: true,
      },
    });
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
    const where: Prisma.CommentWhereInput = {};

    if (dto.eventId) where.eventId = dto.eventId;
    if (dto.companyNewsId) where.companyNewsId = dto.companyNewsId;
    if (dto.parentId) where.parentId = dto.parentId;
    if (dto.userId) where.userId = dto.userId;

    const sortBy = dto.sortBy || 'date';
    const sortOrder = dto.sortOrder || 'desc';

    const data = await this.databaseService.comment.findMany({
      where,
      include: {
        user: true,
        _count:
          sortBy === 'popularity'
            ? {
                select: { reactions: true },
              }
            : undefined,
      },
      orderBy: {
        reactions:
          sortBy === 'popularity'
            ? {
                _count: sortOrder,
              }
            : undefined,
        createdAt: sortBy === 'date' ? sortOrder : undefined,
      },
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
    });

    const count = await this.databaseService.comment.count({ where });

    return new PaginatedComment(data, count, dto);
  }
}
