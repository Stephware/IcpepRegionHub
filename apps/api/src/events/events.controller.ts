import { BadRequestException, Controller, Get, Param } from "@nestjs/common";
import { EventsService } from "./events.service.js";

@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  listEvents() {
    return this.eventsService.listPublishedEvents();
  }

  @Get(":id")
  getEvent(@Param("id") id: string) {
    return this.eventsService.getPublishedEvent(this.parseId(id));
  }

  private parseId(id: string) {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException("Event ID must be a positive integer.");
    }

    const eventId = BigInt(id);

    if (eventId <= 0n) {
      throw new BadRequestException("Event ID must be a positive integer.");
    }

    return eventId;
  }
}
