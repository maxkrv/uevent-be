import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import {
  AuthProviderType,
  NotificationChannelType,
  User,
  UserRole,
} from '@prisma/client';
import {
  ClassTransformOptions,
  Exclude,
  plainToClassFromExist,
  Type,
} from 'class-transformer';

import { BaseEntity } from '../../common/base/base.entity';
import { Paginated } from '../../shared/pagination';

export class UserDescription implements User {
  @ApiProperty({ example: 'qwcqwdocq12djq2ewff232' })
  id: string;
  @ApiProperty({ example: 'John Doe' })
  name: string;
  @ApiProperty({ example: 'micha21cloz@gmail.com' })
  email: string;
  @Exclude()
  @ApiProperty({ example: 'Pass123@' })
  password: string;
  @ApiProperty({ example: 'https://example.com/avatar.png' })
  avatar: string;
  @ApiProperty({ example: 'Well well well' })
  bio: string;
  @ApiProperty({ enum: UserRole })
  role: UserRole;
  @ApiProperty({ example: true })
  emailVerified: boolean;
  @ApiProperty({ example: false })
  showInAttendeeList: boolean;
  @Exclude()
  @ApiProperty({ example: '2025-04-02T16:27:17Z' })
  createdAt: Date;
  @Exclude()
  @ApiProperty({ example: '2025-04-02T16:27:17Z' })
  updatedAt: Date;
  @ApiProperty({ enum: AuthProviderType })
  authProvider: AuthProviderType;
  @ApiProperty({ enum: NotificationChannelType })
  eventReminderChannel: NotificationChannelType;
  @ApiProperty({ enum: NotificationChannelType })
  ticketPurchaseChannel: NotificationChannelType;
  @ApiProperty({ enum: NotificationChannelType })
  newCommentChannel: NotificationChannelType;
  @ApiProperty({ enum: NotificationChannelType })
  companyUpdateChannel: NotificationChannelType;
}

export class UserRelations {
  // @Type(() => Comment)
  // comments: Comment[];
  // @Type(() => Ticket)
  // tickets: Ticket[];
  // @Type(() => Event)
  // events: Event[];
  // @Type(() => Notification)
  // notifications: Notification[];
  // @Type(() => Notification)
  // sentNotifications: Notification[];
  // @Type(() => EventAttendee)
  // eventAttendees: EventAttendee[];
}

export class UserEntity
  extends IntersectionType(UserDescription, UserRelations)
  implements BaseEntity
{
  constructor(data: User, options?: ClassTransformOptions) {
    super();
    plainToClassFromExist(this, data, options);
  }
}

export class PaginatedUsers extends Paginated<User> {
  @Type(() => UserEntity)
  @ApiProperty({ type: () => UserEntity, isArray: true })
  declare items: User[];
}
