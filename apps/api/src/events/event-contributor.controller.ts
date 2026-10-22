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

@Controller("contributor/events")
@UseGuards(AuthGuard, RolesGuard)
@Roles(
  UserRole.RegionalAdmin,
  UserRole.RegionalOfficer,
  UserRole.ChapterOfficer,
  UserRole.FacultyRepresentative,
)
export class EventContributorController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  listEvents(@CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.listContributorEvents(user);
  }

  @Get(":id")
  getEvent(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.getContributorEvent(this.parseId(id), user);
  }

  @Post()
  createEvent(
    @Body() input: CreateEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.createEvent(input, user);
  }

  @Patch(":id")
  updateEvent(
    @Param("id") id: string,
    @Body() input: UpdateEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.updateEvent(this.parseId(id), input, user);
  }

  @Patch(":id/publish")
  setPublished(
    @Param("id") id: string,
    @Body() input: UpdateEventPublishDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.setPublished(
      this.parseId(id),
      input.isPublished,
      user,
    );
  }

  @Patch(":id/cancel")
  setCancelled(
    @Param("id") id: string,
    @Body() input: UpdateEventCancelledDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.setCancelled(
      this.parseId(id),
      input.isCancelled,
      user,
    );
  }

  @Delete(":id")
  deleteEvent(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.deleteEvent(this.parseId(id), user);
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
