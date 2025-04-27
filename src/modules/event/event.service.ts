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
import { DEFAULT_ITEMS_LIMIT, DEFAULT_PAGE } from '../../shared/pagination';
import { NotificationService } from '../notifications/notification.service';
import { StripeService } from '../stripe/stripe.service';
import { CreateEventDto } from './dto/create-event.dto';
import { GetAtendeesDto } from './dto/get-atendees.dto';
import { GetEventDto } from './dto/get-event.dto';
import { GetEventSubscriptionDto } from './dto/get-event-subscription.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PaginatedEvent } from './entities/event.entity';
import { PaginatedEventAtendees } from './entities/event-atendees.entity';
import { PaginatedEventSubscription } from './entities/event-subscriptions.entity';

const KILOMETERS_IN_DEGREE = 111.32;
const DEFAULT_EVENTS_LOACTION_SEARCH_LIMIT = 1000;

@Injectable()
export class EventService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly fileUploadService: FileUploadService,
    private readonly stripeService: StripeService,
    private readonly notificationService: NotificationService,
  ) {}

  private readonly include: Prisma.EventInclude = {
    location: true,
    company: {
      include: {
        location: true,
      },
    },
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
            create: location || undefined,
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

      this.notificationService.createEventNotification(
        dto.companyId,
        userId,
        dto.title,
        data.id,
      );

      return data;
    });
  }

  async update(id: string, dto: UpdateEventDto, userId: string) {
    const event = await this.databaseService.event.findUnique({
      where: { id },
      include: { creator: true, location: true, company: true },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const shouldRemoveLocation =
      dto.location === null && event.location !== null;
    const eventLocationAction = shouldRemoveLocation
      ? { delete: true }
      : dto.location
        ? {
            upsert: {
              create: dto.location,
              update: dto.location,
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

    const updatedEvent = await this.databaseService.event.update({
      where: {
        id,
        creatorId: userId,
      },
      data: {
        ...rest,
        themes: themes
          ? {
              set: themes,
            }
          : undefined,
        location: eventLocationAction,
      },
      include: this.include,
    });

    this.notificationService.createEventUpdateNotification(
      id,
      userId,
      dto.title,
    );

    return updatedEvent;
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
  async findAll(dto: GetEventDto, userId?: string): Promise<PaginatedEvent> {
    this.validateLocationParams(dto);

    const isLocationSearch = dto.lat !== undefined && dto.lng !== undefined;
    const isPagination = dto.page !== undefined && dto.limit !== undefined;

    const where = this.buildWhereClause(dto, userId);
    const orderBy = this.buildOrderBy(dto);

    const skip = isPagination
      ? ((dto.page ?? DEFAULT_PAGE) - 1) * (dto.limit ?? DEFAULT_ITEMS_LIMIT)
      : 0;

    const take = isPagination
      ? (dto.limit ?? DEFAULT_ITEMS_LIMIT)
      : isLocationSearch
        ? DEFAULT_EVENTS_LOACTION_SEARCH_LIMIT
        : DEFAULT_ITEMS_LIMIT;

    try {
      const [data, count] = await Promise.all([
        this.databaseService.event.findMany({
          where,
          include: this.include,
          orderBy,
          skip,
          take,
        }),
        this.databaseService.event.count({ where }),
      ]);

      return new PaginatedEvent(data, count, {
        page: skip / take + 1,
        limit: take,
      });
    } catch (err) {
      throw new BadRequestException(
        `Error fetching events: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }

  private validateLocationParams(dto: GetEventDto): void {
    const lat = dto.lat;
    const lng = dto.lng;

    if (
      (lat !== undefined && lng === undefined) ||
      (lat === undefined && lng !== undefined)
    ) {
      throw new BadRequestException(
        'Both latitude and longitude must be provided for location-based search',
      );
    }
  }

  private buildWhereClause(
    dto: GetEventDto,
    userId?: string,
  ): Prisma.EventWhereInput {
    const where: Prisma.EventWhereInput = {};

    if (dto.priceFrom !== undefined || dto.priceTo !== undefined) {
      where.price = {
        gte: dto.priceFrom,
        lte: dto.priceTo,
      };
    }
    if (dto.fromDate) where.startDate = { gte: new Date(dto.fromDate) };
    if (dto.toDate) where.endDate = { lte: new Date(dto.toDate) };
    if (dto.themes?.length) where.themes = { hasSome: dto.themes };
    if (dto.format?.length) where.format = { in: dto.format };
    if (dto.search) where.title = { contains: dto.search, mode: 'insensitive' };
    if (dto.companyId) where.companyId = dto.companyId;
    if (userId) where.creatorId = userId;

    if (dto.lat !== undefined && dto.lng !== undefined) {
      console.log(
        'dto.radius',
        dto.radius,
        'dto.lat',
        dto.lat,
        'dto.lng',
        dto.lng,
      );
      const latDeg = dto.radius / KILOMETERS_IN_DEGREE;
      const lngDeg =
        dto.radius / (KILOMETERS_IN_DEGREE * Math.cos(this.toRad(dto.lat)));

      where.location = {
        lat: { gte: dto.lat - latDeg, lte: dto.lat + latDeg },
        lng: { gte: dto.lng - lngDeg, lte: dto.lng + lngDeg },
      };
    }

    return where;
  }

  private buildOrderBy(
    dto: GetEventDto,
  ): Prisma.EventOrderByWithAggregationInput {
    const defaultSort: Prisma.EventOrderByWithAggregationInput = {
      publishDate: 'asc',
    };

    switch (dto.sort) {
      case 'name':
        return { title: 'asc' };
      case 'price-high':
        return { price: 'desc' };
      case 'price-low':
        return { price: 'asc' };
      case 'date':
      default:
        return defaultSort;
    }
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async findAllSubscriptionsByUserId(
    userId: string,
    dto: GetEventSubscriptionDto,
  ) {
    const data = await this.databaseService.eventSubscription.findMany({
      where: {
        userId,
      },
      include: {
        event: {
          include: this.include,
        },
      },
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
    });

    const count = await this.databaseService.eventSubscription.count({
      where: {
        userId,
      },
    });

    return new PaginatedEventSubscription(data, count, dto);
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
      include: {
        creator: true,
        company: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.creatorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this event',
      );
    }

    await this.notificationService.createEventDeletionNotification(
      id,
      event.title,
      event.company.name,
      userId,
    );

    return await this.databaseService.event.delete({
      where: { id },
      include: this.include,
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
