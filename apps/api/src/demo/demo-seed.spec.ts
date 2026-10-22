import { describe, expect, it, jest } from "@jest/globals";
import { randomBytes } from "node:crypto";
import { AuthService } from "../auth/auth.service.js";
import {
  getDemoConfig,
  buildDemoRecords,
  hashDemoPassword,
  preserveDemoRecord,
  seedDemoDatabase,
  DEMO_DATABASE_MARKER,
} from "../../prisma/demo-seed.js";

const password = randomBytes(24).toString("base64url");
const safeEnv = {
  NODE_ENV: "development",
  DEMO_SEED_ENABLED: "true",
  DEMO_DATABASE_NAME: "icpep_region3_disposable_demo",
  DATABASE_URL:
    "postgresql://demo@localhost:5432/icpep_region3_disposable_demo?schema=public",
  DEMO_SEED_PASSWORD: password,
};

describe("demo seed safety", () => {
  it("does not include a malformed database URL in the error object", () => {
    let failure: unknown;
    try {
      getDemoConfig({ ...safeEnv, DATABASE_URL: "invalid-database-url" });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    expect(failure).not.toHaveProperty("input");
  });
  it("accepts an explicitly opted-in local disposable database", () => {
    expect(getDemoConfig(safeEnv).databaseName).toBe(
      "icpep_region3_disposable_demo",
    );
  });

  it.each([
    { NODE_ENV: "production" },
    { NODE_ENV: undefined },
    { DEMO_SEED_ENABLED: "false" },
    { DEMO_SEED_ENABLED: undefined },
    { DEMO_DATABASE_NAME: undefined },
    { DEMO_DATABASE_NAME: "IcpepRegionHub" },
    {
      DATABASE_URL:
        "postgresql://demo@remote.example/icpep_region3_disposable_demo",
    },
    { DATABASE_URL: "postgresql://demo@localhost/IcpepRegionHub" },
    {
      DATABASE_URL:
        "postgresql://demo@localhost/icpep_region3_disposable_demo?host=remote.example",
    },
    { DATABASE_URL: "invalid" },
    { DEMO_SEED_PASSWORD: "" },
    { DEMO_SEED_PASSWORD: undefined },
  ])("refuses unsafe or incomplete configuration: %j", (override) => {
    expect(() => getDemoConfig({ ...safeEnv, ...override })).toThrow();
  });
});

describe("demo walkthrough fixtures", () => {
  it("uses the real auth password format", async () => {
    const hash = await hashDemoPassword(password);
    expect(hash).toMatch(/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/);
    const data = buildDemoRecords(
      { auf: 1n, bulacan: 2n },
      hash,
      new Date("2026-10-20T00:00:00Z"),
    );
    const admin = data.users[0];
    const auth = new AuthService(
      { findByEmail: async () => admin } as never,
      { sign: jest.fn().mockReturnValue("test-token") } as never,
    );
    await expect(
      auth.login({ email: admin.email, password }),
    ).resolves.toHaveProperty("user.role", "RegionalAdmin");
  });

  it("provides consistent roles, future events, demo labels and cross-chapter responses", () => {
    const now = new Date("2026-10-20T00:00:00Z");
    const data = buildDemoRecords({ auf: 1n, bulacan: 2n }, "test-hash", now);
    expect(data.users.map((user) => user.email)).toEqual([
      "admin@hub-demo.test",
      "regional@hub-demo.test",
      "auf@hub-demo.test",
      "bulacan@hub-demo.test",
      "pending@hub-demo.test",
      "faculty@hub-demo.test",
    ]);
    expect(
      data.users
        .filter((user) =>
          ["RegionalOfficer", "RegionalAdmin"].includes(user.role),
        )
        .every((user) => user.chapterId === null),
    ).toBe(true);
    expect(
      data.users
        .filter((user) => user.role === "ChapterOfficer")
        .every((user) => user.chapterId !== null),
    ).toBe(true);
    expect(
      data.users.filter((user) => !user.isApproved).map((user) => user.email),
    ).toEqual(["pending@hub-demo.test"]);
    expect(data.users.every((user) => user.isActive)).toBe(true);
    expect(data.announcements).toHaveLength(4);
    expect(
      data.announcements.some((item) => item.isPinned && item.isPublished),
    ).toBe(true);
    expect(
      data.announcements.some(
        (item) => item.visibility === "MembersOnly" && item.isPublished,
      ),
    ).toBe(true);
    expect(data.announcements.some((item) => !item.isPublished)).toBe(true);
    expect(data.events).toHaveLength(4);
    const faculty = data.users.find(
      (user) => user.email === "faculty@hub-demo.test",
    );
    expect(faculty).toMatchObject({
      role: "FacultyRepresentative",
      chapterId: 1n,
      facultyDesignation: "Faculty Adviser",
    });
    expect(data.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scope: "Academic",
          organizerChapterId: 1n,
          createdByUserId: faculty?.userId,
          isPublished: true,
          publishedAt: now,
        }),
      ]),
    );
    expect(
      data.events.every(
        (event) =>
          event.startDateTime > now &&
          event.registrationDeadline < event.startDateTime &&
          event.endDateTime > event.startDateTime,
      ),
    ).toBe(true);
    expect(data.requests.map((item) => item.status)).toEqual([
      "Submitted",
      "In Progress",
      "Resolved",
    ]);
    expect(data.updates.some((item) => item.isInternalNote)).toBe(true);
    expect(data.posts).toHaveLength(3);
    expect(data.responses).toHaveLength(2);
    for (const response of data.responses) {
      const post = data.posts.find(
        (item) => item.collaborationPostId === response.collaborationPostId,
      )!;
      expect(response.chapterId).not.toBe(post.chapterId);
      expect(
        data.users.find((user) => user.userId === response.userId)?.chapterId,
      ).toBe(response.chapterId);
    }
    for (const item of [...data.announcements, ...data.events, ...data.posts])
      expect(item.title).toMatch(/^\[DEMO\]/);
    for (const item of data.requests) expect(item.subject).toMatch(/^\[DEMO\]/);
    expect(
      data.officers.every(
        (item) => item.fullName.startsWith("Demo ") && item.photoUrl === null,
      ),
    ).toBe(true);
  });
});

describe("demo rerun protection", () => {
  it("preserves edits instead of resetting an existing demo record", async () => {
    const existing = {
      ownerId: 1n,
      title: "Edited during walkthrough",
      isApproved: true,
    };
    const create = jest.fn<() => Promise<typeof existing>>();
    await expect(
      preserveDemoRecord(existing, { ownerId: 1n }, create),
    ).resolves.toEqual(existing);
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses a reserved ID occupied by another owner", async () => {
    const create = jest.fn<() => Promise<{ ownerId: bigint }>>();
    await expect(
      preserveDemoRecord({ ownerId: 2n }, { ownerId: 1n }, create),
    ).rejects.toThrow("conflicts");
    expect(create).not.toHaveBeenCalled();
  });

  it.each([
    { name: safeEnv.DEMO_DATABASE_NAME, marker: null },
    { name: "another_disposable_demo", marker: DEMO_DATABASE_MARKER },
  ])(
    "requires a matching database-side marker before any write",
    async (database) => {
      const tx = {
        $queryRaw: async () => [database],
        $executeRaw: jest.fn(),
      };
      const prisma = {
        $transaction: async (action: (value: typeof tx) => Promise<unknown>) =>
          action(tx),
      };
      await expect(
        seedDemoDatabase(prisma as never, getDemoConfig(safeEnv)),
      ).rejects.toThrow("explicitly marked");
      expect(tx.$executeRaw).not.toHaveBeenCalled();
    },
  );
});

it("preserves a response withdrawn and resubmitted through the UI under a new ID", async () => {
  const data = buildDemoRecords(
    { auf: 1n, bulacan: 2n },
    "test-hash",
    new Date(),
  );
  function records<T extends object>(items: T[], key: keyof T) {
    return {
      findUnique: async ({ where }: { where: Partial<T> }) =>
        items.find((item) => item[key] === where[key]) ?? null,
      create: async () => {
        throw new Error("Existing fixtures must not be recreated.");
      },
    };
  }
  const resubmitted = {
    ...data.responses[0],
    collaborationResponseId: 1n,
    status: "Accepted",
  };
  const responses = [resubmitted, data.responses[1]];
  const tx = {
    $queryRaw: async () => [
      { name: safeEnv.DEMO_DATABASE_NAME, marker: DEMO_DATABASE_MARKER },
    ],
    $executeRaw: async () => 1,
    chapter: {
      findMany: async () => [
        {
          chapterId: 1n,
          schoolName: "Angeles University Foundation",
          status: "Active",
          officialEmail: "auf-chapter@hub-demo.test",
          address: "[DEMO] desk",
        },
        {
          chapterId: 2n,
          schoolName: "Bulacan State University - Main Campus",
          status: "Active",
          officialEmail: "bulacan-chapter@hub-demo.test",
          address: "[DEMO] desk",
        },
      ],
      update: async () => ({}),
    },
    user: {
      ...records(data.users, "userId"),
      findMany: async ({ where }: { where: { email: { equals: string } } }) =>
        data.users.filter((user) => user.email === where.email.equals),
    },
    chapterOfficer: records(data.officers, "chapterOfficerId"),
    announcement: records(data.announcements, "announcementId"),
    event: records(data.events, "eventId"),
    assistanceRequest: records(data.requests, "assistanceRequestId"),
    assistanceRequestUpdate: records(data.updates, "updateId"),
    collaborationPost: records(data.posts, "collaborationPostId"),
    collaborationResponse: {
      findUnique: async ({
        where,
      }: {
        where: {
          collaborationResponseId?: bigint;
          collaborationPostId_chapterId?: {
            collaborationPostId: bigint;
            chapterId: bigint;
          };
        };
      }) =>
        responses.find((item) =>
          where.collaborationPostId_chapterId
            ? item.collaborationPostId ===
                where.collaborationPostId_chapterId.collaborationPostId &&
              item.chapterId === where.collaborationPostId_chapterId.chapterId
            : item.collaborationResponseId === where.collaborationResponseId,
        ) ?? null,
      create: async () => {
        throw new Error("Duplicate post/chapter response.");
      },
    },
  };
  const prisma = {
    $transaction: async (action: (value: typeof tx) => Promise<unknown>) =>
      action(tx),
  };
  await expect(
    seedDemoDatabase(prisma as never, getDemoConfig(safeEnv)),
  ).resolves.toHaveProperty("responses", 2);
  expect(resubmitted.status).toBe("Accepted");
  expect(responses).toHaveLength(2);
});
