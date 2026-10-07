import { describe, expect, it, jest } from "@jest/globals";
import type { PrismaService } from "../prisma/prisma.service.js";
import { AdminOverviewService } from "./admin-overview.service.js";

function createService() {
  const prisma = {
    user: { count: jest.fn() },
    chapter: { count: jest.fn() },
    announcement: { count: jest.fn() },
    event: { count: jest.fn() },
    assistanceRequest: { count: jest.fn() },
    collaborationPost: { count: jest.fn() },
  };

  return {
    prisma,
    service: new AdminOverviewService(prisma as unknown as PrismaService),
  };
}

describe("AdminOverviewService", () => {
  it("returns compact metrics without loading full admin collections", async () => {
    const { prisma, service } = createService();

    prisma.user.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(8);
    prisma.chapter.count.mockResolvedValue(26);
    prisma.announcement.count.mockResolvedValue(3);
    prisma.event.count.mockResolvedValue(4);
    prisma.assistanceRequest.count.mockResolvedValue(5);
    prisma.collaborationPost.count.mockResolvedValue(6);

    await expect(service.getMetrics()).resolves.toEqual({
      pendingAccounts: 2,
      activeUsers: 8,
      activeChapters: 26,
      draftAnnouncements: 3,
      draftEvents: 4,
      openAssistance: 5,
      openCollaborations: 6,
    });

    expect(prisma.assistanceRequest.count).toHaveBeenCalledWith({
      where: {
        status: {
          notIn: ["Resolved", "Closed"],
        },
      },
    });
    expect(prisma.collaborationPost.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "Open",
        }),
      }),
    );
  });
});
