import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationDto {
  @ApiProperty({ required: false, example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
