import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { LoginDto } from './login.dto';

export class RegisterDto extends LoginDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MaxLength(120)
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false, example: 'This is my bio' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  bio?: string;
}
