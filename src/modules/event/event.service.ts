import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { DatabaseService } from '@/core/db/database.service';

import { FileUploadService } from '../../core/file-upload/file-upload.service';
import { CreateEventDto } from './dto/create-event.dto';
import { GetEventDto } from './dto/get-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PaginatedEvent } from './event.entity';

@Injectable()
export class EventService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  static include: Prisma.EventInclude = {
    eventLocation: true,
    company: true,
  };

  async create(userId: string, dto: CreateEventDto) {
    const company = await this.databaseService.company.findUnique({
      where: { id: dto.companyId },
      select: { ownerId: true },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to create an event for this company',
      );
    }

    return this.databaseService.event.create({
      data: {
        ...dto,
        creatorId: userId,
        companyId: dto.companyId,
        eventLocation: {
          create: dto.eventLocation,
        },
      },
      include: EventService.include,
    });
  }

  async update(id: string, dto: UpdateEventDto, userId: string) {
    const event = await this.databaseService.event.findUnique({
      where: { id },
      include: { creator: true, eventLocation: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.creatorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this event',
      );
    }

    const shouldRemoveLocation =
      'eventLocation' in dto
        ? dto.eventLocation === null
        : !!event.eventLocation;

    const shouldUpsertLocation =
      'eventLocation' in dto && dto.eventLocation !== null;

    const eventLocationAction = shouldRemoveLocation
      ? { delete: true }
      : shouldUpsertLocation
        ? {
            upsert: {
              create: { ...dto.eventLocation },
              update: { ...dto.eventLocation },
            },
          }
        : undefined;

    return this.databaseService.event.update({
      where: {
        id,
        creatorId: userId,
      },
      data: {
        ...dto,
        ...(eventLocationAction && { eventLocation: eventLocationAction }),
      },
      include: {
        eventLocation: true,
        company: true,
      },
    });
  }

  async updatePoster(id: string, userId: string, file: Express.Multer.File) {
    const event = await this.databaseService.event.findUnique({
      where: { id },
      include: { creator: true, eventLocation: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.creatorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this event',
      );
    }

    const { location: posterUrl } = await this.fileUploadService.upload(file);

    return await this.databaseService.event.update({
      where: {
        id,
        creatorId: userId,
      },
      data: {
        posterUrl,
      },
      include: EventService.include,
    });
  }

  async findAll(dto: GetEventDto) {
    const now = new Date();

    const data = await this.databaseService.event.findMany({
      where: {
        publishDate: {
          lte: now,
        },
      },
      include: EventService.include,
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
    });

    const count = await this.databaseService.event.count({
      where: {
        publishDate: {
          lte: now,
        },
      },
    });

    return new PaginatedEvent(data, count, dto);
  }

  async findAllByUserId(
    userId: string,
    dto: GetEventDto,
  ): Promise<PaginatedEvent> {
    const data = await this.databaseService.event.findMany({
      where: {
        creatorId: userId,
      },
      include: EventService.include,
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
    });

    const count = await this.databaseService.event.count({
      where: {
        creatorId: userId,
      },
    });

    return new PaginatedEvent(data, count, dto);
  }

  async findById(id: string) {
    const data = await this.databaseService.event.findUnique({
      where: {
        id,
      },
      include: EventService.include,
    });

    if (!data) {
      throw new NotFoundException('Event not found');
    }

    return data;
  }

  async delete(id: string, userId: string) {
    const event = await this.databaseService.event.findUnique({
      where: { id },
      include: { creator: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.creatorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this event',
      );
    }

    return this.databaseService.event
      .delete({
        where: {
          id,
          creatorId: userId,
        },
        include: EventService.include,
      })
      .catch(() => {
        throw new NotFoundException('Event not found');
      });
  }
}
