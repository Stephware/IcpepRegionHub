import { Controller, Get } from "@nestjs/common";
import { ChaptersService } from "./chapters.service.js";

@Controller("chapters")
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Get()
  getStatus() {
    return this.chaptersService.getStatus();
  }
}
