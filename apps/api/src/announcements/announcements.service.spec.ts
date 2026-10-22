import { describe, expect, it, jest } from "@jest/globals";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import type { PrismaService } from "../prisma/prisma.service.js";
import { AnnouncementsService } from "./announcements.service.js";

const admin = { userId: "1", role: "RegionalAdmin" };

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
    contentAction: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(async (actions: Promise<unknown>[]) =>
      Promise.all(actions),
    ),
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
  const officer = { userId: "2", role: "RegionalOfficer" };

  it("limits regional officers' management list and detail to their own content", async () => {
    const { prisma, service } = createService();
    prisma.announcement.findMany.mockResolvedValue([]);
    await service.listAdminAnnouncements(officer);
    expect(prisma.announcement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { createdByUserId: 2n } }),
    );
    prisma.announcement.findUnique.mockResolvedValue(announcement);
    await expect(
      service.getAdminAnnouncement(10n, officer),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows admins to moderate another author's content", async () => {
    const { prisma, service } = createService();
    prisma.announcement.findUnique.mockResolvedValue({
      ...announcement,
      createdByUserId: 2n,
    });
    prisma.announcement.update.mockResolvedValue({
      ...announcement,
      isPublished: false,
    });
    expect(
      (await service.setPublished(10n, false, admin)).announcement.isPublished,
    ).toBe(false);
    expect(prisma.contentAction.create).toHaveBeenCalledWith({
      data: {
        resource: "Announcement",
        resourceId: 10n,
        action: "Unpublished",
        actorUserId: 1n,
      },
    });
  });

  it("does not let regional officers edit, publish, pin or delete another author's announcement", async () => {
    const { prisma, service } = createService();
    prisma.announcement.findUnique.mockResolvedValue(announcement);
    prisma.announcement.update.mockResolvedValue(announcement);
    prisma.announcement.delete.mockResolvedValue(announcement);
    for (const operation of [
      () => service.updateAnnouncement(10n, { title: "Forged edit" }, officer),
      () => service.setPublished(10n, true, officer),
      () => service.setPinned(10n, true, officer),
      () => service.deleteAnnouncement(10n, officer),
    ]) {
      await expect(operation()).rejects.toBeInstanceOf(ForbiddenException);
    }
    expect(prisma.announcement.update).not.toHaveBeenCalled();
    expect(prisma.announcement.delete).not.toHaveBeenCalled();
  });

  it("records an authorized publication and its actor in the transaction", async () => {
    const { prisma, service } = createService();
    prisma.announcement.findUnique.mockResolvedValue({
      ...announcement,
      createdByUserId: 2n,
    });
    prisma.announcement.update.mockResolvedValue(announcement);
    await service.setPublished(10n, true, officer);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.contentAction.create).toHaveBeenCalledWith({
      data: {
        resource: "Announcement",
        resourceId: 10n,
        action: "Published",
        actorUserId: 2n,
      },
    });
  });
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

    await expect(service.setPinned(10n, true, admin)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.announcement.update).not.toHaveBeenCalled();
  });

  it("unpublishes and unpins an announcement so drafts cannot stay pinned", async () => {
    const { prisma, service } = createService();
    prisma.announcement.findUnique.mockResolvedValue({
      ...announcement,
      isPinned: true,
    });
    prisma.announcement.update.mockResolvedValue({
      ...announcement,
      isPublished: false,
      publishedAt: null,
    });

    const result = await service.setPublished(10n, false, admin);

    expect(prisma.announcement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isPublished: false,
          isPinned: false,
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

    const result = await service.deleteAnnouncement(10n, admin);

    expect(prisma.announcement.delete).toHaveBeenCalledWith({
      where: { announcementId: 10n },
    });
    expect(result.message).toBe("Announcement deleted successfully.");
  });

  it("edits content and member visibility", async () => {
    const { prisma, service } = createService();
    prisma.announcement.findUnique.mockResolvedValue(announcement);
    prisma.announcement.update.mockImplementation(async ({ data }) => ({
      ...announcement,
      ...data,
    }));
    const result = await service.updateAnnouncement(
      10n,
      {
        title: " Updated ",
        content: " New content ",
        visibility: "MembersOnly",
      },
      admin,
    );
    expect(result.announcement).toMatchObject({
      title: "Updated",
      content: "New content",
      visibility: "MembersOnly",
    });
  });

  it.each([true, false])(
    "sets a published announcement pin to %s",
    async (isPinned) => {
      const { prisma, service } = createService();
      prisma.announcement.findUnique.mockResolvedValue(announcement);
      prisma.announcement.update.mockImplementation(async ({ data }) => ({
        ...announcement,
        ...data,
      }));
      expect(
        (await service.setPinned(10n, isPinned, admin)).announcement.isPinned,
      ).toBe(isPinned);
    },
  );

  it("publishes a draft with its first publication date", async () => {
    const { prisma, service } = createService();
    prisma.announcement.findUnique.mockResolvedValue({
      ...announcement,
      isPublished: false,
      publishedAt: null,
    });
    prisma.announcement.update.mockImplementation(async ({ data }) => ({
      ...announcement,
      ...data,
    }));
    const result = await service.setPublished(10n, true, admin);
    expect(result.announcement.isPublished).toBe(true);
    expect(result.announcement.publishedAt).toBeInstanceOf(Date);
  });

  it("does not publish an expired announcement", async () => {
    const { prisma, service } = createService();
    prisma.announcement.findUnique.mockResolvedValue({
      ...announcement,
      expiresAt: new Date("2000-01-01"),
    });
    await expect(service.setPublished(10n, true, admin)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.announcement.update).not.toHaveBeenCalled();
  });
});
