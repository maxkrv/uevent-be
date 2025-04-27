import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';

import { Prefix } from '@/common/enums/prefix.enum';
import { JwtPayload } from '@/core/auth/interface/jwt.interface';
import { GetCurrentUser, Public } from '@/shared/decorators';
import { IDDto } from '@/shared/dto';

import { CreateReactionDto } from './dto/create-reaction.dto';
import { GetReactionDto } from './dto/get-reaction.dto';
import { ReactionEntity } from './reaction.entity';
import { ReactionService } from './reaction.service';

@Controller(Prefix.REACTIONS)
export class ReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  @ApiBearerAuth()
  @ApiOkResponse({ type: ReactionEntity })
  @Post()
  async create(
    @Body() dto: CreateReactionDto,
    @GetCurrentUser() { sub }: JwtPayload,
  ) {
    return new ReactionEntity(await this.reactionService.create(dto, sub));
  }

  @Public()
  @Get('count')
  async getReactionStats(@Query() dto: GetReactionDto) {
    return this.reactionService.getReactionCount(dto);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: ReactionEntity })
  @Get('my')
  async findMy(@GetCurrentUser() { sub }: JwtPayload) {
    return this.reactionService.findAllByUserId(sub);
  }

  @ApiOkResponse({ type: ReactionEntity })
  @Delete(':id')
  async delete(@Param() { id }: IDDto, @GetCurrentUser() { sub }: JwtPayload) {
    return new ReactionEntity(await this.reactionService.delete(sub, id));
  }
}
