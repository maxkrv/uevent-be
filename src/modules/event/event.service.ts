import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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
      include: {
        eventLocation: true,
        company: true,
      },
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

    let eventLocationAction;

    if ('eventLocation' in dto) {
      if (dto.eventLocation === null) {
        if (event.eventLocation) {
          eventLocationAction = { delete: true };
        }
      } else if (dto.eventLocation) {
        eventLocationAction = {
          upsert: {
            create: {
              ...dto.eventLocation,
              lat: dto.eventLocation.lat,
              lng: dto.eventLocation.lng,
            },
            update: {
              ...dto.eventLocation,
              lat: dto.eventLocation.lat,
              lng: dto.eventLocation.lng,
            },
          },
        };
      }
    } else {
      if (event.eventLocation) {
        eventLocationAction = { delete: true };
      }
    }

    return this.databaseService.event.update({
      where: {
        id,
        creatorId: userId,
      },
      data: {
        ...dto,
        companyId: dto.companyId,
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
      include: {
        eventLocation: true,
        company: true,
      },
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
      include: {
        eventLocation: true,
        company: true,
      },
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
      include: {
        eventLocation: true,
        company: true,
      },
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
      include: {
        eventLocation: true,
        company: true,
      },
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
        include: {
          eventLocation: true,
          company: true,
        },
      })
      .catch(() => {
        throw new NotFoundException('Event not found');
      });
  }
}
