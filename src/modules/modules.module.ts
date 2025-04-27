import { Module } from '@nestjs/common';

import { CommentModule } from './comments/comment.module';
import { CompanyModule } from './company/company.module';
import { EventModule } from './event/event.module';
import { NotificationModule } from './notifications/notification.module';
import { PaymentsModule } from './payments/payments.module';
import { ReactionModule } from './reactions/reaction.module';
import { StripeModule } from './stripe/stripe.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    CompanyModule,
    EventModule,
    StripeModule,
    CommentModule,
    ReactionModule,
    TicketsModule,
    PaymentsModule,
    NotificationModule,
  ],
})
export class ModulesModule {}
