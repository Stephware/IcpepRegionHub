import { Controller, Get } from "@nestjs/common";
import { EventsService } from "./events.service.js";

@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  getStatus() {
    return this.eventsService.getStatus();
  }
}
