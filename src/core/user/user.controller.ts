import {
  Body,
  Controller,
  Get,
  HttpStatus,
  ParseFilePipeBuilder,
  Patch,
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
import { JwtPayload } from '../auth/interface/jwt.interface';
import {
  IMG_ALLOWED_TYPES,
  IMG_MAX_SIZE,
} from '../file-upload/file-upload.contsants';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';

@ApiBearerAuth()
@Controller(Prefix.USERS)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOkResponse({ type: UserEntity })
  async me(@GetCurrentUser() { sub }: JwtPayload): Promise<UserEntity> {
    return new UserEntity(await this.userService.me(sub));
  }

  @Patch('me')
  @ApiOkResponse({ type: UserEntity })
  async update(
    @Body() dto: UpdateUserDto,
    @GetCurrentUser() { sub }: JwtPayload,
  ): Promise<UserEntity> {
    return new UserEntity(await this.userService.update(sub, dto));
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
  @Patch('/avatar')
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
