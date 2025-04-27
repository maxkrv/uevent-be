import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '@/core/db/database.service';

import { CreateReactionDto } from './dto/create-reaction.dto';
import { GetReactionDto } from './dto/get-reaction.dto';

@Injectable()
export class ReactionService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(dto: CreateReactionDto, userId: string) {
    if (!dto.commentId && !dto.newsId) {
      throw new BadRequestException(
        'Either commentId or newsId must be provided.',
      );
    }

    if (dto.commentId && dto.newsId) {
      throw new BadRequestException(
        'Only one of commentId or newsId must be provided.',
      );
    }

    const existingReaction = await this.databaseService.reaction.findFirst({
      where: {
        userId,
        commentId: dto.commentId,
        newsId: dto.newsId,
      },
    });

    if (existingReaction) {
      return this.databaseService.reaction.update({
        where: { id: existingReaction.id },
        data: {
          type: dto.type,
        },
      });
    }

    return await this.databaseService.reaction.create({
      data: {
        userId,
        type: dto.type,
        commentId: dto.commentId,
        newsId: dto.newsId,
      },
    });
  }

  async getReactionCount(dto: GetReactionDto) {
    if (!dto.commentId && !dto.newsId) {
      throw new BadRequestException(
        'Either commentId or newsId must be provided',
      );
    }

    const whereClause = dto.commentId
      ? { commentId: dto.commentId }
      : { newsId: dto.newsId };

    const grouped = await this.databaseService.reaction.groupBy({
      by: ['type'],
      where: whereClause,
      _count: {
        type: true,
      },
    });

    return grouped.map((item) => ({
      type: item.type,
      count: item._count.type,
    }));
  }

  async findAllByUserId(userId: string) {
    return this.databaseService.reaction.findMany({
      where: {
        userId,
      },
    });
  }

  async delete(userId: string, id: string) {
    const reaction = await this.databaseService.reaction.findUnique({
      where: { id },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    if (reaction.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this reaction',
      );
    }

    return this.databaseService.reaction.delete({ where: { id } }).catch(() => {
      throw new NotFoundException('Reaction not found');
    });
  }
}
