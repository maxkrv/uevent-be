import { ApiProperty } from '@nestjs/swagger';
import { NotificationChannelType } from '@prisma/client';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ required: false, example: 'John Doe' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiProperty({ required: false, example: 'This is my bio' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  bio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  showInAttendeeList?: boolean;

  @ApiProperty({ required: false, enum: NotificationChannelType })
  @IsOptional()
  @IsBoolean()
  newCommentChannel?: NotificationChannelType;

  @ApiProperty({ required: false, enum: NotificationChannelType })
  @IsOptional()
  @IsBoolean()
  eventReminderChannel?: NotificationChannelType;

  @ApiProperty({ required: false, enum: NotificationChannelType })
  @IsOptional()
  @IsBoolean()
  companyUpdateChannel?: NotificationChannelType;

  @ApiProperty({ required: false, enum: NotificationChannelType })
  @IsOptional()
  @IsBoolean()
  ticketPurchaseChannel?: NotificationChannelType;
}
