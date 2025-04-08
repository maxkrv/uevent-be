import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { GetCurrentUser } from 'src/shared/decorators/get-current-user.decorator';
import { Public } from 'src/shared/decorators/public.decorator';
import { SkipAccessTokenCheck } from 'src/shared/decorators/skip-access-token-check.decorator';

import { Prefix } from '../../common/enums/prefix.enum';
import { UserEntity } from '../user/user.entity';
import { AuthService } from './auth.service';
import { EmailDto } from './dto/email.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Success } from './dto/success.dto';
import { Tokens } from './dto/tokens.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { JwtPayloadWithRefresh } from './interface/jwt.interface';

@Controller(Prefix.AUTH)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOkResponse({ type: Tokens })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('register')
  @ApiOkResponse({ type: UserEntity })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiBearerAuth()
  @SkipAccessTokenCheck()
  @UseGuards(RefreshTokenGuard)
  @ApiOkResponse({ type: Success })
  @Post('logout')
  logout(@GetCurrentUser() dto: JwtPayloadWithRefresh) {
    return this.authService.logout(dto.sub, dto.refreshToken);
  }

  @ApiBearerAuth()
  @SkipAccessTokenCheck()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @ApiOkResponse({ type: Tokens })
  refresh(@GetCurrentUser() dto: JwtPayloadWithRefresh) {
    return this.authService.refresh(dto.sub, dto.refreshToken);
  }

  @Public()
  @ApiBearerAuth()
  @Post('activate/:token')
  @ApiOkResponse({ type: Success })
  async activate(@Param('token') token: string) {
    if (!token) {
      throw new BadRequestException('Invalid token');
    }

    return this.authService.activate(token);
  }

  @Public()
  @Post('send-reset-password-link')
  @ApiOkResponse({ type: Success })
  async sendResetPasswordLink(@Body() { email }: EmailDto) {
    return this.authService.sendResetPasswordLink(email);
  }

  @Public()
  @Post('reset-password')
  @ApiOkResponse({ type: Success })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }
}
