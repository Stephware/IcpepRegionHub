import { describe, expect, it, jest } from "@jest/globals";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import type { PrismaService } from "../prisma/prisma.service.js";
import { CollaborationsService } from "./collaborations.service.js";

const post = {
  collaborationPostId: 50n,
  chapterId: 1n,
  createdByUserId: 10n,
  collaborationType: "Joint Event",
  title: "Partner needed",
  description: "Looking for a partner chapter.",
  eventName: null,
  eventDate: null,
  location: null,
  contactName: null,
  contactEmail: null,
  contactNumber: null,
  status: "Open",
  expiresAt: null,
  createdAt: new Date("2026-10-06T00:00:00.000Z"),
  updatedAt: null,
  chapter: {
    chapterId: 1n,
    schoolName: "Sample University",
    chapterName: "Sample Chapter",
    acronym: "SC",
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
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  return {
    prisma,
    service: new CollaborationsService(
      prisma as unknown as PrismaService,
    ),
  };
}

describe("CollaborationsService admin moderation", () => {
  it("lists posts with response counts", async () => {
    const { prisma, service } = createService();
    prisma.collaborationPost.findMany.mockResolvedValue([
      { ...post, _count: { responses: 3 } },
    ]);

    const result = await service.listAdminPosts();

    expect(result[0]).toEqual(
      expect.objectContaining({
        collaborationPostId: "50",
        responseCount: 3,
      }),
    );
  });

  it("closes a post", async () => {
    const { prisma, service } = createService();
    prisma.collaborationPost.findUnique.mockResolvedValue(post);
    prisma.collaborationPost.update.mockResolvedValue({
      ...post,
      status: "Closed",
    });

    const result = await service.setAdminPostStatus(50n, "Closed");

    expect(result.post.status).toBe("Closed");
  });

  it("does not reopen an expired post", async () => {
    const { prisma, service } = createService();
    prisma.collaborationPost.findUnique.mockResolvedValue({
      ...post,
      status: "Closed",
      expiresAt: new Date("2020-01-01T00:00:00.000Z"),
    });

    await expect(
      service.setAdminPostStatus(50n, "Open"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects deleting a missing post", async () => {
    const { prisma, service } = createService();
    prisma.collaborationPost.findUnique.mockResolvedValue(null);

    await expect(service.deleteAdminPost(99n)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
