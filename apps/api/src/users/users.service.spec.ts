import { describe, expect, it, jest } from "@jest/globals";
import { BadRequestException } from "@nestjs/common";
import { UserRole } from "../common/constants/roles.js";
import type { PrismaService } from "../prisma/prisma.service.js";
import { UsersService } from "./users.service.js";

const chapter = {
  chapterId: 1n,
  schoolName: "Sample University",
  chapterName: "ICpEP.se Sample Chapter",
  acronym: "SAMPLE",
};

const pendingUser = {
  userId: 10n,
  chapterId: 1n,
  firstName: "Juan",
  lastName: "Dela Cruz",
  email: "juan@example.com",
  role: UserRole.ChapterOfficer,
  isApproved: false,
  isActive: true,
  createdAt: new Date("2026-10-06T00:00:00.000Z"),
  updatedAt: null,
  chapter,
};

function createService() {
  const prisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  return {
    prisma,
    service: new UsersService(prisma as unknown as PrismaService),
  };
}

describe("UsersService account administration", () => {
  it("lists only pending active accounts", async () => {
    const { prisma, service } = createService();
    prisma.user.findMany.mockResolvedValue([pendingUser]);

    const result = await service.listPendingUsers();

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isApproved: false,
          isActive: true,
        },
      }),
    );
    expect(result[0]).toEqual(
      expect.objectContaining({
        userId: "10",
        isApproved: false,
        isActive: true,
      }),
    );
  });

  it("approves a pending account", async () => {
    const { prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue({ userId: 10n });
    prisma.user.update.mockResolvedValue({
      ...pendingUser,
      isApproved: true,
    });

    const result = await service.approveUser(10n);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 10n },
        data: {
          isApproved: true,
          isActive: true,
        },
      }),
    );
    expect(result.user.isApproved).toBe(true);
  });

  it("rejects a pending account by deactivating it", async () => {
    const { prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue({
      userId: 10n,
      isApproved: false,
    });
    prisma.user.update.mockResolvedValue({
      ...pendingUser,
      isActive: false,
    });

    const result = await service.rejectUser(10n);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          isApproved: false,
          isActive: false,
        },
      }),
    );
    expect(result.user.isActive).toBe(false);
  });

  it("does not reject an already approved account", async () => {
    const { prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue({
      userId: 10n,
      isApproved: true,
    });

    await expect(service.rejectUser(10n)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
