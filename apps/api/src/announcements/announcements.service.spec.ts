import { describe, expect, it, jest } from "@jest/globals";
import { BadRequestException } from "@nestjs/common";
import type { PrismaService } from "../prisma/prisma.service.js";
import { AnnouncementsService } from "./announcements.service.js";

const creator = {
  userId: 1n,
  firstName: "Regional",
  lastName: "Admin",
};

const announcement = {
  announcementId: 10n,
  title: "Regional Update",
  content: "Important regional announcement.",
  category: "General",
  visibility: "Public",
  coverImageUrl: null,
  externalLink: null,
  isPinned: false,
  isPublished: true,
  publishedAt: new Date("2026-10-06T00:00:00.000Z"),
  expiresAt: null,
  createdByUserId: 1n,
  createdAt: new Date("2026-10-05T00:00:00.000Z"),
  updatedAt: null,
  createdBy: creator,
};

function createService() {
  const prisma = {
    announcement: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  return {
    prisma,
    service: new AnnouncementsService(prisma as unknown as PrismaService),
  };
}

describe("AnnouncementsService", () => {
  it("lists only published public announcements that are not expired", async () => {
    const { prisma, service } = createService();
    prisma.announcement.findMany.mockResolvedValue([announcement]);

    const result = await service.listPublicAnnouncements();

    expect(prisma.announcement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isPublished: true,
          visibility: "Public",
        }),
      }),
    );
    expect(result[0]).toEqual(
      expect.objectContaining({
        announcementId: "10",
        title: "Regional Update",
      }),
    );
    expect(result[0]).not.toHaveProperty("isPublished");
  });

  it("creates announcements as unpublished and unpinned drafts", async () => {
    const { prisma, service } = createService();
    prisma.announcement.create.mockResolvedValue({
      ...announcement,
      isPublished: false,
      publishedAt: null,
    });

    const result = await service.createAnnouncement(
      {
        title: " Regional Update ",
        content: " Important regional announcement. ",
        category: " General ",
        visibility: "Public",
      },
      1n,
    );

    expect(prisma.announcement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Regional Update",
          content: "Important regional announcement.",
          category: "General",
          createdByUserId: 1n,
          isPublished: false,
          isPinned: false,
        }),
      }),
    );
    expect(result.announcement.isPublished).toBe(false);
  });

  it("blocks pinning an unpublished announcement", async () => {
    const { prisma, service } = createService();
    prisma.announcement.findUnique.mockResolvedValue({
      ...announcement,
      isPublished: false,
      publishedAt: null,
    });

    await expect(service.setPinned(10n, true)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.announcement.update).not.toHaveBeenCalled();
  });

  it("unpublishes an announcement and clears its publication date", async () => {
    const { prisma, service } = createService();
    prisma.announcement.findUnique.mockResolvedValue(announcement);
    prisma.announcement.update.mockResolvedValue({
      ...announcement,
      isPublished: false,
      publishedAt: null,
    });

    const result = await service.setPublished(10n, false);

    expect(prisma.announcement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isPublished: false,
          publishedAt: null,
        }),
      }),
    );
    expect(result.announcement.isPublished).toBe(false);
  });

  it("deletes an existing announcement", async () => {
    const { prisma, service } = createService();
    prisma.announcement.findUnique.mockResolvedValue({
      announcementId: 10n,
    });
    prisma.announcement.delete.mockResolvedValue(announcement);

    const result = await service.deleteAnnouncement(10n);

    expect(prisma.announcement.delete).toHaveBeenCalledWith({
      where: { announcementId: 10n },
    });
    expect(result.message).toBe("Announcement deleted successfully.");
  });
});
