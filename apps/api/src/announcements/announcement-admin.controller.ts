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
import { UpdateAnnouncementPinDto } from "./dto/update-announcement-pin.dto.js";
import { UpdateAnnouncementPublishDto } from "./dto/update-announcement-publish.dto.js";

@Controller("admin/announcements")
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.RegionalAdmin)
export class AnnouncementAdminController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  listAnnouncements() {
    return this.announcementsService.listAdminAnnouncements();
  }

  @Get(":id")
  getAnnouncement(@Param("id") id: string) {
    return this.announcementsService.getAdminAnnouncement(this.parseId(id));
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
  ) {
    return this.announcementsService.updateAnnouncement(
      this.parseId(id),
      input,
    );
  }

  @Patch(":id/publish")
  setPublished(
    @Param("id") id: string,
    @Body() input: UpdateAnnouncementPublishDto,
  ) {
    return this.announcementsService.setPublished(
      this.parseId(id),
      input.isPublished,
    );
  }

  @Patch(":id/pin")
  setPinned(
    @Param("id") id: string,
    @Body() input: UpdateAnnouncementPinDto,
  ) {
    return this.announcementsService.setPinned(
      this.parseId(id),
      input.isPinned,
    );
  }

  @Delete(":id")
  deleteAnnouncement(@Param("id") id: string) {
    return this.announcementsService.deleteAnnouncement(this.parseId(id));
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
