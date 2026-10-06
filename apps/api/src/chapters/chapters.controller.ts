import { BadRequestException, Controller, Get, Param } from "@nestjs/common";
import { ChaptersService } from "./chapters.service.js";

@Controller("chapters")
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Get()
  listChapters() {
    return this.chaptersService.listActiveChapters();
  }

  @Get(":id")
  getChapter(@Param("id") id: string) {
    return this.chaptersService.getPublicChapter(this.parseChapterId(id));
  }

  @Get(":id/officers")
  listCurrentOfficers(@Param("id") id: string) {
    return this.chaptersService.listCurrentOfficers(this.parseChapterId(id));
  }

  private parseChapterId(id: string) {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException("Chapter ID must be a positive integer.");
    }

    const chapterId = BigInt(id);

    if (chapterId <= 0n) {
      throw new BadRequestException("Chapter ID must be a positive integer.");
    }

    return chapterId;
  }
}
