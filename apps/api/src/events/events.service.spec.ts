import { describe, expect, it, jest } from "@jest/globals";
import { BadRequestException } from "@nestjs/common";
import type { PrismaService } from "../prisma/prisma.service.js";
import { EventsService } from "./events.service.js";

const event = {
  eventId: 20n,
  title: "Regional Assembly",
  description: "Annual regional assembly.",
  eventType: "Assembly",
  organizerChapterId: null,
  venue: "Pampanga",
  startDateTime: new Date("2099-11-10T01:00:00.000Z"),
  endDateTime: new Date("2099-11-10T04:00:00.000Z"),
  registrationDeadline: new Date("2099-11-09T12:00:00.000Z"),
  registrationLink: "https://example.com/register",
  coverImageUrl: null,
  status: "Upcoming",
  isPublished: true,
  createdByUserId: 1n,
  createdAt: new Date("2026-10-06T00:00:00.000Z"),
  updatedAt: null,
  organizer: null,
  createdBy: {
    userId: 1n,
    firstName: "Regional",
    lastName: "Admin",
  },
};

function createService() {
  const prisma = {
    event: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    chapter: {
      findUnique: jest.fn(),
    },
  };

  return {
    prisma,
    service: new EventsService(prisma as unknown as PrismaService),
  };
}

describe("EventsService", () => {
  it("lists published events in public responses", async () => {
    const { prisma, service } = createService();
    prisma.event.findMany.mockResolvedValue([event]);

    const result = await service.listPublishedEvents();

    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isPublished: true },
      }),
    );
    expect(result[0]).toEqual(
      expect.objectContaining({
        eventId: "20",
        title: "Regional Assembly",
        status: "Upcoming",
      }),
    );
    expect(result[0]).not.toHaveProperty("isPublished");
  });

  it("creates a regional event as an unpublished draft", async () => {
    const { prisma, service } = createService();
    prisma.event.create.mockResolvedValue({
      ...event,
      isPublished: false,
    });

    const result = await service.createEvent(
      {
        title: " Regional Assembly ",
        eventType: " Assembly ",
        startDateTime: "2099-11-10T01:00:00.000Z",
        endDateTime: "2099-11-10T04:00:00.000Z",
        registrationDeadline: "2099-11-09T12:00:00.000Z",
      },
      1n,
    );

    expect(prisma.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Regional Assembly",
          eventType: "Assembly",
          organizerChapterId: null,
          status: "Upcoming",
          isPublished: false,
          createdByUserId: 1n,
        }),
      }),
    );
    expect(result.event.isPublished).toBe(false);
  });

  it("validates chapter organizers before creating an event", async () => {
    const { prisma, service } = createService();
    prisma.chapter.findUnique.mockResolvedValue(null);

    await expect(
      service.createEvent(
        {
          title: "Chapter Event",
          eventType: "Seminar",
          organizerChapterId: "99",
          startDateTime: "2099-11-10T01:00:00.000Z",
        },
        1n,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.event.create).not.toHaveBeenCalled();
  });

  it("rejects an end date that is before the start date", async () => {
    const { service } = createService();

    await expect(
      service.createEvent(
        {
          title: "Invalid Event",
          eventType: "Meeting",
          startDateTime: "2099-11-10T04:00:00.000Z",
          endDateTime: "2099-11-10T01:00:00.000Z",
        },
        1n,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("marks an event as cancelled", async () => {
    const { prisma, service } = createService();
    prisma.event.findUnique.mockResolvedValue({ eventId: 20n });
    prisma.event.update.mockResolvedValue({
      ...event,
      status: "Cancelled",
    });

    const result = await service.setCancelled(20n, true);

    expect(prisma.event.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "Cancelled",
        }),
      }),
    );
    expect(result.event.status).toBe("Cancelled");
  });
});
