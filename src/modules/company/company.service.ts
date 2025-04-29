import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

import { Success } from '@/core/auth/dto/success.dto';
import { UrlResponse } from '@/core/auth/dto/url.dto';
import { DatabaseService } from '@/core/db/database.service';
import { FileUploadService } from '@/core/file-upload/file-upload.service';
import { PaginationOptionsDto } from '@/shared/pagination';

import { KILOMETERS_IN_DEGREE } from '../event/event.service';
import { StripeService } from '../stripe/stripe.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { CompanySortBy, GetCompanyDto } from './dto/get-company.dto';
import { GetCompanySubscriptionDto } from './dto/get-company-subscription.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PaginatedCompany } from './entities/company.entity';
import { PaginatedCompanySubscription } from './entities/company-subscrtiptions.entity';
import { PaginatedPromoCode } from './entities/promo-code.entity';

const DEFAULT_COMPANY_SEARCH_RADIUS = 50;
@Injectable()
export class CompanyService {
  private readonly include: Prisma.CompanyInclude = {
    location: true,
    owner: true,
    _count: {
      select: {
        events: true,
        subscribers: true,
      },
    },
  };

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly stripeService: StripeService,
    private readonly fileUploadService: FileUploadService,
    private readonly cs: ConfigService,
  ) {}

  async create(userId: string, dto: CreateCompanyDto) {
    const { location, ...restDto } = dto;

    return await this.databaseService.$transaction(async (prisma) => {
      const company = await prisma.company.create({
        data: {
          ...restDto,
          owner: {
            connect: {
              id: userId,
            },
          },
          location: {
            create: location,
          },
        },
        include: this.include,
      });
      const account = await this.stripeService.createConnectAccount({
        business_profile: {
          name: dto.name,
          support_email: dto.email,
          product_description: dto.description,
        },
        metadata: {
          ownerId: userId,
          company: company.id,
        },
      });

      const updatedCompany = await prisma.company.update({
        where: {
          id: company.id,
        },
        data: {
          stripeAccountId: account.id,
        },
      });

      return updatedCompany;
    });
  }

  async update(id: string, dto: UpdateCompanyDto, userId: string) {
    const company = await this.databaseService.company.findUnique({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const { location, ...restDto } = dto;

    return this.databaseService.company.update({
      where: {
        id,
        ownerId: userId,
      },
      data: {
        ...restDto,
        location: {
          update: location,
        },
      },
      include: this.include,
    });
  }

  async findAll(dto: GetCompanyDto) {
    const where = this.buildWhere(dto);
    const order = this.buildOrder(dto);

    const data = await this.databaseService.company.findMany({
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
      where,
      orderBy: order,
      include: this.include,
    });

    const count = await this.databaseService.company.count({ where });

    return new PaginatedCompany(data, count, dto);
  }

  private buildOrder(dto: GetCompanyDto) {
    const order: Prisma.CompanyOrderByWithRelationInput = {};

    if (dto.sortBy) {
      switch (dto.sortBy) {
        case CompanySortBy.NAME:
          order.name = 'asc';
          break;
        case CompanySortBy.EVENTS:
          order.events = {
            _count: 'desc',
          };
          break;
        case CompanySortBy.NEWEST:
          order.createdAt = 'desc';
          break;
        case CompanySortBy.OLDEST:
          order.createdAt = 'asc';
          break;
        default:
          order.createdAt = 'desc';
          break;
      }
    }
    return order;
  }

  private buildWhere(dto: GetCompanyDto): Prisma.CompanyWhereInput {
    const where: Prisma.CompanyWhereInput = { isVerified: dto.isVerified };

    if (dto.search) {
      where.OR = [
        {
          name: {
            contains: dto.search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: dto.search,
            mode: 'insensitive',
          },
        },
        {
          location: {
            address: {
              contains: dto.search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    if (dto.lat !== undefined && dto.lng !== undefined) {
      const latDeg = DEFAULT_COMPANY_SEARCH_RADIUS / KILOMETERS_IN_DEGREE;
      const lngDeg =
        DEFAULT_COMPANY_SEARCH_RADIUS /
        (KILOMETERS_IN_DEGREE * Math.cos(this.toRad(dto.lat)));

      where.location = {
        lat: { gte: dto.lat - latDeg, lte: dto.lat + latDeg },
        lng: { gte: dto.lng - lngDeg, lte: dto.lng + lngDeg },
      };
    }

    return where;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  getTotalSubscribers() {
    return this.databaseService.companySubscription.count();
  }

  async findAllByUserId(
    userId: string,
    dto: GetCompanyDto,
  ): Promise<PaginatedCompany> {
    const data = await this.databaseService.company.findMany({
      where: {
        ownerId: userId,
      },
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
      include: this.include,
    });

    const count = await this.databaseService.company.count({
      where: {
        ownerId: userId,
      },
    });

    return new PaginatedCompany(data, count, dto);
  }

  async findAllSubscriptionsByUserId(
    userId: string,
    dto: GetCompanySubscriptionDto,
  ) {
    const data = await this.databaseService.companySubscription.findMany({
      where: {
        userId,
      },
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
      include: {
        company: {
          include: this.include,
        },
      },
    });

    const count = await this.databaseService.companySubscription.count({
      where: {
        userId,
      },
    });

    return new PaginatedCompanySubscription(data, count, dto);
  }

  async findById(id: string) {
    const data = await this.databaseService.company.findUnique({
      where: {
        id,
      },
      include: this.include,
    });

    if (!data) {
      throw new NotFoundException('Company not found');
    }

    return data;
  }

  async delete(id: string, userId: string) {
    return this.databaseService.company
      .delete({
        where: {
          id,
          ownerId: userId,
        },
      })
      .catch(() => {
        throw new NotFoundException('Company not found');
      });
  }

  async updateImage(
    id: string,
    userId: string,
    file: Express.Multer.File,
    type: 'logo' | 'cover' = 'logo',
  ) {
    const company = await this.databaseService.company.findUnique({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const { location } = await this.fileUploadService.upload(file);

    const data: Prisma.CompanyUpdateInput =
      type === 'logo'
        ? {
            logo: location,
          }
        : {
            coverImage: location,
          };

    await this.databaseService.company.update({
      where: {
        id,
        ownerId: userId,
      },
      data,
    });

    return new Success();
  }

  async createOnboardingLink(id: string, userId: string) {
    const company = await this.databaseService.company.findUnique({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const returnUrl = `${this.cs.get('app').clientUrl}/companies/${id}`;

    const data = await this.stripeService.createOnboardingLink(
      company.stripeAccountId,
      returnUrl,
    );

    return new UrlResponse(data.url);
  }

  async createDashboardLink(id: string, userId: string) {
    const company = await this.databaseService.company.findUnique({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const data = await this.stripeService.createDashboardLink(
      company.stripeAccountId,
    );

    return new UrlResponse(data.url);
  }

  async subscribe(companyId: string, userId: string) {
    const company = await this.databaseService.company.findUnique({
      where: {
        id: companyId,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    try {
      await this.databaseService.companySubscription.create({
        data: { userId, companyId },
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

  async unsubscribe(companyId: string, userId: string) {
    const company = await this.databaseService.company.findUnique({
      where: {
        id: companyId,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    try {
      await this.databaseService.companySubscription.delete({
        where: {
          userId_companyId: {
            userId,
            companyId,
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

  async createPromoCode(
    companyId: string,
    userId: string,
    dto: CreatePromoCodeDto,
  ) {
    const company = await this.databaseService.company.findUnique({
      where: {
        id: companyId,
        ownerId: userId,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (!company.stripeAccountId) {
      throw new BadRequestException('Company is not connected to Stripe');
    }

    if (!company.isVerified) {
      throw new BadRequestException('Company is not verified');
    }

    const {
      code,
      id,
      coupon: { id: stripeCouponId },
    } = await this.stripeService.createCoupon(
      {
        max_redemptions: dto.maxUses,
        percent_off: dto.discount,
        metadata: {
          company: companyId,
        },
      },
      company.stripeAccountId,
    );

    const data = await this.databaseService.promoCode.create({
      data: {
        code,
        maxUses: dto.maxUses,
        discount: dto.discount,
        companyId,
        stripeId: id,
        stripeCouponId,
      },
    });

    return data;
  }

  async deletePromoCode(id: string, companyId: string) {
    const data = await this.databaseService.promoCode.findUnique({
      where: {
        id,
        companyId,
      },
      include: {
        company: true,
      },
    });

    if (!data) {
      throw new NotFoundException('Promo code not found');
    }

    await this.stripeService.removeCoupon(
      data.stripeCouponId,
      data.company.stripeAccountId,
    );

    await this.databaseService.promoCode.delete({
      where: {
        id,
      },
    });

    return new Success();
  }

  async findAllPromoCodes(
    companyId: string,
    userId: string,
    dto: PaginationOptionsDto,
  ) {
    const data = await this.databaseService.promoCode.findMany({
      where: {
        company: {
          id: companyId,
          ownerId: userId,
        },
      },
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
    });

    const count = await this.databaseService.promoCode.count({
      where: {
        company: {
          id: companyId,
          ownerId: userId,
        },
      },
    });

    return new PaginatedPromoCode(data, count, dto);
  }
}
