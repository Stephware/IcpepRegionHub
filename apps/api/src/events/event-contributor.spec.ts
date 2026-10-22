import { describe, expect, it, jest } from "@jest/globals";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import type { AuthenticatedUser } from "../common/guards/auth.guard.js";
import type { PrismaService } from "../prisma/prisma.service.js";
import { EventsService } from "./events.service.js";

const admin: AuthenticatedUser = {
  userId: "1",
  chapterId: null,
  role: "RegionalAdmin",
  firstName: "A",
  lastName: "Admin",
  email: "private@example.com",
};
const chapterOfficer = {
  ...admin,
  userId: "2",
  chapterId: "10",
  role: "ChapterOfficer",
};
const faculty = { ...chapterOfficer, role: "FacultyRepresentative" };
const input = {
  title: "Seminar",
  eventType: "Seminar",
  startDateTime: "2099-11-10T01:00:00.000Z",
};
function setup() {
  let record = {
    eventId: 20n,
    ...input,
    startDateTime: new Date(input.startDateTime),
    endDateTime: null,
    registrationDeadline: null,
    description: null,
    venue: null,
    registrationLink: null,
    coverImageUrl: null,
    organizerChapterId: 10n,
    createdByUserId: 2n,
    status: "Upcoming",
    isPublished: false,
    scope: "Chapter",
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: null,
    organizer: {
      chapterId: 10n,
      schoolName: "Institution",
      chapterName: "Chapter",
      acronym: null,
    },
    createdBy: {
      userId: 2n,
      firstName: "Faculty",
      lastName: "Member",
      facultyDesignation: "Professor",
    },
  };
  const actions: unknown[] = [];
  const prisma = {
    event: {
      findUnique: jest.fn(async () => record),
      findMany: jest.fn(async () => [record]),
      create: jest.fn(async ({ data }) => {
        record = { ...record, ...data };
        return record;
      }),
      update: jest.fn(async ({ data }) => {
        record = { ...record, ...data };
        return record;
      }),
      delete: jest.fn(async () => record),
    },
    chapter: {
      findUnique: jest.fn(async () => ({ chapterId: 10n, status: "Active" })),
    },
    contentAction: {
      create: jest.fn(async ({ data }) => {
        actions.push(data);
        return data;
      }),
    },
    $transaction: jest.fn(async (callback) => callback(prisma)),
  };
  return {
    prisma,
    actions,
    service: new EventsService(prisma as unknown as PrismaService),
  };
}

describe("scoped contributor events", () => {
  it.each([
    [chapterOfficer, "Chapter"],
    [faculty, "Academic"],
    [{ ...admin, role: "RegionalOfficer" }, "Regional"],
  ] as const)("derives scope and ownership for $role", async (actor, scope) => {
    const { service } = setup();
    const result = await service.createEvent(input, actor);
    expect(result.event).toMatchObject({
      scope,
      createdByUserId: actor.userId,
      organizerChapterId: scope === "Regional" ? null : "10",
      editorialState: "Draft",
    });
  });
  it("rejects forged regional scope and chapter organizers", async () => {
    const { service } = setup();
    await expect(
      service.createEvent({ ...input, scope: "Regional" }, faculty),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.createEvent(
        { ...input, organizerChapterId: "99" },
        chapterOfficer,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it("requires an active assigned institution", async () => {
    const { service, prisma } = setup();
    prisma.chapter.findUnique.mockResolvedValue({
      chapterId: 10n,
      status: "Inactive",
    });
    await expect(service.createEvent(input, faculty)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.createEvent(input, { ...chapterOfficer, chapterId: null }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it("filters contributor lists by owner while admins can see every event", async () => {
    const { service, prisma } = setup();
    await service.listContributorEvents(chapterOfficer);
    expect(prisma.event.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          createdByUserId: 2n,
          scope: "Chapter",
          organizerChapterId: 10n,
        },
      }),
    );
    await service.listContributorEvents(admin);
    expect(prisma.event.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });
  it("forbids every cross-user mutation and read", async () => {
    const { service } = setup();
    const other = { ...chapterOfficer, userId: "3" };
    await expect(
      service.getContributorEvent(20n, other),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.updateEvent(20n, { title: "Forged" }, other),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.setPublished(20n, true, other)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.setCancelled(20n, true, other)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.deleteEvent(20n, other)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
  it.each([
    [{ ...chapterOfficer, role: "RegionalOfficer", chapterId: null }, faculty],
    [chapterOfficer, { ...chapterOfficer, chapterId: "11" }],
    [faculty, { ...faculty, chapterId: "11" }],
  ])(
    "revokes old event access after a role or institution change",
    async (originalActor, currentActor) => {
      const { service, prisma } = setup();
      await service.createEvent(input, originalActor);
      await expect(
        service.getContributorEvent(20n, currentActor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.setPublished(20n, false, currentActor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.setCancelled(20n, true, currentActor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.event.update).not.toHaveBeenCalled();
    },
  );
  it("allows safe withdrawal from the same assigned institution after it becomes inactive", async () => {
    const { service, prisma } = setup();
    prisma.chapter.findUnique.mockResolvedValue({
      chapterId: 10n,
      status: "Inactive",
    });
    expect(
      (await service.getContributorEvent(20n, chapterOfficer)).createdByUserId,
    ).toBe("2");
    expect(
      (await service.setPublished(20n, false, chapterOfficer)).event
        .editorialState,
    ).toBe("Draft");
    expect(
      (await service.setCancelled(20n, true, chapterOfficer)).event
        .editorialState,
    ).toBe("Cancelled");
  });
  it("filters lists by the current role and institution and hides unaffiliated chapter content", async () => {
    const { service, prisma } = setup();
    await service.listContributorEvents({ ...faculty, chapterId: "11" });
    expect(prisma.event.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          createdByUserId: 2n,
          scope: "Academic",
          organizerChapterId: 11n,
        },
      }),
    );
    expect(
      await service.listContributorEvents({ ...faculty, chapterId: null }),
    ).toEqual([]);
  });
  it("rechecks scope and affiliation before publishing existing events", async () => {
    const { service } = setup();
    await expect(
      service.setPublished(20n, true, faculty),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it("publishes immediately with a timestamp and an atomic publication record", async () => {
    const { service, prisma, actions } = setup();
    const result = await service.setPublished(20n, true, chapterOfficer);
    expect(result.event).toMatchObject({
      isPublished: true,
      editorialState: "Published",
      status: "Upcoming",
      publishedAt: expect.any(Date),
    });
    expect(actions).toEqual([
      expect.objectContaining({
        resource: "Event",
        resourceId: 20n,
        action: "Published",
        actorUserId: 2n,
      }),
    ]);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
  it("lets admins moderate any event and records the actual admin", async () => {
    const { service, actions } = setup();
    expect(
      (await service.setCancelled(20n, true, admin)).event.editorialState,
    ).toBe("Cancelled");
    await service.setPublished(20n, false, admin);
    await service.deleteEvent(20n, admin);
    expect(actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "Cancelled", actorUserId: 1n }),
        expect.objectContaining({ action: "Unpublished", actorUserId: 1n }),
        expect.objectContaining({ action: "Deleted", actorUserId: 1n }),
      ]),
    );
  });
  it("exposes faculty attribution without account email", async () => {
    const { service } = setup();
    const result = await service.createEvent(input, faculty);
    expect(result.event.createdBy.facultyDesignation).toBe("Professor");
    expect(result.event.createdBy).not.toHaveProperty("email");
  });
});
