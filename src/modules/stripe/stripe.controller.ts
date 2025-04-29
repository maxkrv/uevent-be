import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { PaymentStatusType } from '@prisma/client';
import Stripe from 'stripe';

import { DatabaseService } from '@/core/db/database.service';
import { Public } from '@/shared/decorators';

import { NotificationService } from '../notifications/notification.service';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly databaseService: DatabaseService,
    private readonly notificationService: NotificationService,
  ) {}

  @Public()
  @Post('webhook')
  async webhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      throw new BadRequestException();
    }

    const body = req.rawBody;
    let event: Stripe.Event;

    try {
      event = this.stripeService.constructEvent(body, signature);
    } catch {
      throw new BadRequestException();
    }

    switch (event.type) {
      case 'account.updated': {
        const metadata = event.data.object.metadata;
        const isActive =
          event.data.object.charges_enabled &&
          event.data.object.payouts_enabled;

        if (!isActive) {
          return;
        }

        if (!metadata.company) {
          return;
        }

        await this.databaseService.company.update({
          where: {
            id: metadata.company,
          },
          data: {
            isVerified: true,
          },
        });

        break;
      }
      case 'checkout.session.completed': {
        const isPaid = event.data.object.payment_status === 'paid';
        const metadata = event.data.object.metadata;

        if (!metadata.eventId || !metadata.userId) {
          throw new BadRequestException('Missing metadata properties');
        }

        if (!isPaid) {
          return;
        }

        const eventData = await this.databaseService.event.findUnique({
          where: {
            id: metadata.eventId,
          },
        });

        if (!eventData) {
          throw new BadRequestException('eventData not found');
        }

        await this.databaseService
          .$transaction(async (prisma) => {
            const attendee = await prisma.eventAttendee.create({
              data: {
                userId: metadata.userId,
                eventId: metadata.eventId,
              },
            });

            const ticket = await prisma.ticket.create({
              data: {
                attendeeId: attendee.id,
                userId: metadata.userId,
                eventId: metadata.eventId,
              },
            });

            await prisma.payment.create({
              data: {
                amount: eventData.price,
                userId: metadata.userId,
                ticketId: ticket.id,
                status: PaymentStatusType.COMPLETED,
              },
            });
          })
          .catch(() => {
            throw new BadRequestException('Transaction failed');
          });

        await this.notificationService.createEventPurchaseNotification(
          metadata.userId,
          metadata.eventId,
        );

        await this.notificationService.notifyEventCreatorOnNewAttendee(
          metadata.eventId,
          metadata.userId,
        );
      }
      case 'promotion_code.updated': {
        const promoId = event.data.object.id;

        if (!('times_redeemed' in event.data.object)) {
          return;
        }

        await this.databaseService.promoCode.update({
          where: {
            stripeId: promoId,
          },
          data: {
            uses: event.data.object.times_redeemed,
          },
        });
      }

      default:
        break;
    }
  }
}
