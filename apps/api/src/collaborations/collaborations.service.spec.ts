import { describe, expect, it, jest } from "@jest/globals";
import {
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import type { PrismaService } from "../prisma/prisma.service.js";
import { CollaborationsService } from "./collaborations.service.js";

const post = {
  collaborationPostId: 50n,
  chapterId: 1n,
  createdByUserId: 10n,
  collaborationType: "Joint Event",
  title: "Looking for partner chapter",
  description: "We are looking for a chapter partner.",
  eventName: "Regional Tech Summit",
  eventDate: new Date("2099-11-20T01:00:00.000Z"),
  location: "Pampanga",
  contactName: "Juan Dela Cruz",
  contactEmail: "juan@example.com",
  contactNumber: null,
  status: "Open",
  expiresAt: new Date("2099-11-10T00:00:00.000Z"),
  createdAt: new Date("2026-10-06T00:00:00.000Z"),
  updatedAt: null,
  chapter: {
    chapterId: 1n,
    schoolName: "Sample University",
    chapterName: "ICpEP.se Sample Chapter",
    acronym: "SAMPLE",
  },
  createdBy: {
    userId: 10n,
    firstName: "Juan",
    lastName: "Dela Cruz",
  },
};

function createService() {
  const prisma = {
    collaborationPost: {
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
    service: new CollaborationsService(
      prisma as unknown as PrismaService,
    ),
  };
}

describe("CollaborationsService", () => {
  it("lists only open, unexpired collaboration posts", async () => {
    const { prisma, service } = createService();
    prisma.collaborationPost.findMany.mockResolvedValue([post]);

    const result = await service.listOpenPosts({ type: "Joint Event" });

    expect(prisma.collaborationPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "Open",
          collaborationType: {
            equals: "Joint Event",
            mode: "insensitive",
          },
        }),
      }),
    );
    expect(result[0]).toEqual(
      expect.objectContaining({
        collaborationPostId: "50",
        status: "Open",
      }),
    );
  });

  it("creates a post for an active chapter", async () => {
    const { prisma, service } = createService();
    prisma.chapter.findUnique.mockResolvedValue({
      chapterId: 1n,
      status: "Active",
    });
    prisma.collaborationPost.create.mockResolvedValue(post);

    const result = await service.createPost(
      {
        collaborationType: " Joint Event ",
        title: " Looking for partner chapter ",
        description: " We are looking for a chapter partner. ",
        eventName: "Regional Tech Summit",
        eventDate: "2099-11-20T01:00:00.000Z",
        expiresAt: "2099-11-10T00:00:00.000Z",
      },
      1n,
      10n,
    );

    expect(prisma.collaborationPost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          chapterId: 1n,
          createdByUserId: 10n,
          collaborationType: "Joint Event",
          title: "Looking for partner chapter",
          status: "Open",
        }),
      }),
    );
    expect(result.post.status).toBe("Open");
  });

  it("blocks creating a collaboration post for an inactive chapter", async () => {
    const { prisma, service } = createService();
    prisma.chapter.findUnique.mockResolvedValue({
      chapterId: 1n,
      status: "Inactive",
    });

    await expect(
      service.createPost(
        {
          collaborationType: "Resource Sharing",
          title: "Need equipment",
          description: "Looking for shared equipment.",
        },
        1n,
        10n,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.collaborationPost.create).not.toHaveBeenCalled();
  });

  it("prevents another officer from editing a post they did not create", async () => {
    const { prisma, service } = createService();
    prisma.collaborationPost.findUnique.mockResolvedValue({
      collaborationPostId: 50n,
      chapterId: 1n,
      createdByUserId: 99n,
      status: "Open",
    });

    await expect(
      service.updatePost(
        50n,
        { title: "Changed title" },
        1n,
        10n,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.collaborationPost.update).not.toHaveBeenCalled();
  });

  it("closes an owned collaboration post", async () => {
    const { prisma, service } = createService();
    prisma.collaborationPost.findUnique.mockResolvedValue({
      collaborationPostId: 50n,
      chapterId: 1n,
      createdByUserId: 10n,
      status: "Open",
    });
    prisma.collaborationPost.update.mockResolvedValue({
      ...post,
      status: "Closed",
    });

    const result = await service.closePost(50n, 1n, 10n);

    expect(prisma.collaborationPost.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "Closed",
        }),
      }),
    );
    expect(result.post.status).toBe("Closed");
  });
});
