import { describe, expect, it, jest } from "@jest/globals";
import type { PrismaService } from "../prisma/prisma.service.js";
import { AssistanceRequestsService } from "./assistance-requests.service.js";

describe("Regional assistance paging", () => {
  it("combines status, institution and search before pagination", async () => {
    const prisma = { assistanceRequest: { count: jest.fn().mockResolvedValue(17 as never), findMany: jest.fn().mockResolvedValue([] as never) } };
    const service = new AssistanceRequestsService(prisma as unknown as PrismaService);
    const result = await service.listRegionalRequestsPaged({
      status: "Under Review", chapterId: "2", search: "regional help", page: 2, pageSize: 6,
    });
    expect(result).toMatchObject({ page: 2, pageCount: 3, total: 17, items: [] });
    expect(prisma.assistanceRequest.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: "Under Review", chapterId: 2n, AND: expect.any(Array) }),
    }));
    expect(prisma.assistanceRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 6, take: 6 }));
  });

  it("returns complete regional counts and available chapters without loading every request", async () => {
    const prisma = {
      assistanceRequest: { groupBy: jest.fn().mockResolvedValue([
        { status: "Submitted", _count: { _all: 3 } },
        { status: "In Progress", _count: { _all: 2 } },
        { status: "Resolved", _count: { _all: 1 } },
      ] as never) },
      chapter: { findMany: jest.fn().mockResolvedValue([{
        chapterId: 5n, schoolName: "University", chapterName: "Chapter", acronym: "U",
      }] as never) },
    };
    const service = new AssistanceRequestsService(prisma as unknown as PrismaService);
    expect(await service.getRegionalRequestSummary()).toEqual({
      counts: { open: 5, submitted: 3, inProgress: 2, resolved: 1 },
      chapters: [{ chapterId: "5", schoolName: "University", chapterName: "Chapter", acronym: "U" }],
    });
  });
});
