import { describe, expect, it, jest } from "@jest/globals";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { UserRole } from "../common/constants/roles.js";
import { DashboardService } from "./dashboard.service.js";

function createService() {
  const announcementsService = {
    listMemberAnnouncements: jest.fn().mockResolvedValue([]),
  };
  const eventsService = {
    listPublishedEvents: jest.fn().mockResolvedValue([]),
  };
  const collaborationsService = {
    listOpenPosts: jest.fn().mockResolvedValue([]),
    listMyPosts: jest.fn().mockResolvedValue([]),
  };
  const assistanceService = {
    listChapterRequests: jest.fn().mockResolvedValue([]),
    listRegionalRequests: jest.fn().mockResolvedValue([]),
  };
  const chaptersService = {
    getPublicChapter: jest.fn().mockResolvedValue({
      chapterId: "1",
      schoolName: "Sample University",
      chapterName: "Sample University",
      acronym: null,
    }),
  };
  const usersService = {
    listPendingUsers: jest.fn().mockResolvedValue([{ userId: "9" }]),
  };
  const adminOverviewService = {
    getMetrics: jest.fn().mockResolvedValue({
      pendingAccounts: 1,
      activeUsers: 4,
      activeChapters: 26,
      draftAnnouncements: 2,
      draftEvents: 3,
      openAssistance: 0,
      openCollaborations: 0,
    }),
  };

  return {
    service: new DashboardService(
      announcementsService as never,
      eventsService as never,
      collaborationsService as never,
      assistanceService as never,
      chaptersService as never,
      usersService as never,
      adminOverviewService as never,
    ),
    announcementsService,
    eventsService,
    collaborationsService,
    assistanceService,
    chaptersService,
    usersService,
    adminOverviewService,
  };
}

describe("DashboardService", () => {
  it("gives faculty only common activity and their institution", async () => {
    const { service, assistanceService, collaborationsService, usersService } =
      createService();
    const result = await service.getDashboard({
      userId: "15",
      chapterId: "1",
      firstName: "Faculty",
      lastName: "Member",
      email: "faculty@example.com",
      role: "FacultyRepresentative",
    });
    expect(result.role).toBe("FacultyRepresentative");
    expect(Object.keys(result.data).sort()).toEqual([
      "announcements",
      "chapter",
      "collaborations",
      "events",
    ]);
    expect(assistanceService.listChapterRequests).not.toHaveBeenCalled();
    expect(assistanceService.listRegionalRequests).not.toHaveBeenCalled();
    expect(collaborationsService.listMyPosts).not.toHaveBeenCalled();
    expect(usersService.listPendingUsers).not.toHaveBeenCalled();
  });
  it("builds the chapter officer dashboard in one backend operation", async () => {
    const { service, collaborationsService, assistanceService } =
      createService();

    const result = await service.getDashboard({
      userId: "12",
      chapterId: "1",
      firstName: "Juan",
      lastName: "Dela Cruz",
      email: "juan@example.com",
      role: UserRole.ChapterOfficer,
    });

    expect(result.role).toBe(UserRole.ChapterOfficer);
    expect(assistanceService.listChapterRequests).toHaveBeenCalledWith(1n);
    expect(collaborationsService.listMyPosts).toHaveBeenCalledWith(1n, 12n);
  });

  it("uses compact counts for the regional admin dashboard", async () => {
    const { service } = createService();

    const result = await service.getDashboard({
      userId: "1",
      chapterId: null,
      firstName: "Regional",
      lastName: "Admin",
      email: "admin@example.com",
      role: UserRole.RegionalAdmin,
    });

    expect(result).toEqual(
      expect.objectContaining({
        role: UserRole.RegionalAdmin,
        data: expect.objectContaining({
          activeChapters: 26,
          draftAnnouncements: 2,
          draftEvents: 3,
          pendingAccounts: [{ userId: "9" }],
        }),
      }),
    );
  });

  it.each([
    [
      UserRole.ChapterOfficer,
      [
        "announcements",
        "assistanceRequests",
        "chapter",
        "collaborations",
        "events",
        "ownCollaborations",
      ],
    ],
    [
      UserRole.RegionalOfficer,
      ["announcements", "assistanceRequests", "collaborations", "events"],
    ],
    [
      UserRole.RegionalAdmin,
      [
        "activeChapters",
        "announcements",
        "assistanceRequests",
        "collaborations",
        "draftAnnouncements",
        "draftEvents",
        "events",
        "pendingAccounts",
      ],
    ],
  ])("returns only the data available to %s", async (role, keys) => {
    const { service } = createService();

    const result = await service.getDashboard({
      userId: "12",
      chapterId: role === UserRole.ChapterOfficer ? "1" : null,
      firstName: "Officer",
      lastName: "User",
      email: "officer@example.com",
      role,
    });

    expect(result.role).toBe(role);
    expect(Object.keys(result.data).sort()).toEqual(keys);
  });

  it("preserves full collections for totals instead of truncating dashboard previews", async () => {
    const { service, eventsService, assistanceService, usersService } =
      createService();
    const events = Array.from({ length: 7 }, (_, index) => ({
      eventId: String(index + 1),
    }));
    const requests = Array.from({ length: 8 }, (_, index) => ({
      assistanceRequestId: String(index + 1),
    }));
    const pendingAccounts = Array.from({ length: 9 }, (_, index) => ({
      userId: String(index + 1),
    }));
    eventsService.listPublishedEvents.mockResolvedValue(events);
    assistanceService.listRegionalRequests.mockResolvedValue(requests);
    usersService.listPendingUsers.mockResolvedValue(pendingAccounts);

    const result = await service.getDashboard({
      userId: "12",
      chapterId: null,
      firstName: "Regional",
      lastName: "Admin",
      email: "admin@example.com",
      role: UserRole.RegionalAdmin,
    });

    expect(result.data.events).toHaveLength(7);
    expect(result.data.assistanceRequests).toHaveLength(8);
    expect(result.data).toEqual(expect.objectContaining({ pendingAccounts }));
  });

  it.each([null, "", "invalid", "-1"])(
    "rejects a chapter officer without a valid chapter ID: %s",
    async (chapterId) => {
      const { service } = createService();

      await expect(
        service.getDashboard({
          userId: "12",
          chapterId,
          firstName: "Chapter",
          lastName: "Officer",
          email: "chapter@example.com",
          role: UserRole.ChapterOfficer,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it("does not give an unsupported role an administrative dashboard", async () => {
    const { service } = createService();

    await expect(
      service.getDashboard({
        userId: "12",
        chapterId: null,
        firstName: "Unknown",
        lastName: "User",
        email: "unknown@example.com",
        role: "Visitor",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
