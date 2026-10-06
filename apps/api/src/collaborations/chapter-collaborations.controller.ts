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
import { CreateCollaborationResponseDto } from "./dto/create-collaboration-response.dto.js";
import { UpdateCollaborationPostDto } from "./dto/update-collaboration-post.dto.js";
import { UpdateCollaborationResponseStatusDto } from "./dto/update-collaboration-response-status.dto.js";

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
      this.parseId(id, "Collaboration post"),
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
      this.parseId(id, "Collaboration post"),
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
      this.parseId(id, "Collaboration post"),
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
      this.parseId(id, "Collaboration post"),
      this.requireChapterId(user),
      BigInt(user.userId),
    );
  }

  @Get(":id/my-response")
  getMyResponse(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collaborationsService.getChapterResponse(
      this.parseId(id, "Collaboration post"),
      this.requireChapterId(user),
    );
  }

  @Post(":id/responses")
  createResponse(
    @Param("id") id: string,
    @Body() input: CreateCollaborationResponseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collaborationsService.createResponse(
      this.parseId(id, "Collaboration post"),
      input,
      this.requireChapterId(user),
      BigInt(user.userId),
    );
  }

  @Delete(":id/responses")
  withdrawResponse(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collaborationsService.withdrawResponse(
      this.parseId(id, "Collaboration post"),
      this.requireChapterId(user),
    );
  }

  @Get(":id/responses")
  listResponses(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collaborationsService.listPostResponses(
      this.parseId(id, "Collaboration post"),
      this.requireChapterId(user),
      BigInt(user.userId),
    );
  }

  @Patch(":postId/responses/:responseId/status")
  updateResponseStatus(
    @Param("postId") postId: string,
    @Param("responseId") responseId: string,
    @Body() input: UpdateCollaborationResponseStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collaborationsService.updateResponseStatus(
      this.parseId(postId, "Collaboration post"),
      this.parseId(responseId, "Collaboration response"),
      input,
      this.requireChapterId(user),
      BigInt(user.userId),
    );
  }

  private requireChapterId(user: AuthenticatedUser) {
    if (!user.chapterId || !/^\d+$/.test(user.chapterId)) {
      throw new BadRequestException(
        "Your account must be linked to a chapter before using collaboration responses.",
      );
    }

    return BigInt(user.chapterId);
  }

  private parseId(id: string, label: string) {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException(
        `${label} ID must be a positive integer.`,
      );
    }

    const parsedId = BigInt(id);

    if (parsedId <= 0n) {
      throw new BadRequestException(
        `${label} ID must be a positive integer.`,
      );
    }

    return parsedId;
  }
}
