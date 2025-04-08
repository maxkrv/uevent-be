import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCompanyNewsDto {
  @ApiProperty({ required: true, example: 'This is a news title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({ required: true, example: 'This is a news content' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @ApiProperty({ required: true, example: 'id' })
  @IsString()
  @IsNotEmpty()
  companyId: string;
}
