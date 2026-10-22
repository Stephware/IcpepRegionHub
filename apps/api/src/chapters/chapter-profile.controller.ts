import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "../common/constants/roles.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import {
  AuthGuard,
  type AuthenticatedUser,
} from "../common/guards/auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { ChaptersService } from "./chapters.service.js";
import { UpdateChapterContactDto } from "./dto/update-chapter-contact.dto.js";

@Controller("chapter/profile")
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ChapterOfficer)
export class ChapterProfileController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Get()
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.chaptersService.getPublicChapter(this.chapterId(user));
  }

  @Patch()
  updateContacts(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateChapterContactDto,
  ) {
    return this.chaptersService.updateChapterContacts(
      this.chapterId(user),
      input,
    );
  }

  private chapterId(user: AuthenticatedUser) {
    if (!user.chapterId)
      throw new ForbiddenException("An affiliated chapter is required.");
    return BigInt(user.chapterId);
  }
}
