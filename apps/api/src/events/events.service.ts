import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AuthenticatedUser } from "../common/guards/auth.guard.js";
import { UserRole } from "../common/constants/roles.js";
import type { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateEventDto } from "./dto/create-event.dto.js";
import { UpdateEventDto } from "./dto/update-event.dto.js";

type EventRecord = {
  eventId: bigint;
  title: string;
  description: string | null;
  eventType: string;
  organizerChapterId: bigint | null;
  venue: string | null;
  startDateTime: Date;
  endDateTime: Date | null;
  registrationDeadline: Date | null;
  registrationLink: string | null;
  coverImageUrl: string | null;
  status: string;
  isPublished: boolean;
  scope: string;
  publishedAt: Date | null;
  createdByUserId: bigint;
  createdAt: Date;
  updatedAt: Date | null;
  organizer: {
    chapterId: bigint;
    schoolName: string;
    chapterName: string;
    acronym: string | null;
  } | null;
  createdBy: {
    userId: bigint;
    firstName: string;
    lastName: string;
    facultyDesignation: string | null;
  };
};

const eventInclude = {
  organizer: {
    select: {
      chapterId: true,
      schoolName: true,
      chapterName: true,
      acronym: true,
    },
  },
  createdBy: {
    select: {
      userId: true,
      firstName: true,
      lastName: true,
      facultyDesignation: true,
    },
  },
} as const;

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublishedEvents() {
    const events = await this.prisma.event.findMany({
      where: {
        isPublished: true,
      },
      include: eventInclude,
      orderBy: [{ startDateTime: "asc" }, { title: "asc" }],
    });

    return events.map((event) => this.toPublicEvent(event));
  }

  async getPublishedEvent(eventId: bigint) {
    const event = await this.prisma.event.findFirst({
      where: {
        eventId,
        isPublished: true,
      },
      include: eventInclude,
    });

    if (!event) {
      throw new NotFoundException("Event was not found.");
    }

    return this.toPublicEvent(event);
  }

  async listAdminEvents() {
    const events = await this.prisma.event.findMany({
      include: eventInclude,
      orderBy: [{ startDateTime: "desc" }, { createdAt: "desc" }],
    });

    return events.map((event) => this.toAdminEvent(event));
  }

  async getAdminEvent(eventId: bigint) {
    const event = await this.findEvent(eventId);
    return this.toAdminEvent(event);
  }

  async listContributorEvents(actor: AuthenticatedUser) {
    const attribution = this.permittedAttribution(actor);
    if (
      actor.role !== UserRole.RegionalAdmin &&
      attribution.scope !== "Regional" &&
      attribution.organizerChapterId === null
    ) {
      return [];
    }
    const events = await this.prisma.event.findMany({
      where:
        actor.role === UserRole.RegionalAdmin
          ? {}
          : { createdByUserId: BigInt(actor.userId), ...attribution },
      include: eventInclude,
      orderBy: [{ startDateTime: "desc" }, { createdAt: "desc" }],
    });
    return events.map((event) => this.toAdminEvent(event));
  }

  async getContributorEvent(eventId: bigint, actor: AuthenticatedUser) {
    const event = await this.findEvent(eventId);
    this.ensureOwnership(event, actor);
    return this.toAdminEvent(event);
  }

  async createEvent(input: CreateEventDto, actor: AuthenticatedUser) {
    const attribution = await this.resolveAttribution(input, actor);
    const startDateTime = this.parseDate(input.startDateTime, "Start date");
    const endDateTime = this.parseOptionalDate(input.endDateTime, "End date");
    const registrationDeadline = this.parseOptionalDate(
      input.registrationDeadline,
      "Registration deadline",
    );

    this.validateSchedule(startDateTime, endDateTime, registrationDeadline);

    const event = await this.prisma.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: {
          title: this.requiredText(input.title, "Title"),
          description: this.optionalText(input.description),
          eventType: this.requiredText(input.eventType, "Event type"),
          ...attribution,
          venue: this.optionalText(input.venue),
          startDateTime,
          endDateTime,
          registrationDeadline,
          registrationLink: this.optionalText(input.registrationLink),
          coverImageUrl: this.optionalText(input.coverImageUrl),
          status: "Upcoming",
          isPublished: false,
          createdByUserId: BigInt(actor.userId),
        },
        include: eventInclude,
      });
      await tx.contentAction.create({
        data: {
          resource: "Event",
          resourceId: created.eventId,
          action: "Created",
          actorUserId: BigInt(actor.userId),
        },
      });
      return created;
    });

    return {
      message: "Event created successfully.",
      event: this.toAdminEvent(event),
    };
  }

  async updateEvent(
    eventId: bigint,
    input: UpdateEventDto,
    actor: AuthenticatedUser,
  ) {
    const existing = await this.findEvent(eventId);
    this.ensureOwnership(existing, actor);
    const attribution = await this.resolveAttribution(input, actor, existing);

    const startDateTime =
      input.startDateTime === undefined
        ? existing.startDateTime
        : this.parseDate(input.startDateTime, "Start date");
    const endDateTime =
      input.endDateTime === undefined
        ? existing.endDateTime
        : this.parseOptionalDate(input.endDateTime, "End date");
    const registrationDeadline =
      input.registrationDeadline === undefined
        ? existing.registrationDeadline
        : this.parseOptionalDate(
            input.registrationDeadline,
            "Registration deadline",
          );

    this.validateSchedule(startDateTime, endDateTime, registrationDeadline);

    const event = await this.updateWithAction(
      eventId,
      {
        title:
          input.title === undefined
            ? undefined
            : this.requiredText(input.title, "Title"),
        description: this.optionalText(input.description),
        eventType:
          input.eventType === undefined
            ? undefined
            : this.requiredText(input.eventType, "Event type"),
        ...attribution,
        venue: this.optionalText(input.venue),
        startDateTime:
          input.startDateTime === undefined ? undefined : startDateTime,
        endDateTime: input.endDateTime === undefined ? undefined : endDateTime,
        registrationDeadline:
          input.registrationDeadline === undefined
            ? undefined
            : registrationDeadline,
        registrationLink: this.optionalText(input.registrationLink),
        coverImageUrl: this.optionalText(input.coverImageUrl),
        updatedAt: new Date(),
      },
      actor,
      "Updated",
    );

    return {
      message: "Event updated successfully.",
      event: this.toAdminEvent(event),
    };
  }

  async setPublished(
    eventId: bigint,
    isPublished: boolean,
    actor: AuthenticatedUser,
  ) {
    const existing = await this.findEvent(eventId);
    this.ensureOwnership(existing, actor);
    if (isPublished) {
      await this.resolveAttribution({}, actor, existing);
    }

    if (isPublished && existing.status === "Cancelled") {
      throw new BadRequestException(
        "A cancelled event cannot be published until it is restored.",
      );
    }

    const event = await this.updateWithAction(
      eventId,
      {
        isPublished,
        publishedAt: isPublished
          ? (existing.publishedAt ?? new Date())
          : undefined,
        updatedAt: new Date(),
      },
      actor,
      isPublished ? "Published" : "Unpublished",
    );

    return {
      message: isPublished
        ? "Event published successfully."
        : "Event unpublished successfully.",
      event: this.toAdminEvent(event),
    };
  }

  async setCancelled(
    eventId: bigint,
    isCancelled: boolean,
    actor: AuthenticatedUser,
  ) {
    const existing = await this.findEvent(eventId);
    this.ensureOwnership(existing, actor);
    if (!isCancelled && existing.isPublished) {
      await this.resolveAttribution({}, actor, existing);
    }
    const event = await this.updateWithAction(
      eventId,
      {
        status: isCancelled ? "Cancelled" : "Upcoming",
        updatedAt: new Date(),
      },
      actor,
      isCancelled ? "Cancelled" : "Restored",
    );

    return {
      message: isCancelled
        ? "Event cancelled successfully."
        : "Event restored successfully.",
      event: this.toAdminEvent(event),
    };
  }

  async deleteEvent(eventId: bigint, actor: AuthenticatedUser) {
    const existing = await this.findEvent(eventId);
    this.ensureOwnership(existing, actor);
    if (actor.role !== UserRole.RegionalAdmin) {
      throw new ForbiddenException(
        "Only Regional Admins can remove events. Cancel or unpublish your event instead.",
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.event.delete({ where: { eventId } });
      await tx.contentAction.create({
        data: {
          resource: "Event",
          resourceId: eventId,
          action: "Deleted",
          actorUserId: BigInt(actor.userId),
        },
      });
    });

    return {
      message: "Event deleted successfully.",
    };
  }

  private async findEvent(eventId: bigint) {
    const event = await this.prisma.event.findUnique({
      where: { eventId },
      include: eventInclude,
    });

    if (!event) {
      throw new NotFoundException("Event was not found.");
    }

    return event;
  }

  private permittedAttribution(actor: AuthenticatedUser) {
    const scope =
      actor.role === UserRole.ChapterOfficer
        ? "Chapter"
        : actor.role === UserRole.FacultyRepresentative
          ? "Academic"
          : "Regional";
    return {
      scope,
      organizerChapterId:
        scope === "Regional" || !actor.chapterId
          ? null
          : BigInt(actor.chapterId),
    };
  }

  private ensureOwnership(
    event: Pick<
      EventRecord,
      "createdByUserId" | "scope" | "organizerChapterId"
    >,
    actor: AuthenticatedUser,
  ) {
    if (actor.role === UserRole.RegionalAdmin) return;
    if (event.createdByUserId !== BigInt(actor.userId)) {
      throw new ForbiddenException("You can only manage your own events.");
    }
    const permitted = this.permittedAttribution(actor);
    if (
      event.scope !== permitted.scope ||
      event.organizerChapterId !== permitted.organizerChapterId ||
      (permitted.scope !== "Regional" && permitted.organizerChapterId === null)
    ) {
      throw new ForbiddenException(
        "This event is outside your current role or institution.",
      );
    }
  }

  private async resolveAttribution(
    input: Pick<UpdateEventDto, "scope" | "organizerChapterId">,
    actor: AuthenticatedUser,
    existing?: Pick<EventRecord, "scope" | "organizerChapterId">,
  ) {
    const permittedScope = this.permittedAttribution(actor).scope;
    const isAdmin = actor.role === UserRole.RegionalAdmin;
    const scope = isAdmin
      ? (input.scope ?? existing?.scope ?? "Regional")
      : permittedScope;
    if (!["Regional", "Chapter", "Academic"].includes(scope)) {
      throw new BadRequestException("Event scope is invalid.");
    }
    if (
      !isAdmin &&
      ((input.scope !== undefined && input.scope !== scope) ||
        (existing && existing.scope !== scope))
    ) {
      throw new ForbiddenException(
        "This event scope is not permitted for your role.",
      );
    }
    const assignedChapterId =
      permittedScope === "Regional" ? null : actor.chapterId;
    if (!isAdmin && permittedScope !== "Regional" && !assignedChapterId) {
      throw new ForbiddenException(
        "An assigned active institution is required.",
      );
    }
    const organizerChapterId = isAdmin
      ? input.organizerChapterId === undefined
        ? (existing?.organizerChapterId ?? null)
        : this.parseOptionalId(input.organizerChapterId, "Organizer chapter")
      : assignedChapterId
        ? BigInt(assignedChapterId)
        : null;
    if (
      !isAdmin &&
      ((input.organizerChapterId !== undefined &&
        this.parseOptionalId(input.organizerChapterId, "Organizer chapter") !==
          organizerChapterId) ||
        (existing && existing.organizerChapterId !== organizerChapterId))
    ) {
      throw new ForbiddenException(
        "You can only publish under your assigned organizer.",
      );
    }
    if (scope !== "Regional" && organizerChapterId === null) {
      throw new BadRequestException(
        "Chapter and academic events require an affiliated institution.",
      );
    }
    if (organizerChapterId !== null) {
      const chapter = await this.prisma.chapter.findUnique({
        where: { chapterId: organizerChapterId },
        select: { chapterId: true, status: true },
      });
      if (!chapter || chapter.status !== "Active") {
        throw new BadRequestException("Organizer institution must be active.");
      }
    }
    return { scope, organizerChapterId };
  }

  private async updateWithAction(
    eventId: bigint,
    data: Prisma.EventUncheckedUpdateInput,
    actor: AuthenticatedUser,
    action: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.update({
        where: { eventId },
        data,
        include: eventInclude,
      });
      await tx.contentAction.create({
        data: {
          resource: "Event",
          resourceId: eventId,
          action,
          actorUserId: BigInt(actor.userId),
        },
      });
      return event;
    });
  }

  private validateSchedule(
    startDateTime: Date,
    endDateTime: Date | null,
    registrationDeadline: Date | null,
  ) {
    if (endDateTime && endDateTime.getTime() < startDateTime.getTime()) {
      throw new BadRequestException(
        "End date must be the same as or later than the start date.",
      );
    }

    if (
      registrationDeadline &&
      registrationDeadline.getTime() > startDateTime.getTime()
    ) {
      throw new BadRequestException(
        "Registration deadline cannot be after the event starts.",
      );
    }
  }

  private deriveStatus(
    event: Pick<EventRecord, "status" | "startDateTime" | "endDateTime">,
  ) {
    if (event.status === "Cancelled") {
      return "Cancelled";
    }

    const now = Date.now();
    const start = event.startDateTime.getTime();
    const end = event.endDateTime?.getTime() ?? start;

    if (now < start) {
      return "Upcoming";
    }

    if (now <= end) {
      return "Ongoing";
    }

    return "Completed";
  }

  private parseDate(value: string, label: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${label} is invalid.`);
    }

    return date;
  }

  private parseOptionalDate(value: string | null | undefined, label: string) {
    if (value === undefined || value === null || value.trim() === "") {
      return null;
    }

    return this.parseDate(value, label);
  }

  private parseOptionalId(value: string | null | undefined, label: string) {
    if (value === undefined || value === null || value.trim() === "") {
      return null;
    }

    if (!/^\d+$/.test(value)) {
      throw new BadRequestException(`${label} ID must be a positive integer.`);
    }

    const parsed = BigInt(value);

    if (parsed <= 0n) {
      throw new BadRequestException(`${label} ID must be a positive integer.`);
    }

    return parsed;
  }

  private requiredText(value: string, label: string) {
    const trimmed = value.trim();

    if (!trimmed) {
      throw new BadRequestException(`${label} is required.`);
    }

    return trimmed;
  }

  private optionalText(value: string | undefined) {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed || null;
  }

  private toPublicEvent(event: EventRecord) {
    return {
      eventId: event.eventId.toString(),
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      venue: event.venue,
      startDateTime: event.startDateTime,
      endDateTime: event.endDateTime,
      registrationDeadline: event.registrationDeadline,
      registrationLink: event.registrationLink,
      coverImageUrl: event.coverImageUrl,
      status: this.deriveStatus(event),
      scope: event.scope,
      publishedAt: event.publishedAt,
      editorialState:
        event.status === "Cancelled"
          ? "Cancelled"
          : event.isPublished
            ? "Published"
            : "Draft",
      organizer: event.organizer
        ? {
            chapterId: event.organizer.chapterId.toString(),
            schoolName: event.organizer.schoolName,
            chapterName: event.organizer.chapterName,
            acronym: event.organizer.acronym,
          }
        : null,
      createdBy: {
        userId: event.createdBy.userId.toString(),
        firstName: event.createdBy.firstName,
        lastName: event.createdBy.lastName,
        facultyDesignation:
          event.scope === "Academic"
            ? event.createdBy.facultyDesignation
            : null,
      },
    };
  }

  private toAdminEvent(event: EventRecord) {
    return {
      ...this.toPublicEvent(event),
      organizerChapterId: event.organizerChapterId?.toString() ?? null,
      storedStatus: event.status,
      isPublished: event.isPublished,
      createdByUserId: event.createdByUserId.toString(),
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}
