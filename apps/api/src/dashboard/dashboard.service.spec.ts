import { describe, expect, it, jest } from "@jest/globals";
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
  it("builds the chapter officer dashboard in one backend operation", async () => {
    const { service, collaborationsService, assistanceService } = createService();

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
});
