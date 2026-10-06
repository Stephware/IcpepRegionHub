import { describe, expect, it, jest } from "@jest/globals";
import {
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import type { PrismaService } from "../prisma/prisma.service.js";
import { CollaborationsService } from "./collaborations.service.js";

const response = {
  collaborationResponseId: 70n,
  collaborationPostId: 50n,
  chapterId: 2n,
  userId: 20n,
  message: "Our chapter is interested.",
  status: "Pending",
  createdAt: new Date("2026-10-06T00:00:00.000Z"),
  updatedAt: null,
  chapter: {
    chapterId: 2n,
    schoolName: "Partner University",
    chapterName: "ICpEP.se Partner Chapter",
    acronym: "PARTNER",
  },
  user: {
    userId: 20n,
    firstName: "Maria",
    lastName: "Santos",
    email: "maria@example.com",
  },
};

function createService() {
  const prisma = {
    collaborationPost: {
      findUnique: jest.fn(),
    },
    collaborationResponse: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
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

describe("CollaborationsService responses", () => {
  it("prevents a chapter from responding to its own post", async () => {
    const { prisma, service } = createService();
    prisma.chapter.findUnique.mockResolvedValue({
      chapterId: 1n,
      status: "Active",
    });
    prisma.collaborationPost.findUnique.mockResolvedValue({
      collaborationPostId: 50n,
      chapterId: 1n,
      status: "Open",
      expiresAt: null,
    });

    await expect(
      service.createResponse(
        50n,
        { message: "Interested" },
        1n,
        10n,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.collaborationResponse.create).not.toHaveBeenCalled();
  });

  it("prevents duplicate chapter responses", async () => {
    const { prisma, service } = createService();
    prisma.chapter.findUnique.mockResolvedValue({
      chapterId: 2n,
      status: "Active",
    });
    prisma.collaborationPost.findUnique.mockResolvedValue({
      collaborationPostId: 50n,
      chapterId: 1n,
      status: "Open",
      expiresAt: null,
    });
    prisma.collaborationResponse.findFirst.mockResolvedValue({
      collaborationResponseId: 70n,
    });

    await expect(
      service.createResponse(
        50n,
        { message: "Interested" },
        2n,
        20n,
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.collaborationResponse.create).not.toHaveBeenCalled();
  });

  it("creates a pending collaboration response", async () => {
    const { prisma, service } = createService();
    prisma.chapter.findUnique.mockResolvedValue({
      chapterId: 2n,
      status: "Active",
    });
    prisma.collaborationPost.findUnique.mockResolvedValue({
      collaborationPostId: 50n,
      chapterId: 1n,
      status: "Open",
      expiresAt: null,
    });
    prisma.collaborationResponse.findFirst.mockResolvedValue(null);
    prisma.collaborationResponse.create.mockResolvedValue(response);

    const result = await service.createResponse(
      50n,
      { message: " Our chapter is interested. " },
      2n,
      20n,
    );

    expect(prisma.collaborationResponse.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          collaborationPostId: 50n,
          chapterId: 2n,
          userId: 20n,
          message: "Our chapter is interested.",
          status: "Pending",
        }),
      }),
    );
    expect(result.response.status).toBe("Pending");
  });

  it("only allows pending responses to be withdrawn", async () => {
    const { prisma, service } = createService();
    prisma.collaborationResponse.findFirst.mockResolvedValue({
      collaborationResponseId: 70n,
      status: "Accepted",
    });

    await expect(
      service.withdrawResponse(50n, 2n),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.collaborationResponse.delete).not.toHaveBeenCalled();
  });

  it("allows the post creator to accept a pending response", async () => {
    const { prisma, service } = createService();
    prisma.collaborationPost.findUnique.mockResolvedValue({
      collaborationPostId: 50n,
      chapterId: 1n,
      createdByUserId: 10n,
      status: "Open",
    });
    prisma.collaborationResponse.findFirst.mockResolvedValue(response);
    prisma.collaborationResponse.update.mockResolvedValue({
      ...response,
      status: "Accepted",
      updatedAt: new Date("2026-10-06T01:00:00.000Z"),
    });

    const result = await service.updateResponseStatus(
      50n,
      70n,
      { status: "Accepted" },
      1n,
      10n,
    );

    expect(prisma.collaborationResponse.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "Accepted",
        }),
      }),
    );
    expect(result.response.status).toBe("Accepted");
  });
});
