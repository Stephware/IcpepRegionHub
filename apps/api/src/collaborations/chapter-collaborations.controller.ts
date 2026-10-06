import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "../common/constants/roles.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { AuthGuard } from "../common/guards/auth.guard.js";
import type { AuthenticatedUser } from "../common/guards/auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { CollaborationsService } from "./collaborations.service.js";
import { CreateCollaborationPostDto } from "./dto/create-collaboration-post.dto.js";
import { UpdateCollaborationPostDto } from "./dto/update-collaboration-post.dto.js";

@Controller("chapter/collaborations")
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ChapterOfficer)
export class ChapterCollaborationsController {
  constructor(private readonly collaborationsService: CollaborationsService) {}

  @Get()
  listMyPosts(@CurrentUser() user: AuthenticatedUser) {
    return this.collaborationsService.listMyPosts(
      this.requireChapterId(user),
      BigInt(user.userId),
    );
  }

  @Get(":id")
  getMyPost(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collaborationsService.getMyPost(
      this.parseId(id),
      this.requireChapterId(user),
      BigInt(user.userId),
    );
  }

  @Post()
  createPost(
    @Body() input: CreateCollaborationPostDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collaborationsService.createPost(
      input,
      this.requireChapterId(user),
      BigInt(user.userId),
    );
  }

  @Patch(":id")
  updatePost(
    @Param("id") id: string,
    @Body() input: UpdateCollaborationPostDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collaborationsService.updatePost(
      this.parseId(id),
      input,
      this.requireChapterId(user),
      BigInt(user.userId),
    );
  }

  @Patch(":id/close")
  closePost(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collaborationsService.closePost(
      this.parseId(id),
      this.requireChapterId(user),
      BigInt(user.userId),
    );
  }

  @Delete(":id")
  deletePost(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collaborationsService.deletePost(
      this.parseId(id),
      this.requireChapterId(user),
      BigInt(user.userId),
    );
  }

  private requireChapterId(user: AuthenticatedUser) {
    if (!user.chapterId || !/^\d+$/.test(user.chapterId)) {
      throw new BadRequestException(
        "Your account must be linked to a chapter before managing collaboration posts.",
      );
    }

    return BigInt(user.chapterId);
  }

  private parseId(id: string) {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException(
        "Collaboration post ID must be a positive integer.",
      );
    }

    const postId = BigInt(id);

    if (postId <= 0n) {
      throw new BadRequestException(
        "Collaboration post ID must be a positive integer.",
      );
    }

    return postId;
  }
}
