import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

export class CreateEventLocationDto {
  @ApiProperty({ required: true, example: '123 Main St' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address: string;

  @ApiProperty({ required: true, example: 40.7128 })
  @IsNotEmpty()
  @IsNumber()
  lat: number;

  @ApiProperty({ required: true, example: -74.006 })
  @IsNotEmpty()
  @IsNumber()
  lng: number;
}
