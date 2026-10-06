import { describe, expect, it, jest } from "@jest/globals";
import { BadRequestException, NotFoundException } from "@nestjs/common";
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
  priority: "Normal",
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
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    chapter: {
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

describe("AssistanceRequestsService", () => {
  it("lists only requests from the signed-in officer's chapter", async () => {
    const { prisma, service } = createService();
    prisma.assistanceRequest.findMany.mockResolvedValue([request]);

    const result = await service.listChapterRequests(1n);

    expect(prisma.assistanceRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { chapterId: 1n },
      }),
    );
    expect(result[0]).toEqual(
      expect.objectContaining({
        assistanceRequestId: "40",
        ticketCode: "R3-20261006-ABCDEF12",
      }),
    );
    expect(result[0]).not.toHaveProperty("description");
  });

  it("creates a submitted request with a generated unique ticket", async () => {
    const { prisma, service } = createService();
    prisma.chapter.findUnique.mockResolvedValue({
      chapterId: 1n,
      status: "Active",
    });
    prisma.assistanceRequest.findUnique.mockResolvedValue(null);
    prisma.assistanceRequest.create.mockImplementation(
      async ({ data }: { data: { ticketCode: string } }) => ({
        ...request,
        ticketCode: data.ticketCode,
      }),
    );

    const result = await service.createRequest(
      {
        category: "General",
        subject: " Need regional assistance ",
        description: " Please help our chapter with this concern. ",
        priority: "Normal",
      },
      1n,
      10n,
    );

    expect(result.request.ticketCode).toMatch(
      /^R3-\d{8}-[A-F0-9]{8}$/,
    );
    expect(prisma.assistanceRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          chapterId: 1n,
          submittedByUserId: 10n,
          subject: "Need regional assistance",
          description: "Please help our chapter with this concern.",
          priority: "Normal",
          status: "Submitted",
        }),
      }),
    );
  });

  it("blocks submissions for an inactive chapter", async () => {
    const { prisma, service } = createService();
    prisma.chapter.findUnique.mockResolvedValue({
      chapterId: 1n,
      status: "Inactive",
    });

    await expect(
      service.createRequest(
        {
          category: "General",
          subject: "Concern",
          description: "Description",
          priority: "Normal",
        },
        1n,
        10n,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.assistanceRequest.create).not.toHaveBeenCalled();
  });

  it("hides internal notes when a chapter officer opens a ticket", async () => {
    const { prisma, service } = createService();
    prisma.assistanceRequest.findFirst.mockResolvedValue({
      ...request,
      updates: [],
    });

    await service.getChapterRequest(40n, 1n);

    expect(prisma.assistanceRequest.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          assistanceRequestId: 40n,
          chapterId: 1n,
        },
        include: expect.objectContaining({
          updates: expect.objectContaining({
            where: {
              isInternalNote: false,
            },
          }),
        }),
      }),
    );
  });

  it("does not expose a ticket from another chapter", async () => {
    const { prisma, service } = createService();
    prisma.assistanceRequest.findFirst.mockResolvedValue(null);

    await expect(
      service.getChapterRequest(40n, 2n),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
