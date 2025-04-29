import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import CompanyEvent from 'src/emails/company-event';
import CompanyNews from 'src/emails/company-news';

import { DatabaseService } from '@/core/db/database.service';
import { MailService } from '@/core/mail/mail.service';
import CommentReply from '@/emails/comment-reply';
import CompanyEventDelete from '@/emails/company-event-delete';
import CompanyEventNewAtendee from '@/emails/company-event-new-atendee';
import CompanyEventPurchase from '@/emails/company-event-purchase';
import CompanyEventUpdate from '@/emails/company-event-update';

import { GetNotificationDto } from './dto/get-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PaginatedNotification } from './notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly mailService: MailService,
    private readonly cs: ConfigService,
  ) {}
  private include: Prisma.NotificationInclude = {
    sentBy: {
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    },
  };
  private createLink = (path: string): string => {
    return new URL(path, this.cs.get('app').clientUrl).toString();
  };

  async findAllByUserId(
    userId: string,
    dto: GetNotificationDto,
  ): Promise<PaginatedNotification> {
    const data = await this.databaseService.notification.findMany({
      where: { userId },
      skip: (dto.page - 1) * dto.limit,
      include: this.include,
      orderBy: {
        createdAt: 'desc',
      },
      take: dto.limit,
    });

    const count = await this.databaseService.notification.count({
      where: {
        userId,
      },
    });

    return new PaginatedNotification(data, count, dto);
  }

  async update(id: string, dto: UpdateNotificationDto, userId: string) {
    const notification = await this.databaseService.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('You do not have permission to update this notification');
    }

    return this.databaseService.notification.update({
      where: { id },
      include: this.include,
      data: dto,
    });
  }

  async delete(id: string, userId: string) {
    const notification = await this.databaseService.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('You do not have permission to delete this notification');
    }

    return this.databaseService.notification
      .delete({
        include: this.include,
        where: { id },
      })
      .catch(() => {
        throw new NotFoundException('Notification not found');
      });
  }

  async createNewsNotification(
    companyId: string,
    sentById: string,
    newsTitle: string,
    newsId: string,
  ) {
    const company = await this.databaseService.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
      },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    const subscriptions =
      await this.databaseService.companySubscription.findMany({
        where: {
          companyId,
          user: { settings: { companyUpdateChannel: { not: 'NONE' } } },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              settings: {
                select: {
                  companyUpdateChannel: true,
                },
              },
            },
          },
        },
      });
    const link = this.createLink(`/companies/${companyId}/news/${newsId}`);
    const notifications = subscriptions
      .filter((sub) =>
        ['IN_APP', 'BOTH'].includes(sub.user.settings?.companyUpdateChannel),
      )
      .map((sub) =>
        this.databaseService.notification.create({
          data: {
            type: 'COMPANY_UPDATE',
            title: `${company.name} News`,
            content: `${company.name} just published: "${newsTitle}"`,
            link,
            userId: sub.user.id,
            sentById,
          },
        }),
      );
    const emailsToSend = subscriptions
      .filter((sub) =>
        ['EMAIL', 'BOTH'].includes(sub.user.settings?.companyUpdateChannel),
      )
      .map(async (sub) =>
        this.mailService.sendMail({
          to: sub.user.email,
          subject: `${company.name} – New update available`,
          template: await CompanyNews({
            name: sub.user.name,
            companyName: company.name,
            newsTitle,
            link,
          }),
        }),
      );

    await Promise.all([...notifications, ...emailsToSend]);
  }

  async createEventNotification(
    companyId: string,
    sentById: string,
    eventTitle: string,
    eventId: string,
  ) {
    const company = await this.databaseService.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    const subscriptions =
      await this.databaseService.companySubscription.findMany({
        where: {
          companyId,
          user: { settings: { companyUpdateChannel: { not: 'NONE' } } },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              settings: {
                select: {
                  companyUpdateChannel: true,
                },
              },
            },
          },
        },
      });
    const link = this.createLink(`/events/${eventId}`);
    const notifications = subscriptions
      .filter((sub) =>
        ['IN_APP', 'BOTH'].includes(sub.user.settings?.companyUpdateChannel),
      )
      .map((sub) =>
        this.databaseService.notification.create({
          data: {
            type: 'COMPANY_UPDATE',
            title: `${company.name} Event`,
            content: `${company.name} just published: "${eventTitle}"`,
            userId: sub.user.id,
            link,
            sentById,
          },
        }),
      );
    const emailsToSend = subscriptions
      .filter((sub) =>
        ['EMAIL', 'BOTH'].includes(sub.user.settings?.companyUpdateChannel),
      )
      .map(async (sub) =>
        this.mailService.sendMail({
          to: sub.user.email,
          subject: `${company.name} – New event available`,
          template: await CompanyEvent({
            name: sub.user.name,
            companyName: company.name,
            eventTitle,
            link,
          }),
        }),
      );
    await Promise.all([...notifications, ...emailsToSend]);
  }

  async sendEventReminderNotification() {
    const from = dayjs().startOf('day').add(1, 'day');
    const to = from.add(1, 'hour').subtract(1, 'minute');

    const subscriptions = await this.databaseService.eventSubscription.findMany(
      {
        where: {
          event: {
            startDate: {
              gte: from.toDate(),
              lte: to.toDate(),
            },
          },
          user: {
            settings: {
              eventReminderChannel: { not: 'NONE' },
            },
          },
        },
        select: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              company: { select: { name: true } },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              settings: {
                select: {
                  eventReminderChannel: true,
                },
              },
            },
          },
        },
      },
    );
    const notifications = subscriptions
      .filter((sub) =>
        ['IN_APP', 'BOTH'].includes(sub.user.settings.eventReminderChannel),
      )
      .map((sub) =>
        this.databaseService.notification.create({
          data: {
            type: 'EVENT_REMINDER',
            title: `Reminder: ${sub.event.title}`,
            content: `Don't forget about "${sub.event.title}" tomorrow at ${sub.event.startDate.toLocaleTimeString()}`,
            link: this.createLink(`/events/${sub.event.id}`),
            userId: sub.user.id,
          },
        }),
      );

    const emailsToSend = await Promise.all(
      subscriptions
        .filter((sub) =>
          ['EMAIL', 'BOTH'].includes(sub.user.settings.eventReminderChannel),
        )
        .map(async (sub) =>
          this.mailService.sendMail({
            to: sub.user.email,
            subject: `Reminder: ${sub.event.title} is tomorrow!`,
            template: await CompanyEvent({
              name: sub.user.name,
              companyName: sub.event.company.name,
              eventTitle: sub.event.title,
              link: this.createLink(`/events/${sub.event.id}`),
            }),
          }),
        ),
    );

    await Promise.all([...notifications, ...emailsToSend]);
  }

  async createEventUpdateNotification(
    eventId: string,
    sentById: string,
    eventTitle: string,
  ) {
    const event = await this.databaseService.event.findUnique({
      where: { id: eventId },
      include: { company: true },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const subscriptions = await this.databaseService.eventSubscription.findMany(
      {
        where: {
          eventId,
          user: { settings: { companyUpdateChannel: { not: 'NONE' } } },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              settings: {
                select: {
                  companyUpdateChannel: true,
                },
              },
            },
          },
        },
      },
    );

    const notifications = subscriptions
      .filter((sub) =>
        ['IN_APP', 'BOTH'].includes(sub.user.settings?.companyUpdateChannel),
      )
      .map((sub) =>
        this.databaseService.notification.create({
          data: {
            type: 'EVENT_UPDATE',
            title: `${event.company.name} Updated Event`,
            content: `${event.company.name} just updated: "${eventTitle}"`,
            userId: sub.user.id,
            link: this.createLink(`/events/${eventId}`),
            sentById,
          },
        }),
      );

    const emailsToSend = subscriptions
      .filter((sub) =>
        ['EMAIL', 'BOTH'].includes(sub.user.settings?.companyUpdateChannel),
      )
      .map(async (sub) =>
        this.mailService.sendMail({
          to: sub.user.email,
          subject: `${event.company.name} – Event Updated`,
          template: await CompanyEventUpdate({
            name: sub.user.name,
            companyName: event.company.name,
            eventTitle,
            link: this.createLink(`/events/${eventId}`),
          }),
        }),
      );

    await Promise.all([...notifications, ...emailsToSend]);
  }

  async createEventDeletionNotification(
    eventId: string,
    eventTitle: string,
    companyName: string,
    sentById: string,
  ) {
    const subscriptions = await this.databaseService.eventSubscription.findMany(
      {
        where: {
          eventId,
          user: { settings: { companyUpdateChannel: { not: 'NONE' } } },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              settings: {
                select: {
                  companyUpdateChannel: true,
                },
              },
            },
          },
        },
      },
    );

    const notifications = subscriptions
      .filter((sub) =>
        ['IN_APP', 'BOTH'].includes(sub.user.settings?.companyUpdateChannel),
      )
      .map((sub) =>
        this.databaseService.notification.create({
          data: {
            type: 'EVENT_DELETE',
            title: `${companyName} Event Cancelled`,
            content: `The event "${eventTitle}" has been cancelled.`,
            userId: sub.user.id,
            sentById,
          },
        }),
      );

    const emailsToSend = subscriptions
      .filter((sub) =>
        ['EMAIL', 'BOTH'].includes(sub.user.settings?.companyUpdateChannel),
      )
      .map(async (sub) =>
        this.mailService.sendMail({
          to: sub.user.email,
          subject: `${companyName} – Event Cancelled`,
          template: await CompanyEventDelete({
            name: sub.user.name,
            companyName,
            eventTitle,
          }),
        }),
      );

    await Promise.all([...notifications, ...emailsToSend]);
  }

  async createEventPurchaseNotification(userId: string, eventId: string) {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
      include: {
        settings: true,
      },
    });

    const event = await this.databaseService.event.findUnique({
      where: { id: eventId },
    });

    if (!user || !user.settings || !event) {
      return;
    }

    const shouldCreateNotification = ['IN_APP', 'BOTH'].includes(
      user.settings.ticketPurchaseChannel,
    );
    const shouldSendEmail = ['EMAIL', 'BOTH'].includes(
      user.settings.ticketPurchaseChannel,
    );

    const notificationPromise = shouldCreateNotification
      ? this.databaseService.notification.create({
          data: {
            type: 'TICKET_PURCHASE',
            title: 'Ticket Purchased',
            content: `You successfully purchased a ticket for "${event.title}"`,
            userId,
          },
        })
      : null;

    const emailPromise = shouldSendEmail
      ? this.mailService.sendMail({
          to: user.email,
          subject: `Ticket Purchased: ${event.title}`,
          template: await CompanyEventPurchase({
            name: user.name,
            eventTitle: event.title,
            link: `${this.cs.get('app').clientUrl}/users/${userId}/tickets`,
            eventEndDate: dayjs(event.endDate).format('MM/DD/YYYY'),
            eventStartDate: dayjs(event.startDate).format('MM/DD/YYYY'),
            price: event.price,
          }),
        })
      : null;

    await Promise.all([notificationPromise, emailPromise].filter(Boolean));
  }

  async notifyEventCreatorOnNewAttendee(eventId: string, attendeeId: string) {
    const event = await this.databaseService.event.findUnique({
      where: { id: eventId },
      include: {
        creator: {
          include: { settings: true },
        },
      },
    });

    const attendee = await this.databaseService.user.findUnique({
      where: { id: attendeeId },
    });

    if (!event || !event.creator || !attendee) {
      return;
    }

    if (!event.notifyOnNewAttendee) {
      return;
    }

    const { creator } = event;
    const shouldCreateNotification = ['IN_APP', 'BOTH'].includes(
      creator.settings?.ticketPurchaseChannel,
    );
    const shouldSendEmail = ['EMAIL', 'BOTH'].includes(
      creator.settings?.ticketPurchaseChannel,
    );
    const link = this.createLink(`/events/${eventId}#attendees`);
    const notificationPromise = shouldCreateNotification
      ? this.databaseService.notification.create({
          data: {
            type: 'NEW_EVENT_ATTENDEE',
            title: 'New atendee of the event',
            link,
            content: `${attendee.name} joined the event "${event.title}"`,
            userId: creator.id,
          },
        })
      : null;

    const emailPromise = shouldSendEmail
      ? this.mailService.sendMail({
          to: creator.email,
          subject: `New atendee: ${event.title}`,
          template: await CompanyEventNewAtendee({
            creatorName: creator.name,
            attendeeName: attendee.name,
            eventTitle: event.title,
            link,
          }),
        })
      : null;

    await Promise.all([notificationPromise, emailPromise].filter(Boolean));
  }

  async createCommentReplyNotification({
    recipientId,
    senderId,
    commentContent,
    commentId,
  }: {
    recipientId: string;
    senderId: string;
    commentContent: string;
    commentId: string;
  }) {
    const recipient = await this.databaseService.user.findUnique({
      where: { id: recipientId },
      select: {
        id: true,
        email: true,
        name: true,
        settings: {
          select: {
            newCommentChannel: true,
          },
        },
      },
    });

    if (!recipient || recipient.settings?.newCommentChannel === 'NONE') return;

    const comment = await this.databaseService.comment.findUnique({
      where: { id: commentId },
      include: {
        companyNews: true,
        event: true,
      },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }
    const shouldSendInApp = ['IN_APP', 'BOTH'].includes(
      recipient.settings.newCommentChannel,
    );

    const shouldSendEmail = ['EMAIL', 'BOTH'].includes(
      recipient.settings.newCommentChannel,
    );
    const link = comment.companyNews
      ? this.createLink(
          `/companies/${comment.companyNews.companyId}/news/${comment.companyNews.id}#comments`,
        )
      : this.createLink(`/events/${comment.event.id}#comments`);
    const notificationPromise = shouldSendInApp
      ? this.databaseService.notification.create({
          data: {
            type: 'COMMENT_REPLY',
            title: `New reply to your comment`,
            content: `Someone replied: "${commentContent}"`,
            userId: recipientId,
            sentById: senderId,
            link,
          },
        })
      : Promise.resolve();

    const emailPromise = shouldSendEmail
      ? this.mailService.sendMail({
          to: recipient.email,
          subject: 'New reply to your comment',
          template: await CommentReply({
            name: recipient.name,
            content: commentContent,
            link,
          }),
        })
      : Promise.resolve();

    await Promise.all([notificationPromise, emailPromise]);
  }
}
