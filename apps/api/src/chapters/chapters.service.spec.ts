import { describe, expect, it, jest } from "@jest/globals";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { validateSync } from "class-validator";
import { CreateChapterDto } from "./dto/create-chapter.dto.js";
import { UpdateChapterDto } from "./dto/update-chapter.dto.js";
import { CreateChapterOfficerDto } from "./dto/create-chapter-officer.dto.js";
import { UpdateChapterOfficerDto } from "./dto/update-chapter-officer.dto.js";
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
        photoUrl: "/assets/people/juan.jpg",
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
    expect(result[0]).toHaveProperty("photoUrl", "/assets/people/juan.jpg");
  });

  it("hides inactive chapter details and officers", async () => {
    const { prisma, service } = createService();
    prisma.chapter.findFirst.mockResolvedValue(null);

    await expect(service.getPublicChapter(1n)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.listCurrentOfficers(1n)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.chapter.findFirst).toHaveBeenCalledWith({
      where: { chapterId: 1n, status: "Active" },
    });
    expect(prisma.chapterOfficer.findMany).not.toHaveBeenCalled();
  });

  it.each([
    [" https://example.com/photo.jpg ", "https://example.com/photo.jpg"],
    ["http://example.com/photo.jpg", "http://example.com/photo.jpg"],
    [
      "/assets/people/chapter/officer.webp",
      "/assets/people/chapter/officer.webp",
    ],
    [" ", null],
    [null, null],
  ])(
    "saves and returns an officer photo source %s",
    async (photoUrl, expected) => {
      const { prisma, service } = createService();
      prisma.chapter.findUnique.mockResolvedValue({ chapterId: 1n });
      prisma.chapterOfficer.create.mockImplementation(
        async ({ data }: { data: Record<string, unknown> }) => ({
          ...data,
          chapterOfficerId: 5n,
          createdAt: new Date(),
          updatedAt: null,
        }),
      );

      const result = await service.createOfficer(1n, {
        fullName: "Juan Dela Cruz",
        position: "President",
        academicYear: "2026-2027",
        photoUrl,
      });

      expect(result.officer.photoUrl).toBe(expected);
    },
  );

  it.each([
    "javascript:alert(1)",
    "data:image/png;base64,abc",
    "//example.com/photo.jpg",
    "/assets/branding/logo.png",
    "/assets/people/../private.jpg",
    "/assets/people/%2e%2e/private.jpg",
    "/assets/people/officer.svg",
    "https://",
    "/assets/people/",
  ])(
    "rejects unsafe or unsupported officer photo source %s",
    async (photoUrl) => {
      const { prisma, service } = createService();
      prisma.chapter.findUnique.mockResolvedValue({ chapterId: 1n });
      prisma.chapterOfficer.create.mockResolvedValue({
        chapterOfficerId: 5n,
        chapterId: 1n,
        userId: null,
        fullName: "Juan Dela Cruz",
        position: "President",
        academicYear: "2026-2027",
        email: null,
        contactNumber: null,
        photoUrl,
        isCurrent: true,
        createdAt: new Date(),
        updatedAt: null,
      });
      await expect(
        service.createOfficer(1n, {
          fullName: "Juan Dela Cruz",
          position: "President",
          academicYear: "2026-2027",
          photoUrl,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.chapterOfficer.create).not.toHaveBeenCalled();
    },
  );

  it("clears a photo with an empty update and preserves it when omitted", async () => {
    const { prisma, service } = createService();
    prisma.chapterOfficer.findFirst.mockResolvedValue({ chapterOfficerId: 5n });
    prisma.chapterOfficer.update.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        ...data,
        chapterOfficerId: 5n,
        chapterId: 1n,
        userId: null,
      }),
    );
    await service.updateOfficer(1n, 5n, { photoUrl: "" });
    expect(prisma.chapterOfficer.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ photoUrl: null }),
      }),
    );
    await service.updateOfficer(1n, 5n, { position: "Vice President" });
    expect(prisma.chapterOfficer.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ photoUrl: undefined }),
      }),
    );
  });
});

describe("officer photo DTOs", () => {
  it.each([CreateChapterOfficerDto, UpdateChapterOfficerDto])(
    "validates photo types and database length limits in %p",
    (Dto) => {
      for (const photoUrl of [42, `https://example.com/${"a".repeat(500)}`]) {
        const dto = Object.assign(new Dto(), {
          fullName: "Juan Dela Cruz",
          position: "President",
          academicYear: "2026-2027",
          photoUrl,
        });
        expect(validateSync(dto).map((error) => error.property)).toContain(
          "photoUrl",
        );
      }
    },
  );
});

describe("optional chapter form email", () => {
  it.each([
    [CreateChapterDto, "officialEmail"],
    [UpdateChapterDto, "officialEmail"],
    [CreateChapterOfficerDto, "email"],
    [UpdateChapterOfficerDto, "email"],
  ] as const)(
    "allows the admin form to leave optional email blank in %p",
    (Dto, field) => {
      const dto = Object.assign(new Dto(), {
        schoolName: "Sample University",
        chapterName: "Sample University",
        fullName: "Juan Dela Cruz",
        position: "President",
        academicYear: "2026-2027",
        [field]: "",
      });
      expect(validateSync(dto).map((error) => error.property)).not.toContain(
        field,
      );
      Object.assign(dto, { [field]: "invalid" });
      expect(validateSync(dto).map((error) => error.property)).toContain(field);
    },
  );
});
