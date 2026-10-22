import { describe, expect, it, jest } from "@jest/globals";
import type { PrismaService } from "../prisma/prisma.service.js";
import { UsersService } from "./users.service.js";

describe("Account search and pagination", () => {
  it("searches the full dataset and pages only after filtering", async () => {
    const prisma = { user: { count: jest.fn().mockResolvedValue(21 as never), findMany: jest.fn().mockResolvedValue([] as never) } };
    const service = new UsersService(prisma as unknown as PrismaService);
    const result = await service.listUsersPaged({ search: "Juan AUF", filter: "Pending", page: 2, pageSize: 10 });
    expect(result).toEqual({ items: [], total: 21, page: 2, pageSize: 10, pageCount: 3 });
    expect(prisma.user.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ isApproved: false, isActive: true, AND: expect.any(Array) }),
    }));
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 10, take: 10, orderBy: expect.any(Array),
    }));
    const where = (prisma.user.count.mock.calls[0] as unknown as [{ where: { AND: unknown[] } }])[0].where;
    expect(where.AND).toHaveLength(2);
  });

  it("clamps empty results instead of displaying an invalid page", async () => {
    const prisma = { user: { count: jest.fn().mockResolvedValue(0 as never), findMany: jest.fn().mockResolvedValue([] as never) } };
    const service = new UsersService(prisma as unknown as PrismaService);
    expect(await service.listUsersPaged({ page: 10 })).toMatchObject({ page: 1, pageCount: 1, total: 0, items: [] });
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }));
  });
});
