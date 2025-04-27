import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ required: true, example: 'This is a comment' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  content: string;

  @ApiProperty({ required: false, example: 'cl8d2k3f7000012xj5wl8a2hj' })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({ required: false, example: 'cl8d2k3f7000012xj5wl8a2hj' })
  @IsString()
  @IsOptional()
  eventId?: string;

  @ApiProperty({ required: false, example: 'cl8d2k3f7000012xj5wl8a2hj' })
  @IsString()
  @IsOptional()
  newsId?: string;
}
