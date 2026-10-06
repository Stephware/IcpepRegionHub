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
import { CreateEventDto } from "./dto/create-event.dto.js";
import { UpdateEventCancelledDto } from "./dto/update-event-cancelled.dto.js";
import { UpdateEventPublishDto } from "./dto/update-event-publish.dto.js";
import { UpdateEventDto } from "./dto/update-event.dto.js";
import { EventsService } from "./events.service.js";

@Controller("admin/events")
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.RegionalAdmin)
export class EventAdminController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  listEvents() {
    return this.eventsService.listAdminEvents();
  }

  @Get(":id")
  getEvent(@Param("id") id: string) {
    return this.eventsService.getAdminEvent(this.parseId(id));
  }

  @Post()
  createEvent(
    @Body() input: CreateEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.createEvent(input, BigInt(user.userId));
  }

  @Patch(":id")
  updateEvent(@Param("id") id: string, @Body() input: UpdateEventDto) {
    return this.eventsService.updateEvent(this.parseId(id), input);
  }

  @Patch(":id/publish")
  setPublished(
    @Param("id") id: string,
    @Body() input: UpdateEventPublishDto,
  ) {
    return this.eventsService.setPublished(this.parseId(id), input.isPublished);
  }

  @Patch(":id/cancel")
  setCancelled(
    @Param("id") id: string,
    @Body() input: UpdateEventCancelledDto,
  ) {
    return this.eventsService.setCancelled(this.parseId(id), input.isCancelled);
  }

  @Delete(":id")
  deleteEvent(@Param("id") id: string) {
    return this.eventsService.deleteEvent(this.parseId(id));
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
