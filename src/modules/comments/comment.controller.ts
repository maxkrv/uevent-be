import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';

import { Prefix } from '@/common/enums/prefix.enum';
import { JwtPayload } from '@/core/auth/interface/jwt.interface';
import { GetCurrentUser, Public } from '@/shared/decorators';
import { IDDto } from '@/shared/dto';

import { PaginatedComment } from '../comments/comment.entity';
import { GetCommentDto } from '../comments/dto/get-comment.dto';
import { CommentEntity } from './comment.entity';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller(Prefix.COMMENTS)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @ApiBearerAuth()
  @ApiOkResponse({ type: CommentEntity })
  @Post()
  async create(
    @Body() dto: CreateCommentDto,
    @GetCurrentUser() { sub }: JwtPayload,
  ) {
    return new CommentEntity(await this.commentService.create(sub, dto));
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: CommentEntity })
  @Patch(':id')
  async update(
    @Body() dto: UpdateCommentDto,
    @Param() { id }: IDDto,
    @GetCurrentUser() { sub }: JwtPayload,
  ) {
    return new CommentEntity(await this.commentService.update(id, dto, sub));
  }

  @Public()
  @ApiOkResponse({ type: CommentEntity })
  @Get(':id')
  async findOne(@Param() { id }: IDDto) {
    return new CommentEntity(await this.commentService.findById(id));
  }

  @ApiOkResponse({ type: CommentEntity })
  @Delete(':id')
  async delete(@Param() { id }: IDDto, @GetCurrentUser() { sub }: JwtPayload) {
    return new CommentEntity(await this.commentService.delete(sub, id));
  }

  @ApiOkResponse({ type: PaginatedComment, isArray: true })
  @Public()
  @Get()
  getComments(@Query() dto: GetCommentDto) {
    return this.commentService.findAll(dto);
  }
}
