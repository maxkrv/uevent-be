import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TicketStatusType } from '@prisma/client';

import { Success } from '@/core/auth/dto/success.dto';
import { DatabaseService } from '@/core/db/database.service';

import { GetTicketsDto } from './get-tickets.dto';
import { PaginatedTickets } from './ticket.entity';

@Injectable()
export class TicketsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(userId: string, dto: GetTicketsDto) {
    const data = await this.databaseService.ticket.findMany({
      where: {
        userId,
        eventId: dto.eventId,
      },
      include: {
        user: true,
        event: {
          include: {
            location: true,
          },
        },
      },
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
      orderBy: {
        purchaseDate: 'desc',
      },
    });
    const count = await this.databaseService.ticket.count({
      where: {
        userId,
      },
    });

    return new PaginatedTickets(data, count, dto);
  }

  async verifyTicket(ticketId: string, userId: string) {
    const ticket = await this.databaseService.ticket.findUnique({
      where: {
        id: ticketId,
      },
      include: {
        event: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.event.company.ownerId !== userId) {
      throw new ForbiddenException();
    }

    await this.databaseService.ticket.update({
      where: {
        id: ticketId,
      },
      data: {
        status: TicketStatusType.USED,
      },
    });

    return new Success();
  }
}
