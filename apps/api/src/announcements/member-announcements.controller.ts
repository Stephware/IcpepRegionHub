import {
  BadRequestException,
  Controller,
  Get,
  Param,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../common/guards/auth.guard.js";
import { AnnouncementsService } from "./announcements.service.js";

@Controller("member/announcements")
@UseGuards(AuthGuard)
export class MemberAnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  listAnnouncements() {
    return this.announcementsService.listMemberAnnouncements();
  }

  @Get(":id")
  getAnnouncement(@Param("id") id: string) {
    return this.announcementsService.getMemberAnnouncement(this.parseId(id));
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
