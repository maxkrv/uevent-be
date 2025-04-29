import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

import { Prefix } from '@/common/enums/prefix.enum';
import { Success } from '@/core/auth/dto/success.dto';
import { UrlResponse } from '@/core/auth/dto/url.dto';
import { JwtPayload } from '@/core/auth/interface/jwt.interface';
import {
  UploadFileSizeValidator,
  UploadFileTypeValidator,
} from '@/core/file-upload/validators';
import { GetCurrentUser, Public } from '@/shared/decorators';
import { IDDto } from '@/shared/dto';

import {
  IMG_ALLOWED_TYPES,
  IMG_MAX_SIZE,
} from '../../core/file-upload/file-upload.contsants';
import { PaginatedUsers } from '../../core/user/entities/user.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { GetAtendeesDto } from './dto/get-atendees.dto';
import { GetEventDto } from './dto/get-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventEntity, PaginatedEvent } from './entities/event.entity';
import { EventService } from './event.service';

@Controller(Prefix.EVENTS)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @ApiBearerAuth()
  @ApiOkResponse({ type: EventEntity })
  @Post()
  async create(
    @Body() dto: CreateEventDto,
    @GetCurrentUser() { sub }: JwtPayload,
  ) {
    return new EventEntity(await this.eventService.create(sub, dto));
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: EventEntity })
  @Patch(':id')
  async update(
    @Body() dto: UpdateEventDto,
    @GetCurrentUser() { sub }: JwtPayload,
    @Param() { id }: IDDto,
  ) {
    return new EventEntity(await this.eventService.update(id, dto, sub));
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: EventEntity })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        poster: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('poster'))
  @Patch(':id/poster')
  async updateAvatar(
    @GetCurrentUser() { sub }: JwtPayload,
    @Param() { id }: IDDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addValidator(
          new UploadFileTypeValidator({ fileType: IMG_ALLOWED_TYPES }),
        )
        .addValidator(new UploadFileSizeValidator({ maxSize: IMG_MAX_SIZE }))
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          fileIsRequired: true,
        }),
    )
    avatar: Express.Multer.File,
  ): Promise<EventEntity> {
    return new EventEntity(
      await this.eventService.updatePoster(id, sub, avatar),
    );
  }

  @Public()
  @ApiOkResponse({ type: PaginatedEvent, isArray: true })
  @Get()
  async findAll(@Query() dto: GetEventDto) {
    return this.eventService.findAll(dto);
  }

  @Public()
  @ApiOkResponse({ type: EventEntity })
  @Get(':id')
  async findOne(@Param() { id }: IDDto) {
    return new EventEntity(await this.eventService.findById(id));
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: EventEntity })
  @Delete(':id')
  async delete(@GetCurrentUser() { sub }: JwtPayload, @Param() { id }: IDDto) {
    return new EventEntity(await this.eventService.delete(id, sub));
  }

  @ApiBearerAuth()
  @ApiCreatedResponse({ type: Success })
  @Post(':id/subscribe')
  async subscribe(
    @GetCurrentUser() { sub }: JwtPayload,
    @Param() { id }: IDDto,
  ) {
    return await this.eventService.subscribe(id, sub);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: Success })
  @Delete(':id/unsubscribe')
  async unsubscribe(
    @GetCurrentUser() { sub }: JwtPayload,
    @Param() { id }: IDDto,
  ) {
    return this.eventService.unsubscribe(id, sub);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: UrlResponse })
  @Post(':id/purchase')
  async purchase(
    @GetCurrentUser() { sub }: JwtPayload,
    @Param() { id }: IDDto,
  ) {
    return this.eventService.purchase(id, sub);
  }

  @Public()
  @ApiOkResponse({ type: PaginatedUsers, isArray: true })
  @Get(':id/attendees')
  async getAttendees(@Param() { id }: IDDto, @Query() dto: GetAtendeesDto) {
    return this.eventService.getAttendees(id, dto);
  }

  @Public()
  @Get(':id/attendees/count')
  async getAttendeesCount(@Param() { id }: IDDto) {
    return this.eventService.getAttendeesCount(id);
  }
}
