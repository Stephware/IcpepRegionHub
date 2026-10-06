import { Controller, Get } from "@nestjs/common";
import { AnnouncementsService } from "./announcements.service.js";

@Controller("announcements")
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  getStatus() {
    return this.announcementsService.getStatus();
  }
}
