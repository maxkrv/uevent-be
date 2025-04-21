import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';

import { Success } from '@/core/auth/dto/success.dto';
import { UrlResponse } from '@/core/auth/dto/url.dto';
import { DatabaseService } from '@/core/db/database.service';

import { FileUploadService } from '../../core/file-upload/file-upload.service';
import { StripeService } from '../stripe/stripe.service';
import { CreateEventDto } from './dto/create-event.dto';
import { GetAtendeesDto } from './dto/get-atendees.dto';
import { GetEventDto } from './dto/get-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PaginatedEvent } from './entities/event.entity';
import { PaginatedEventAtendees } from './entities/event-atendees.entity';

@Injectable()
export class EventService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly fileUploadService: FileUploadService,
    private readonly stripeService: StripeService,
  ) {}

  private readonly include: Prisma.EventInclude = {
    location: true,
    company: true,
  };

  async create(userId: string, dto: CreateEventDto) {
    const { companyId, location, themes, ...restDto } = dto;

    const company = await this.databaseService.company.findUnique({
      where: { id: companyId },
      select: { ownerId: true, stripeAccountId: true, isVerified: true },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to create an event for this company',
      );
    }

    if (!company.isVerified) {
      throw new ForbiddenException('Company is not verified');
    }

    if (!company.stripeAccountId) {
      throw new ForbiddenException('Company is not connected to Stripe');
    }

    return await this.databaseService.$transaction(async (prisma) => {
      const data = await prisma.event.create({
        data: {
          ...restDto,
          company: {
            connect: {
              id: dto.companyId,
            },
          },
          location: {
            create: location,
          },
          creator: {
            connect: {
              id: userId,
            },
          },
          themes: {
            set: themes,
          },
        },
        include: this.include,
      });

      const { id: stripeProductId } = await this.stripeService.createProduct(
        {
          name: dto.title,
          description: dto.description,
          shippable: false,
          metadata: {
            ownerId: userId,
            companyId: dto.companyId,
            eventId: data.id,
          },
        },
        company.stripeAccountId,
      );

      const { id: stripePriceId } = await this.stripeService.createPrice(
        {
          product: stripeProductId,
          unit_amount: dto.price * 100,
          currency: 'usd',
          metadata: {
            ownerId: userId,
            companyId: dto.companyId,
            eventId: data.id,
            stripeProductId,
          },
        },
        company.stripeAccountId,
      );

      await prisma.event.update({
        where: {
          id: data.id,
        },
        data: {
          stripeProductId,
          stripePriceId,
        },
      });

      return data;
    });
  }

  async update(id: string, dto: UpdateEventDto, userId: string) {
    const event = await this.databaseService.event.findUnique({
      where: { id },
      include: { creator: true, location: true, company: true },
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
      'eventLocation' in dto ? dto.location === null : !!event.location;

    const shouldUpsertLocation =
      'eventLocation' in dto && dto.location !== null;

    const eventLocationAction = shouldRemoveLocation
      ? { delete: true }
      : shouldUpsertLocation
        ? {
            upsert: {
              create: { ...dto.location },
              update: { ...dto.location },
            },
          }
        : undefined;

    if (event.stripeProductId && event.company.stripeAccountId) {
      await this.stripeService.updateProduct(
        event.stripeProductId,
        {
          name: dto.title,
          description: dto.description,
          shippable: false,
        },
        event.company.stripeAccountId,
      );
    }

    const { themes, ...rest } = dto;

    return this.databaseService.event.update({
      where: {
        id,
        creatorId: userId,
      },
      data: {
        ...rest,
        themes: {
          set: themes,
        },
        location: eventLocationAction,
      },
      include: {
        location: true,
        company: true,
      },
    });
  }

  async updatePoster(id: string, userId: string, file: Express.Multer.File) {
    const event = await this.databaseService.event.findUnique({
      where: { id },
      include: { creator: true, location: true },
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
      include: this.include,
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
      include: this.include,
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
      include: this.include,
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
      include: this.include,
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
        include: this.include,
      })
      .catch(() => {
        throw new NotFoundException('Event not found');
      });
  }

  async subscribe(eventId: string, userId: string) {
    const event = await this.databaseService.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    try {
      await this.databaseService.eventSubscription.create({
        data: { userId, eventId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Already subscribed');
        }
      }

      throw error;
    }

    return new Success();
  }

  async unsubscribe(eventId: string, userId: string) {
    const event = await this.databaseService.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    try {
      await this.databaseService.eventSubscription.delete({
        where: {
          eventId_userId: {
            userId,
            eventId,
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new BadRequestException('Not subscribed');
        }
      }

      throw error;
    }

    return new Success();
  }

  async purchase(id: string, userId: string) {
    const event = await this.databaseService.event.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (
      !event.stripePriceId ||
      !event.company.stripeAccountId ||
      !event.company.isVerified
    ) {
      throw new BadRequestException('Event is not available for purchase');
    }

    const isBeforeEvent = dayjs(event.publishDate).isBefore(dayjs());

    if (isBeforeEvent) {
      throw new BadRequestException('Event is not available for purchase');
    }

    const { url } = await this.stripeService.createPaymentLink(
      {
        line_items: [
          {
            price: event.stripePriceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId,
          eventId: id,
        },
        allow_promotion_codes: true,
      },
      event.company.stripeAccountId,
    );

    return new UrlResponse(url);
  }

  async getAttendees(
    eventId: string,
    dto: GetAtendeesDto,
  ): Promise<PaginatedEventAtendees> {
    const event = await this.databaseService.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const data = await this.databaseService.eventAttendee.findMany({
      where: {
        eventId: eventId,
        user: {
          settings: {
            showInAttendeeList: true,
          },
          ...(dto.search && {
            name: {
              contains: dto.search,
              mode: 'insensitive',
            },
          }),
        },
      },
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
    });

    const count = await this.databaseService.eventAttendee.count({
      where: {
        eventId: eventId,
        user: {
          settings: {
            showInAttendeeList: true,
          },
          ...(dto.search && {
            name: {
              contains: dto.search,
              mode: 'insensitive',
            },
          }),
        },
      },
    });

    return new PaginatedEventAtendees(data, count, dto);
  }

  async getAttendeesCount(eventId: string) {
    const event = await this.databaseService.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const count = await this.databaseService.eventAttendee.count({
      where: { eventId },
    });

    return { currentAttendees: count };
  }
}
