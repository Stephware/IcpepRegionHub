import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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

  async createEvent(input: CreateEventDto, createdByUserId: bigint) {
    const organizerChapterId = this.parseOptionalId(
      input.organizerChapterId,
      "Organizer chapter",
    );

    if (organizerChapterId !== null) {
      await this.ensureChapterExists(organizerChapterId);
    }

    const startDateTime = this.parseDate(input.startDateTime, "Start date");
    const endDateTime = this.parseOptionalDate(input.endDateTime, "End date");
    const registrationDeadline = this.parseOptionalDate(
      input.registrationDeadline,
      "Registration deadline",
    );

    this.validateSchedule(
      startDateTime,
      endDateTime,
      registrationDeadline,
    );

    const event = await this.prisma.event.create({
      data: {
        title: this.requiredText(input.title, "Title"),
        description: this.optionalText(input.description),
        eventType: this.requiredText(input.eventType, "Event type"),
        organizerChapterId,
        venue: this.optionalText(input.venue),
        startDateTime,
        endDateTime,
        registrationDeadline,
        registrationLink: this.optionalText(input.registrationLink),
        coverImageUrl: this.optionalText(input.coverImageUrl),
        status: "Upcoming",
        isPublished: false,
        createdByUserId,
      },
      include: eventInclude,
    });

    return {
      message: "Event created successfully.",
      event: this.toAdminEvent(event),
    };
  }

  async updateEvent(eventId: bigint, input: UpdateEventDto) {
    const existing = await this.findEvent(eventId);

    const organizerChapterId =
      input.organizerChapterId === undefined
        ? undefined
        : this.parseOptionalId(
            input.organizerChapterId ?? undefined,
            "Organizer chapter",
          );

    if (organizerChapterId !== undefined && organizerChapterId !== null) {
      await this.ensureChapterExists(organizerChapterId);
    }

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

    this.validateSchedule(
      startDateTime,
      endDateTime,
      registrationDeadline,
    );

    const event = await this.prisma.event.update({
      where: { eventId },
      data: {
        title:
          input.title === undefined
            ? undefined
            : this.requiredText(input.title, "Title"),
        description: this.optionalText(input.description),
        eventType:
          input.eventType === undefined
            ? undefined
            : this.requiredText(input.eventType, "Event type"),
        organizerChapterId,
        venue: this.optionalText(input.venue),
        startDateTime:
          input.startDateTime === undefined ? undefined : startDateTime,
        endDateTime:
          input.endDateTime === undefined ? undefined : endDateTime,
        registrationDeadline:
          input.registrationDeadline === undefined
            ? undefined
            : registrationDeadline,
        registrationLink: this.optionalText(input.registrationLink),
        coverImageUrl: this.optionalText(input.coverImageUrl),
        updatedAt: new Date(),
      },
      include: eventInclude,
    });

    return {
      message: "Event updated successfully.",
      event: this.toAdminEvent(event),
    };
  }

  async setPublished(eventId: bigint, isPublished: boolean) {
    const existing = await this.findEvent(eventId);

    if (isPublished && existing.status === "Cancelled") {
      throw new BadRequestException(
        "A cancelled event cannot be published until it is restored.",
      );
    }

    const event = await this.prisma.event.update({
      where: { eventId },
      data: {
        isPublished,
        updatedAt: new Date(),
      },
      include: eventInclude,
    });

    return {
      message: isPublished
        ? "Event published successfully."
        : "Event unpublished successfully.",
      event: this.toAdminEvent(event),
    };
  }

  async setCancelled(eventId: bigint, isCancelled: boolean) {
    await this.ensureEventExists(eventId);

    const event = await this.prisma.event.update({
      where: { eventId },
      data: {
        status: isCancelled ? "Cancelled" : "Upcoming",
        updatedAt: new Date(),
      },
      include: eventInclude,
    });

    return {
      message: isCancelled
        ? "Event cancelled successfully."
        : "Event restored successfully.",
      event: this.toAdminEvent(event),
    };
  }

  async deleteEvent(eventId: bigint) {
    await this.ensureEventExists(eventId);

    await this.prisma.event.delete({
      where: { eventId },
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

  private async ensureEventExists(eventId: bigint) {
    const event = await this.prisma.event.findUnique({
      where: { eventId },
      select: { eventId: true },
    });

    if (!event) {
      throw new NotFoundException("Event was not found.");
    }
  }

  private async ensureChapterExists(chapterId: bigint) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { chapterId },
      select: { chapterId: true },
    });

    if (!chapter) {
      throw new BadRequestException("Organizer chapter was not found.");
    }
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

  private deriveStatus(event: Pick<EventRecord, "status" | "startDateTime" | "endDateTime">) {
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

  private parseOptionalDate(
    value: string | null | undefined,
    label: string,
  ) {
    if (value === undefined || value === null || value.trim() === "") {
      return null;
    }

    return this.parseDate(value, label);
  }

  private parseOptionalId(value: string | undefined, label: string) {
    if (value === undefined || value.trim() === "") {
      return null;
    }

    if (!/^\d+$/.test(value)) {
      throw new BadRequestException(
        `${label} ID must be a positive integer.`,
      );
    }

    const parsed = BigInt(value);

    if (parsed <= 0n) {
      throw new BadRequestException(
        `${label} ID must be a positive integer.`,
      );
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
