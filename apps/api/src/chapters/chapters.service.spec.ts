import { describe, expect, it, jest } from "@jest/globals";
import { BadRequestException, ConflictException } from "@nestjs/common";
import type { PrismaService } from "../prisma/prisma.service.js";
import { ChaptersService } from "./chapters.service.js";

const chapter = {
  chapterId: 1n,
  schoolName: "Sample University",
  chapterName: "ICpEP.se Sample Chapter",
  acronym: "SAMPLE",
  officialEmail: "sample@example.com",
  contactNumber: null,
  address: "Pampanga",
  logoUrl: null,
  facebookUrl: null,
  status: "Active",
  createdAt: new Date("2026-10-06T00:00:00.000Z"),
  updatedAt: null,
};

function createService() {
  const prisma = {
    chapter: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    chapterOfficer: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  return {
    prisma,
    service: new ChaptersService(prisma as unknown as PrismaService),
  };
}

describe("ChaptersService", () => {
  it("lists only active chapters for the public directory", async () => {
    const { prisma, service } = createService();
    prisma.chapter.findMany.mockResolvedValue([chapter]);

    const result = await service.listActiveChapters();

    expect(prisma.chapter.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ schoolName: "asc" }, { chapterName: "asc" }],
        where: { status: "Active" },
      }),
    );
    expect(result[0]).toEqual(
      expect.objectContaining({
        chapterId: "1",
        schoolName: "Sample University",
      }),
    );
    expect(result[0]).not.toHaveProperty("status");
  });

  it("prevents duplicate school or chapter names", async () => {
    const { prisma, service } = createService();
    prisma.chapter.findFirst.mockResolvedValue({ chapterId: 2n });

    await expect(
      service.createChapter({
        schoolName: "Sample University",
        chapterName: "ICpEP.se Sample Chapter",
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.chapter.create).not.toHaveBeenCalled();
  });

  it("creates an active chapter", async () => {
    const { prisma, service } = createService();
    prisma.chapter.findFirst.mockResolvedValue(null);
    prisma.chapter.create.mockResolvedValue(chapter);

    const result = await service.createChapter({
      schoolName: " Sample University ",
      chapterName: " ICpEP.se Sample Chapter ",
      acronym: " SAMPLE ",
    });

    expect(prisma.chapter.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolName: "Sample University",
          chapterName: "ICpEP.se Sample Chapter",
          acronym: "SAMPLE",
          status: "Active",
        }),
      }),
    );
    expect(result.chapter.status).toBe("Active");
  });

  it("blocks linking an officer to a user from another chapter", async () => {
    const { prisma, service } = createService();
    prisma.chapter.findUnique.mockResolvedValue({ chapterId: 1n });
    prisma.user.findUnique.mockResolvedValue({
      userId: 20n,
      chapterId: 2n,
    });

    await expect(
      service.createOfficer(1n, {
        userId: "20",
        fullName: "Juan Dela Cruz",
        position: "President",
        academicYear: "2026-2027",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.chapterOfficer.create).not.toHaveBeenCalled();
  });

  it("returns only current officers in the public directory", async () => {
    const { prisma, service } = createService();
    prisma.chapter.findFirst.mockResolvedValue(chapter);
    prisma.chapterOfficer.findMany.mockResolvedValue([
      {
        chapterOfficerId: 5n,
        chapterId: 1n,
        userId: null,
        fullName: "Juan Dela Cruz",
        position: "President",
        email: "juan@example.com",
        contactNumber: null,
        academicYear: "2026-2027",
        isCurrent: true,
        createdAt: new Date("2026-10-06T00:00:00.000Z"),
        updatedAt: null,
      },
    ]);

    const result = await service.listCurrentOfficers(1n);

    expect(prisma.chapterOfficer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          chapterId: 1n,
          isCurrent: true,
        },
      }),
    );
    expect(result[0]).not.toHaveProperty("isCurrent");
  });
});
