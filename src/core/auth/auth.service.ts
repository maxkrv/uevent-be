import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthProviderType, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import ActivationLink from 'src/emails/activation-link';
import ResetPasswordLink from 'src/emails/reset-password';

import { ApiConfigService } from '../../config/api-config.service';
import { DatabaseService } from '../db/database.service';
import { MailService } from '../mail/mail.service';
import { UserEntity } from '../user/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Success } from './dto/success.dto';
import { Tokens } from './dto/tokens.dto';
import { JwtPayload } from './interface/jwt.interface';
import { SocialInterface } from './interface/social.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ApiConfigService,
    private readonly mailService: MailService,
    private readonly redis: Redis,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.databaseService.user.findUnique({
      where: {
        email: dto.email,
        authProvider: AuthProviderType.EMAIL,
      },
    });

    if (!user) {
      throw new BadRequestException('Wrong email');
    }

    if (!(await bcrypt.compare(dto.password, user.password))) {
      throw new BadRequestException('Wrong password');
    }
    if (!user.emailVerified) {
      await this.sendActivationLink(user.email, user.id, user.name);
      throw new BadRequestException(
        'Email not verified. Please verify your email',
      );
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return this.generateTokenPair(payload);
  }

  static async hash(password: string) {
    return await bcrypt.hash(password, 10);
  }

  async register(dto: RegisterDto) {
    const dbUser = await this.databaseService.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (dbUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hash: string = await AuthService.hash(dto.password);
    const user = await this.databaseService.user.create({
      data: {
        email: dto.email,
        password: hash,
        name: dto.name,
        emailVerified: false,
        bio: dto.bio,
        role: UserRole.USER,
        authProvider: AuthProviderType.EMAIL,
      },
    });

    await this.sendActivationLink(user.email, user.id, user.name);

    return new UserEntity(user);
  }

  private async sendActivationLink(email: string, id: string, name: string) {
    await this.mailService.sendMail({
      to: email,
      subject: 'Activate your account',
      template: await ActivationLink({
        link: await this.generateActivationLink(id),
        name: name,
      }),
    });
  }

  async refresh(userId: string, token: string) {
    try {
      const { key } = await this.findRefreshToken(userId, token);

      await this.redis.del(key);

      const { email } = await this.databaseService.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          email: true,
        },
      });
      if (!email) {
        throw new BadRequestException('User not found');
      }

      return this.generateTokenPair({
        sub: userId,
        email,
      });
    } catch {
      throw new ForbiddenException();
    }
  }

  async logout(userId: string, token: string) {
    const { key } = await this.findRefreshToken(userId, token);

    await this.redis.del(key);

    return new Success();
  }

  async activate(token: string) {
    const { sub } = await this.jwtService
      .verifyAsync<{ sub: string }>(token, {
        secret: this.configService.get('mail').token.secret,
      })
      .catch(() => {
        throw new BadRequestException('Invalid token');
      });

    const user = await this.databaseService.user.update({
      where: {
        id: sub,
      },
      data: {
        emailVerified: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.generateTokenPair({
      sub: user.id,
      email: user.email,
    });
  }

  async sendResetPasswordLink(email: string) {
    const user = await this.databaseService.user.findUnique({
      where: {
        email,
        authProvider: AuthProviderType.EMAIL,
      },
    });

    if (!user) {
      throw new BadRequestException("User with this email doesn't exist");
    }

    if (!user.emailVerified) {
      await this.sendActivationLink(user.email, user.id, user.name);
      throw new BadRequestException(
        'Email not verified. Please verify your email',
      );
    }

    const token = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.get('mail').token.secret,
      },
    );

    await this.mailService.sendMail({
      to: email,
      subject: 'Reset password',
      template: await ResetPasswordLink({
        link: `${this.configService.get('app').clientUrl}/auth/reset-password/${token}`,
        name: user.name,
      }),
    });

    return new Success();
  }

  async validateSocialLogin(
    provider: AuthProviderType,
    socialData: SocialInterface,
  ) {
    const userFormDb = await this.databaseService.user.findUnique({
      where: {
        email: socialData.email,
        authProvider: provider,
      },
    });

    const user = userFormDb
      ? userFormDb
      : await this.databaseService.user.create({
          data: {
            email: socialData.email,
            name: socialData.name,
            authProvider: provider,
            emailVerified: true,
            password: null,
            role: UserRole.USER,
          },
        });

    if (user.authProvider !== provider) {
      throw new BadRequestException('Invalid provider');
    }

    return this.generateTokenPair({
      sub: user.id,
      email: user.email,
    });
  }

  async resetPassword({ token, password }: ResetPasswordDto) {
    const { sub } = await this.jwtService.verifyAsync<{ sub: string }>(token, {
      secret: this.configService.get('mail').token.secret,
    });

    const hash: string = await AuthService.hash(password);

    const user = await this.databaseService.user.update({
      where: {
        id: sub,
        authProvider: AuthProviderType.EMAIL,
      },
      data: {
        password: hash,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const keys = await this.redis.keys(`${sub}:*`);

    if (keys.length) {
      await this.redis.del(keys);
    }

    return new Success();
  }

  private async generateTokenPair(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get('jwt').accessToken.time,
        secret: this.configService.get('jwt').accessToken.secret,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get('jwt').refreshToken.time,
        secret: this.configService.get('jwt').refreshToken.secret,
      }),
    ]);

    await this.redis.set(
      `${payload.sub}:${refreshToken}`,
      JSON.stringify(payload),
      'EX',
      this.convertJwtExpToSeconds(
        this.configService.get('jwt').refreshToken.time,
      ),
    );
    return new Tokens(accessToken, refreshToken);
  }

  private convertJwtExpToSeconds(time: string) {
    const [value, unit] = time.split(/(?<=\d)(?=[a-zA-Z])/);

    switch (unit) {
      case 's':
        return +value;
      case 'm':
        return +value * 60;
      case 'h':
        return +value * 3600;
      case 'd':
        return +value * 86400;
      default:
        throw new Error('Invalid time unit');
    }
  }

  private async generateActivationLink(userId: string): Promise<string> {
    const token = await this.jwtService.signAsync(
      { sub: userId },
      {
        secret: this.configService.get('mail').token.secret,
      },
    );

    return `${this.configService.get('app').clientUrl}/auth/activate/${token}`;
  }

  private async findRefreshToken(userId: string, token: string) {
    const key = `${userId}:${token}`;
    const dbToken = await this.redis.get(key);

    if (!dbToken) {
      throw new Error("Refresh token doesn't exist");
    }

    return { key };
  }
}
