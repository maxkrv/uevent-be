import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
} from '@nestjs/swagger';

import {
  UploadFileSizeValidator,
  UploadFileTypeValidator,
} from '@/core/file-upload/validators';
import { GetCurrentUser } from '@/shared/decorators/get-current-user.decorator';

import { Prefix } from '../../common/enums/prefix.enum';
import { CompanySubscriptionEntity } from '../../modules/company/entities/company-subscrtiptions.entity';
import { GetEventDto } from '../../modules/event/dto/get-event.dto';
import { PaginatedEvent } from '../../modules/event/entities/event.entity';
import { EventSubscriptionEntity } from '../../modules/event/entities/event-subscriptions.entity';
import { EventService } from '../../modules/event/event.service';
import { Public } from '../../shared/decorators';
import { IDDto } from '../../shared/dto';
import { JwtPayload } from '../auth/interface/jwt.interface';
import {
  IMG_ALLOWED_TYPES,
  IMG_MAX_SIZE,
} from '../file-upload/file-upload.contsants';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { UserEntity } from './entities/user.entity';
import { UserService } from './user.service';

@ApiBearerAuth()
@Controller(Prefix.USERS)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly eventService: EventService,
  ) {}

  @Get('me')
  @ApiOkResponse({ type: UserEntity })
  async me(@GetCurrentUser() { sub }: JwtPayload): Promise<UserEntity> {
    return new UserEntity(await this.userService.me(sub));
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: PaginatedEvent })
  @Get('me/events')
  async findMyEvents(
    @GetCurrentUser() { sub }: JwtPayload,
    @Query() dto: GetEventDto,
  ) {
    return this.eventService.findAll(dto, sub);
  }

  @Public()
  @ApiOkResponse({ type: PaginatedEvent, isArray: true })
  @Get(':id/events')
  async findUserEvents(@Param() { id }: IDDto, @Query() dto: GetEventDto) {
    const user = await this.userService.me(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.settings.showInAttendeeList) {
      throw new ForbiddenException("User's events are private");
    }
    return this.eventService.findAll(dto, id);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: EventSubscriptionEntity, isArray: true })
  @Get('me/subscriptions/events')
  async findMyEventsSubscriptions(@GetCurrentUser() { sub }: JwtPayload) {
    return this.userService.findMyEventsSubscriptions(sub);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: CompanySubscriptionEntity, isArray: true })
  @Get('me/subscriptions/companies')
  async findMyCompaniesSubscriptions(@GetCurrentUser() { sub }: JwtPayload) {
    return this.userService.findMyCompaniesSubscriptions(sub);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: CompanySubscriptionEntity, isArray: true })
  @Get(':id/subscriptions/companies')
  async findUserCompaniesSubscriptions(@Param() { id }: IDDto) {
    const user = await this.userService.me(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.settings.showFollowingList) {
      throw new ForbiddenException("User's subscriptions are private");
    }
    return this.userService.findMyCompaniesSubscriptions(id);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: EventSubscriptionEntity, isArray: true })
  @Get(':id/subscriptions/events')
  async findUserEventsSubscriptions(@Param() { id }: IDDto) {
    const user = await this.userService.me(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.settings.showFollowingList) {
      throw new ForbiddenException("User's subscriptions are private");
    }
    return this.userService.findMyEventsSubscriptions(id);
  }

  @Get(':id')
  @ApiOkResponse({ type: UserEntity })
  async getById(@Param() { id }: IDDto): Promise<UserEntity> {
    return new UserEntity(await this.userService.getById(id));
  }

  @Patch('me')
  @ApiOkResponse({ type: UserEntity })
  async update(
    @Body() dto: UpdateUserDto,
    @GetCurrentUser() { sub }: JwtPayload,
  ): Promise<UserEntity> {
    return new UserEntity(await this.userService.update(sub, dto));
  }

  @Patch('me/settings')
  @ApiOkResponse({ type: UserEntity })
  async updateSettings(
    @Body() dto: UpdateUserSettingsDto,
    @GetCurrentUser() { sub }: JwtPayload,
  ): Promise<UserEntity> {
    return new UserEntity(await this.userService.updateSettings(sub, dto));
  }

  @ApiOkResponse({ type: UserEntity })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('avatar'))
  @Patch('me/avatar')
  async updateAvatar(
    @GetCurrentUser() { sub }: JwtPayload,
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
  ): Promise<UserEntity> {
    return new UserEntity(await this.userService.updateAvatar(sub, avatar));
  }
}
