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
import { AnnouncementsService } from "./announcements.service.js";
import { CreateAnnouncementDto } from "./dto/create-announcement.dto.js";
import { UpdateAnnouncementDto } from "./dto/update-announcement.dto.js";
import { UpdateAnnouncementPublishDto } from "./dto/update-announcement-publish.dto.js";

@Controller("regional/announcements")
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.RegionalOfficer, UserRole.RegionalAdmin)
export class RegionalAnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  listAnnouncements(@CurrentUser() user: AuthenticatedUser) {
    return this.announcementsService.listAdminAnnouncements(user);
  }

  @Get(":id")
  getAnnouncement(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.announcementsService.getAdminAnnouncement(
      this.parseId(id),
      user,
    );
  }

  @Post()
  createAnnouncement(
    @Body() input: CreateAnnouncementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.announcementsService.createAnnouncement(
      input,
      BigInt(user.userId),
    );
  }

  @Patch(":id")
  updateAnnouncement(
    @Param("id") id: string,
    @Body() input: UpdateAnnouncementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.announcementsService.updateAnnouncement(
      this.parseId(id),
      input,
      user,
    );
  }

  @Patch(":id/publish")
  setPublished(
    @Param("id") id: string,
    @Body() input: UpdateAnnouncementPublishDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.announcementsService.setPublished(
      this.parseId(id),
      input.isPublished,
      user,
    );
  }

  @Delete(":id")
  deleteAnnouncement(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.announcementsService.deleteAnnouncement(this.parseId(id), user);
  }

  private parseId(id: string) {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException(
        "Announcement ID must be a positive integer.",
      );
    }

    const announcementId = BigInt(id);

    if (announcementId <= 0n) {
      throw new BadRequestException(
        "Announcement ID must be a positive integer.",
      );
    }

    return announcementId;
  }
}
