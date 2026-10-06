import { describe, expect, it, jest } from "@jest/globals";
import { BadRequestException } from "@nestjs/common";
import { UserRole } from "../common/constants/roles.js";
import type { PrismaService } from "../prisma/prisma.service.js";
import { AssistanceRequestsService } from "./assistance-requests.service.js";

const request = {
  assistanceRequestId: 40n,
  ticketCode: "R3-20261006-ABCDEF12",
  chapterId: 1n,
  submittedByUserId: 10n,
  category: "General",
  subject: "Need regional assistance",
  description: "Please help our chapter with this concern.",
  priority: "High",
  status: "Submitted",
  assignedToUserId: null,
  submittedAt: new Date("2026-10-06T00:00:00.000Z"),
  resolvedAt: null,
  updatedAt: null,
  chapter: {
    chapterId: 1n,
    schoolName: "Sample University",
    chapterName: "ICpEP.se Sample Chapter",
    acronym: "SAMPLE",
  },
  submittedBy: {
    userId: 10n,
    firstName: "Juan",
    lastName: "Dela Cruz",
    email: "juan@example.com",
  },
  assignedTo: null,
};

function createService() {
  const prisma = {
    assistanceRequest: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    assistanceRequestUpdate: {
      create: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  return {
    prisma,
    service: new AssistanceRequestsService(
      prisma as unknown as PrismaService,
    ),
  };
}

describe("AssistanceRequestsService regional management", () => {
  it("applies regional request filters", async () => {
    const { prisma, service } = createService();
    prisma.assistanceRequest.findMany.mockResolvedValue([request]);

    const result = await service.listRegionalRequests({
      status: "Submitted",
      priority: "High",
      chapterId: "1",
    });

    expect(prisma.assistanceRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "Submitted",
          priority: "High",
          chapterId: 1n,
        },
      }),
    );
    expect(result[0]?.ticketCode).toBe("R3-20261006-ABCDEF12");
  });

  it("only lists approved active regional users as assignees", async () => {
    const { prisma, service } = createService();
    prisma.user.findMany.mockResolvedValue([
      {
        userId: 2n,
        firstName: "Regional",
        lastName: "Officer",
        email: "officer@example.com",
        role: UserRole.RegionalOfficer,
      },
    ]);

    const result = await service.listAssignableRegionalUsers();

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          role: {
            in: [UserRole.RegionalAdmin, UserRole.RegionalOfficer],
          },
          isApproved: true,
          isActive: true,
        },
      }),
    );
    expect(result[0]?.userId).toBe("2");
  });

  it("rejects assignment to an ineligible user", async () => {
    const { prisma, service } = createService();
    prisma.assistanceRequest.findUnique.mockResolvedValue({
      assistanceRequestId: 40n,
    });
    prisma.user.findUnique.mockResolvedValue({
      userId: 10n,
      role: UserRole.ChapterOfficer,
      isApproved: true,
      isActive: true,
    });

    await expect(
      service.assignRequest(40n, { userId: "10" }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.assistanceRequest.update).not.toHaveBeenCalled();
  });

  it("creates internal notes without changing request status", async () => {
    const { prisma, service } = createService();
    prisma.assistanceRequest.findUnique.mockResolvedValue({
      assistanceRequestId: 40n,
    });
    prisma.assistanceRequestUpdate.create.mockResolvedValue({
      updateId: 7n,
      message: "Internal coordination note.",
      newStatus: null,
      isInternalNote: true,
      createdAt: new Date("2026-10-06T01:00:00.000Z"),
      user: {
        userId: 2n,
        firstName: "Regional",
        lastName: "Officer",
      },
    });
    prisma.assistanceRequest.update.mockResolvedValue(request);

    const result = await service.addUpdate(
      40n,
      {
        message: "Internal coordination note.",
        isInternalNote: true,
      },
      2n,
    );

    expect(prisma.assistanceRequestUpdate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isInternalNote: true,
          userId: 2n,
        }),
      }),
    );
    expect(result.update.isInternalNote).toBe(true);
  });

  it("blocks an invalid direct status transition", async () => {
    const { prisma, service } = createService();
    prisma.assistanceRequest.findUnique.mockResolvedValue({
      assistanceRequestId: 40n,
      status: "Submitted",
      resolvedAt: null,
    });

    await expect(
      service.updateStatus(
        40n,
        {
          status: "Closed",
        },
        2n,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
