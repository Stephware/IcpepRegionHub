import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AnnouncementsController } from "../src/announcements/announcements.controller.js";
import { AnnouncementsService } from "../src/announcements/announcements.service.js";
import { AccountAdminController } from "../src/auth/account-admin.controller.js";
import { AuthController } from "../src/auth/auth.controller.js";
import { AuthService } from "../src/auth/auth.service.js";
import { SessionTokenService } from "../src/auth/session-token.service.js";
import { UsersService } from "../src/users/users.service.js";
import { PrismaService } from "../src/prisma/prisma.service.js";
import { AnnouncementAdminController } from "../src/announcements/announcement-admin.controller.js";
import { RegionalAnnouncementsController } from "../src/announcements/regional-announcements.controller.js";
import { EventContributorController } from "../src/events/event-contributor.controller.js";
import { MemberAnnouncementsController } from "../src/announcements/member-announcements.controller.js";
import { EventsController } from "../src/events/events.controller.js";
import { EventAdminController } from "../src/events/event-admin.controller.js";
import { EventsService } from "../src/events/events.service.js";
import { AssistanceRequestsController } from "../src/assistance-requests/assistance-requests.controller.js";
import { RegionalAssistanceRequestsController } from "../src/assistance-requests/regional-assistance-requests.controller.js";
import { AssistanceRequestsService } from "../src/assistance-requests/assistance-requests.service.js";
import { CollaborationsController } from "../src/collaborations/collaborations.controller.js";
import { ChapterCollaborationsController } from "../src/collaborations/chapter-collaborations.controller.js";
import { CollaborationAdminController } from "../src/collaborations/collaboration-admin.controller.js";
import { CollaborationsService } from "../src/collaborations/collaborations.service.js";

describe("API end-to-end behavior", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const announcementsService = {
      listPublicAnnouncements: () => [
        {
          announcementId: "1",
          title: "Regional Update",
          content: "Sample announcement",
          category: "General",
          coverImageUrl: null,
          externalLink: null,
          isPinned: false,
          publishedAt: "2026-10-06T00:00:00.000Z",
          expiresAt: null,
          createdBy: {
            userId: "1",
            firstName: "Regional",
            lastName: "Admin",
          },
        },
      ],
      getPublicAnnouncement: () => null,
    };

    const authService = {
      login: async () => ({
        accessToken: "signed-token",
        tokenType: "Bearer",
        user: {
          userId: "10",
          chapterId: "1",
          firstName: "Juan",
          lastName: "Dela Cruz",
          email: "juan@example.com",
          role: "ChapterOfficer",
          isApproved: true,
          isActive: true,
        },
      }),
      register: async () => ({
        message: "Registration submitted.",
        user: {
          userId: "10",
        },
      }),
    };

    const tokenService = {
      createSessionCookie: () =>
        "icpep_session=signed-token; HttpOnly; Path=/; SameSite=Lax",
      createClearSessionCookie: () =>
        "icpep_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0",
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AnnouncementsController, AuthController],
      providers: [
        {
          provide: AnnouncementsService,
          useValue: announcementsService,
        },
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: SessionTokenService,
          useValue: tokenService,
        },
        {
          provide: UsersService,
          useValue: {
            findById: async () => null,
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("serves public announcements", () => {
    return request(app.getHttpServer())
      .get("/api/announcements")
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
        expect(response.body[0].title).toBe("Regional Update");
      });
  });

  it("sets the HttpOnly session cookie after login", () => {
    return request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: "juan@example.com",
        password: "password123",
      })
      .expect(201)
      .expect((response) => {
        expect(response.body).not.toHaveProperty("accessToken");
        expect(response.body.user.email).toBe("juan@example.com");
        expect(response.headers["set-cookie"]?.[0]).toContain(
          "icpep_session=signed-token",
        );
        expect(response.headers["set-cookie"]?.[0]).toContain("HttpOnly");
      });
  });

  it("rejects unknown DTO fields", () => {
    return request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: "juan@example.com",
        password: "password123",
        role: "RegionalAdmin",
      })
      .expect(400);
  });

  it("clears the session cookie on logout", () => {
    return request(app.getHttpServer())
      .post("/api/auth/logout")
      .expect(201)
      .expect((response) => {
        expect(response.body.message).toBe("Signed out successfully.");
        expect(response.headers["set-cookie"]?.[0]).toContain("Max-Age=0");
      });
  });
});

// Keep controllers, guards and services real; replace only database and token configuration.
describe("workflow authorization and visibility", () => {
  let app: INestApplication;
  let tokenService: SessionTokenService;
  const users = [
    { userId: 10n, chapterId: 1n, role: "ChapterOfficer" },
    { userId: 20n, chapterId: 2n, role: "ChapterOfficer" },
    { userId: 30n, chapterId: null, role: "RegionalOfficer" },
    { userId: 40n, chapterId: null, role: "RegionalAdmin" },
    { userId: 50n, chapterId: 1n, role: "FacultyRepresentative" },
    { userId: 60n, chapterId: null, role: "RegionalOfficer" },
    { userId: 70n, chapterId: 1n, role: "ChapterOfficer" },
    { userId: 80n, chapterId: 1n, role: "FacultyRepresentative" },
  ].map((user) => ({
    ...user,
    firstName: "Test",
    lastName: "Officer",
    email: `officer${user.userId}@example.com`,
    isApproved: true,
    isActive: true,
    facultyDesignation:
      user.role === "FacultyRepresentative" ? "Professor" : null,
    passwordHash: "private-password-hash",
  }));
  const prisma = {
    announcement: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    assistanceRequest: { findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
    collaborationPost: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    collaborationResponse: { findFirst: jest.fn() },
    chapter: { findUnique: jest.fn(), findMany: jest.fn() },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    contentAction: { create: jest.fn() },
    $transaction: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const eventInput = {
    title: "Academic Seminar",
    eventType: "Seminar",
    startDateTime: "2099-11-10T01:00:00.000Z",
  };
  const announcementInput = {
    title: "Regional Update",
    content: "Member information",
    category: "General",
  };
  function definedFields(data: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    );
  }
  function eventFixture(userId: number) {
    const owner = users.find((user) => user.userId === BigInt(userId))!;
    const scope =
      owner.role === "ChapterOfficer"
        ? "Chapter"
        : owner.role === "FacultyRepresentative"
          ? "Academic"
          : "Regional";
    return {
      eventId: 20n,
      ...eventInput,
      startDateTime: new Date(eventInput.startDateTime),
      endDateTime: null,
      registrationDeadline: null,
      description: null,
      venue: null,
      registrationLink: null,
      coverImageUrl: null,
      status: "Upcoming",
      isPublished: false,
      publishedAt: null,
      scope,
      organizerChapterId: owner.chapterId,
      organizer: owner.chapterId
        ? {
            chapterId: owner.chapterId,
            schoolName: "Test Institution",
            chapterName: "Student Chapter",
            acronym: "TC",
          }
        : null,
      createdByUserId: owner.userId,
      createdBy: owner,
      createdAt: new Date(),
      updatedAt: null,
    };
  }
  function announcementFixture(userId: number) {
    const owner = users.find((user) => user.userId === BigInt(userId))!;
    return {
      announcementId: 90n,
      ...announcementInput,
      visibility: "Public",
      isPublished: false,
      isPinned: false,
      publishedAt: null,
      expiresAt: null,
      coverImageUrl: null,
      externalLink: null,
      createdByUserId: owner.userId,
      createdBy: owner,
      createdAt: new Date(),
      updatedAt: null,
    };
  }
  let eventRecord: ReturnType<typeof eventFixture> | null;
  let announcementRecord: ReturnType<typeof announcementFixture> | null;

  beforeAll(async () => {
    tokenService = new SessionTokenService(
      new ConfigService({
        JWT_SECRET: "e2e-only-secret-that-is-at-least-32-characters",
      }),
    );
    const module = await Test.createTestingModule({
      controllers: [
        AnnouncementsController,
        AnnouncementAdminController,
        MemberAnnouncementsController,
        RegionalAnnouncementsController,
        AccountAdminController,
        EventsController,
        EventAdminController,
        EventContributorController,
        AssistanceRequestsController,
        RegionalAssistanceRequestsController,
        CollaborationsController,
        ChapterCollaborationsController,
        CollaborationAdminController,
      ],
      providers: [
        AnnouncementsService,
        EventsService,
        AssistanceRequestsService,
        CollaborationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: SessionTokenService, useValue: tokenService },
        UsersService,
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    users.forEach((user) => {
      user.isApproved = user.userId !== 70n;
      user.isActive = user.userId !== 80n;
    });
    eventRecord = null;
    announcementRecord = null;
    prisma.user.findUnique.mockImplementation(
      async ({ where }) =>
        users.find((user) => user.userId === where.userId) ?? null,
    );
    prisma.user.findMany.mockResolvedValue(users);
    prisma.user.count.mockImplementation(
      async () =>
        users.filter(
          (user) =>
            user.role === "RegionalAdmin" && user.isApproved && user.isActive,
        ).length,
    );
    prisma.user.update.mockImplementation(async ({ where, data }) => {
      const user = users.find((entry) => entry.userId === where.userId)!;
      return Object.assign(user, definedFields(data));
    });
    prisma.$executeRaw.mockResolvedValue(1);
    prisma.$transaction.mockImplementation(async (operation) =>
      typeof operation === "function"
        ? operation(prisma)
        : Promise.all(operation),
    );
    prisma.contentAction.create.mockResolvedValue({});
    prisma.event.create.mockImplementation(async ({ data }) => {
      eventRecord = { ...eventFixture(Number(data.createdByUserId)), ...data };
      return eventRecord;
    });
    prisma.event.findUnique.mockImplementation(async () => eventRecord);
    prisma.event.update.mockImplementation(async ({ data }) => {
      eventRecord = { ...eventRecord!, ...definedFields(data) };
      return eventRecord;
    });
    prisma.event.delete.mockImplementation(async () => {
      const deleted = eventRecord;
      eventRecord = null;
      return deleted;
    });
    prisma.announcement.create.mockImplementation(async ({ data }) => {
      announcementRecord = {
        ...announcementFixture(Number(data.createdByUserId)),
        ...data,
      };
      return announcementRecord;
    });
    prisma.announcement.findUnique.mockImplementation(
      async () => announcementRecord,
    );
    prisma.announcement.update.mockImplementation(async ({ data }) => {
      announcementRecord = { ...announcementRecord!, ...definedFields(data) };
      return announcementRecord;
    });
    prisma.announcement.delete.mockImplementation(async () => {
      const deleted = announcementRecord;
      announcementRecord = null;
      return deleted;
    });
    prisma.announcement.findMany.mockResolvedValue([]);
    prisma.event.findMany.mockResolvedValue([]);
    prisma.assistanceRequest.findMany.mockResolvedValue([]);
    prisma.collaborationPost.findMany.mockResolvedValue([]);
    prisma.chapter.findUnique.mockResolvedValue({
      chapterId: 1n,
      status: "Active",
    });
  });

  afterAll(async () => {
    await app.close();
  });

  function authorization(userId: number) {
    const user = users.find((item) => item.userId === BigInt(userId))!;
    return `Bearer ${tokenService.sign({
      sub: user.userId.toString(),
      role: user.role,
      chapterId: user.chapterId?.toString() ?? null,
    })}`;
  }

  it("paginates accounts on the server and validates search inputs", async () => {
    prisma.user.count.mockResolvedValue(12);
    prisma.user.findMany.mockResolvedValue([]);
    await request(app.getHttpServer())
      .get("/api/admin/accounts/paged?filter=Pending&search=Juan&page=2&pageSize=3")
      .set("Authorization", authorization(40))
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({ items: [], total: 12, page: 2, pageCount: 4, pageSize: 3 });
      });
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 3, take: 3, where: expect.objectContaining({ isApproved: false, isActive: true }),
    }));
    await request(app.getHttpServer())
      .get("/api/admin/accounts/paged?page=0")
      .set("Authorization", authorization(40))
      .expect(400);
    await request(app.getHttpServer())
      .get("/api/admin/accounts/paged")
      .set("Authorization", authorization(10))
      .expect(403);
  });

  it("paginates regional requests and serves counts without downloading all tickets", async () => {
    prisma.assistanceRequest.count.mockResolvedValue(12);
    prisma.assistanceRequest.findMany.mockResolvedValue([]);
    await request(app.getHttpServer())
      .get("/api/regional/assistance-requests/paged?status=Submitted&search=AUF&page=2&pageSize=6")
      .set("Authorization", authorization(30))
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({ items: [], total: 12, page: 2, pageCount: 2, pageSize: 6 });
      });
    expect(prisma.assistanceRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 6, take: 6, where: expect.objectContaining({ status: "Submitted" }),
    }));
    prisma.assistanceRequest.groupBy.mockResolvedValue([{ status: "Submitted", _count: { _all: 3 } }]);
    prisma.chapter.findMany.mockResolvedValue([]);
    await request(app.getHttpServer())
      .get("/api/regional/assistance-requests/summary")
      .set("Authorization", authorization(30))
      .expect(200)
      .expect((response) => {
        expect(response.body.counts).toEqual({ open: 3, submitted: 3, inProgress: 0, resolved: 0 });
      });
    await request(app.getHttpServer())
      .get("/api/regional/assistance-requests/paged?pageSize=200")
      .set("Authorization", authorization(30))
      .expect(400);
    await request(app.getHttpServer())
      .get("/api/regional/assistance-requests/paged")
      .set("Authorization", authorization(50))
      .expect(403);
  });

  it.each([
    ["/admin/announcements", 401, 403, 403, 403, 200],
    ["/admin/accounts", 401, 403, 403, 403, 200],
    ["/admin/events", 401, 403, 403, 403, 200],
    ["/admin/collaborations", 401, 403, 403, 403, 200],
    ["/regional/assistance-requests", 401, 403, 403, 200, 200],
    ["/assistance-requests", 401, 200, 403, 403, 403],
    ["/chapter/collaborations", 401, 200, 403, 403, 403],
    ["/collaborations", 401, 200, 200, 200, 200],
    ["/member/announcements", 401, 200, 200, 200, 200],
    ["/contributor/events", 401, 200, 200, 200, 200],
    ["/regional/announcements", 401, 403, 403, 200, 200],
  ])(
    "enforces visitor/chapter/faculty/regional/admin permissions on %s",
    async (
      path,
      publicStatus,
      chapterStatus,
      facultyStatus,
      regionalStatus,
      adminStatus,
    ) => {
      await request(app.getHttpServer())
        .get(`/api${path}`)
        .expect(publicStatus);
      for (const [userId, expected] of [
        [10, chapterStatus],
        [50, facultyStatus],
        [30, regionalStatus],
        [40, adminStatus],
      ]) {
        await request(app.getHttpServer())
          .get(`/api${path}`)
          .set("Authorization", authorization(userId))
          .expect(expected);
      }
    },
  );

  it.each([10, 30, 50])(
    "blocks user %s from content writes and collaboration moderation",
    async (userId) => {
      for (const path of ["/admin/announcements", "/admin/events"]) {
        await request(app.getHttpServer())
          .post(`/api${path}`)
          .set("Authorization", authorization(userId))
          .send({})
          .expect(403);
      }
      await request(app.getHttpServer())
        .patch("/api/admin/collaborations/50/status")
        .set("Authorization", authorization(userId))
        .send({ status: "Closed" })
        .expect(403);
    },
  );

  it.each([30, 40, 50])(
    "does not let regional user %s create posts or decide chapter responses",
    async (userId) => {
      await request(app.getHttpServer())
        .post("/api/chapter/collaborations")
        .set("Authorization", authorization(userId))
        .send({})
        .expect(403);
      await request(app.getHttpServer())
        .patch("/api/chapter/collaborations/50/responses/70/status")
        .set("Authorization", authorization(userId))
        .send({ status: "Accepted" })
        .expect(403);
    },
  );

  it("keeps member announcements and drafts out of public list and detail queries", async () => {
    prisma.announcement.findFirst.mockResolvedValue(null);
    await request(app.getHttpServer())
      .get("/api/announcements")
      .expect(200, []);
    await request(app.getHttpServer()).get("/api/announcements/1").expect(404);
    for (const method of [
      prisma.announcement.findMany,
      prisma.announcement.findFirst,
    ]) {
      expect(method).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublished: true,
            visibility: "Public",
            OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
          }),
        }),
      );
    }
    await request(app.getHttpServer())
      .get("/api/member/announcements")
      .set("Authorization", authorization(10))
      .expect(200);
    expect(prisma.announcement.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isPublished: true,
          visibility: { in: ["Public", "MembersOnly"] },
        }),
      }),
    );
  });

  it("keeps draft events out of public list and detail queries", async () => {
    prisma.event.findFirst.mockResolvedValue(null);
    await request(app.getHttpServer()).get("/api/events").expect(200, []);
    await request(app.getHttpServer()).get("/api/events/1").expect(404);
    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isPublished: true } }),
    );
    expect(prisma.event.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { eventId: 1n, isPublished: true } }),
    );
  });

  it("lets the admin create a regional event without an organizer chapter", async () => {
    await request(app.getHttpServer())
      .post("/api/admin/events")
      .set("Authorization", authorization(40))
      .send({
        title: "Regional Assembly",
        eventType: "Assembly",
        organizerChapterId: null,
        startDateTime: "2099-11-10T01:00:00.000Z",
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.event.organizerChapterId).toBeNull();
        expect(response.body.event.isPublished).toBe(false);
      });
  });

  it.each([
    [
      "event",
      "POST",
      ["description", "scope", "venue", "registrationLink", "coverImageUrl"],
    ],
    [
      "event",
      "PATCH",
      [
        "title",
        "description",
        "eventType",
        "scope",
        "venue",
        "startDateTime",
        "registrationLink",
        "coverImageUrl",
      ],
    ],
    ["announcement", "POST", ["visibility", "coverImageUrl", "externalLink"]],
    [
      "announcement",
      "PATCH",
      [
        "title",
        "content",
        "category",
        "visibility",
        "coverImageUrl",
        "externalLink",
      ],
    ],
  ])(
    "rejects null content fields in %s %s requests",
    async (resource, method, fields) => {
      eventRecord = eventFixture(10);
      announcementRecord = announcementFixture(30);
      const path =
        resource === "event"
          ? "/api/contributor/events"
          : "/api/regional/announcements";
      const auth = authorization(resource === "event" ? 10 : 30);
      for (const field of fields) {
        const body =
          method === "POST"
            ? {
                ...(resource === "event" ? eventInput : announcementInput),
                [field]: null,
              }
            : { [field]: null };
        const call =
          method === "POST"
            ? request(app.getHttpServer()).post(path)
            : request(app.getHttpServer()).patch(
                `${path}/${resource === "event" ? 20 : 90}`,
              );
        await call.set("Authorization", auth).send(body).expect(400);
      }
    },
  );

  it("keeps nullable event dates and admin organizers clearable", async () => {
    eventRecord = eventFixture(40);
    await request(app.getHttpServer())
      .patch("/api/admin/events/20")
      .set("Authorization", authorization(40))
      .send({
        organizerChapterId: null,
        endDateTime: null,
        registrationDeadline: null,
        description: "",
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.event).toMatchObject({
          organizerChapterId: null,
          endDateTime: null,
          registrationDeadline: null,
          description: null,
        });
      });
  });

  it("keeps announcement expiration and optional link text clearable", async () => {
    announcementRecord = announcementFixture(30);
    await request(app.getHttpServer())
      .patch("/api/regional/announcements/90")
      .set("Authorization", authorization(30))
      .send({ expiresAt: null, externalLink: "" })
      .expect(200)
      .expect((response) => {
        expect(response.body.announcement).toMatchObject({
          expiresAt: null,
          externalLink: null,
        });
      });
  });

  it.each([
    [10, "Chapter", "1"],
    [50, "Academic", "1"],
    [30, "Regional", null],
  ])(
    "lets approved contributor %s manage and directly publish a %s event",
    async (userId, scope, organizerChapterId) => {
      const auth = authorization(userId);
      const created = await request(app.getHttpServer())
        .post("/api/contributor/events")
        .set("Authorization", auth)
        .send(eventInput)
        .expect(201);
      expect(created.body.event).toMatchObject({
        scope,
        organizerChapterId,
        createdByUserId: String(userId),
        editorialState: "Draft",
        isPublished: false,
      });
      const published = await request(app.getHttpServer())
        .patch("/api/contributor/events/20/publish")
        .set("Authorization", auth)
        .send({ isPublished: true })
        .expect(200);
      expect(published.body.event).toMatchObject({
        scope,
        isPublished: true,
        editorialState: "Published",
        status: "Upcoming",
      });
      expect(
        new Date(published.body.event.publishedAt).getTime(),
      ).toBeGreaterThan(0);
      if (scope === "Academic") {
        expect(published.body.event.createdBy.facultyDesignation).toBe(
          "Professor",
        );
      }
      expect(JSON.stringify(published.body)).not.toMatch(
        /private-password-hash|officer\d+@example\.com/,
      );
      await request(app.getHttpServer())
        .patch("/api/contributor/events/20")
        .set("Authorization", auth)
        .send({ title: "Updated seminar" })
        .expect(200)
        .expect((response) => {
          expect(response.body.event.title).toBe("Updated seminar");
        });
      await request(app.getHttpServer())
        .patch("/api/contributor/events/20/publish")
        .set("Authorization", auth)
        .send({ isPublished: false })
        .expect(200)
        .expect((response) => {
          expect(response.body.event.editorialState).toBe("Draft");
        });
      await request(app.getHttpServer())
        .patch("/api/contributor/events/20/cancel")
        .set("Authorization", auth)
        .send({ isCancelled: true })
        .expect(200)
        .expect((response) => {
          expect(response.body.event.editorialState).toBe("Cancelled");
        });
      await request(app.getHttpServer())
        .patch("/api/contributor/events/20/publish")
        .set("Authorization", auth)
        .send({ isPublished: true })
        .expect(400);
      await request(app.getHttpServer())
        .patch("/api/contributor/events/20/cancel")
        .set("Authorization", auth)
        .send({ isCancelled: false })
        .expect(200);
      expect(prisma.announcement.create).not.toHaveBeenCalled();
      expect(prisma.contentAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resource: "Event",
            resourceId: 20n,
            action: "Published",
            actorUserId: BigInt(userId),
          }),
        }),
      );
    },
  );

  it.each([
    [10, { scope: "Regional" }],
    [50, { scope: "Regional" }],
    [50, { scope: "Chapter" }],
    [30, { scope: "Academic" }],
    [10, { organizerChapterId: "2" }],
    [50, { organizerChapterId: "2" }],
  ])(
    "rejects contributor %s forging event scope or organizer %j",
    async (userId, forged) => {
      await request(app.getHttpServer())
        .post("/api/contributor/events")
        .set("Authorization", authorization(userId))
        .send({ ...eventInput, ...forged })
        .expect(403);
      expect(prisma.event.create).not.toHaveBeenCalled();
    },
  );

  it.each([10, 50])(
    "requires contributor %s to have an active assigned institution",
    async (userId) => {
      prisma.chapter.findUnique.mockResolvedValue({
        chapterId: 1n,
        status: "Inactive",
      });
      await request(app.getHttpServer())
        .post("/api/contributor/events")
        .set("Authorization", authorization(userId))
        .send(eventInput)
        .expect(400);
      expect(prisma.event.create).not.toHaveBeenCalled();
    },
  );

  it.each([20, 30, 50])(
    "prevents user %s reading or mutating another contributor's event",
    async (userId) => {
      eventRecord = eventFixture(10);
      const auth = authorization(userId);
      await request(app.getHttpServer())
        .get("/api/contributor/events/20")
        .set("Authorization", auth)
        .expect(403);
      await request(app.getHttpServer())
        .patch("/api/contributor/events/20")
        .set("Authorization", auth)
        .send({ title: "Forged" })
        .expect(403);
      await request(app.getHttpServer())
        .patch("/api/contributor/events/20/publish")
        .set("Authorization", auth)
        .send({ isPublished: true })
        .expect(403);
      await request(app.getHttpServer())
        .patch("/api/contributor/events/20/cancel")
        .set("Authorization", auth)
        .send({ isCancelled: true })
        .expect(403);
      await request(app.getHttpServer())
        .delete("/api/contributor/events/20")
        .set("Authorization", auth)
        .expect(403);
      expect(prisma.event.update).not.toHaveBeenCalled();
      expect(prisma.event.delete).not.toHaveBeenCalled();
    },
  );

  it("filters contributor event lists by ownership while allowing admin oversight", async () => {
    for (const [userId, scope, organizerChapterId] of [
      [10, "Chapter", 1n],
      [30, "Regional", null],
      [50, "Academic", 1n],
    ] as const) {
      await request(app.getHttpServer())
        .get("/api/contributor/events")
        .set("Authorization", authorization(userId))
        .expect(200);
      expect(prisma.event.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: { createdByUserId: BigInt(userId), scope, organizerChapterId },
        }),
      );
    }
    await request(app.getHttpServer())
      .get("/api/contributor/events")
      .set("Authorization", authorization(40))
      .expect(200);
    expect(prisma.event.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it("lets the admin edit, unpublish, cancel and remove a faculty event with attribution", async () => {
    eventRecord = { ...eventFixture(50), isPublished: true };
    const auth = authorization(40);
    await request(app.getHttpServer())
      .patch("/api/admin/events/20")
      .set("Authorization", auth)
      .send({ title: "Moderated event" })
      .expect(200);
    await request(app.getHttpServer())
      .patch("/api/admin/events/20/publish")
      .set("Authorization", auth)
      .send({ isPublished: false })
      .expect(200);
    await request(app.getHttpServer())
      .patch("/api/admin/events/20/cancel")
      .set("Authorization", auth)
      .send({ isCancelled: true })
      .expect(200);
    await request(app.getHttpServer())
      .delete("/api/admin/events/20")
      .set("Authorization", auth)
      .expect(200);
    expect(prisma.contentAction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          resource: "Event",
          resourceId: 20n,
          action: "Deleted",
          actorUserId: 40n,
        }),
      }),
    );
  });

  it.each([70, 80])(
    "rejects pending or inactive user %s on every protected publishing and member surface",
    async (userId) => {
      const auth = authorization(userId);
      for (const path of [
        "/contributor/events",
        "/member/announcements",
        "/collaborations",
        "/regional/announcements",
      ]) {
        await request(app.getHttpServer())
          .get(`/api${path}`)
          .set("Authorization", auth)
          .expect(401);
      }
      await request(app.getHttpServer())
        .post("/api/contributor/events")
        .set("Authorization", auth)
        .send(eventInput)
        .expect(401);
    },
  );

  it.each([
    ["active", { isActive: false }],
    ["role", { role: "RegionalOfficer" }],
  ])(
    "blocks removal of the last active approved admin through %s",
    async (action, payload) => {
      await request(app.getHttpServer())
        .patch(`/api/admin/accounts/40/${action}`)
        .set("Authorization", authorization(40))
        .send(payload)
        .expect(400)
        .expect((response) => {
          expect(response.body.message).toContain(
            "At least one approved active RegionalAdmin",
          );
        });
      expect(users[3]).toMatchObject({
        role: "RegionalAdmin",
        isApproved: true,
        isActive: true,
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
    },
  );

  it("allows deactivation when another approved active admin remains", async () => {
    const secondAdmin = users[5];
    const originalRole = secondAdmin.role;
    secondAdmin.role = "RegionalAdmin";
    const secondSession = authorization(60);
    try {
      await request(app.getHttpServer())
        .patch("/api/admin/accounts/60/active")
        .set("Authorization", authorization(40))
        .send({ isActive: false })
        .expect(200)
        .expect((response) => {
          expect(response.body.user.isActive).toBe(false);
        });
      await request(app.getHttpServer())
        .get("/api/admin/accounts")
        .set("Authorization", secondSession)
        .expect(401);
    } finally {
      secondAdmin.role = originalRole;
      secondAdmin.isActive = true;
    }
  });

  it("allows a role change when another admin remains and removes old session permissions", async () => {
    const secondAdmin = users[5];
    const originalRole = secondAdmin.role;
    secondAdmin.role = "RegionalAdmin";
    const secondSession = authorization(60);
    try {
      await request(app.getHttpServer())
        .patch("/api/admin/accounts/60/role")
        .set("Authorization", authorization(40))
        .send({ role: "RegionalOfficer" })
        .expect(200)
        .expect((response) => {
          expect(response.body.user.role).toBe("RegionalOfficer");
        });
      await request(app.getHttpServer())
        .get("/api/admin/accounts")
        .set("Authorization", secondSession)
        .expect(403);
      await request(app.getHttpServer())
        .get("/api/regional/announcements")
        .set("Authorization", secondSession)
        .expect(200);
    } finally {
      secondAdmin.role = originalRole;
    }
  });

  it.each([10, 30, 50])(
    "prevents user %s from changing account roles or activation",
    async (userId) => {
      await request(app.getHttpServer())
        .patch("/api/admin/accounts/40/active")
        .set("Authorization", authorization(userId))
        .send({ isActive: false })
        .expect(403);
      await request(app.getHttpServer())
        .patch("/api/admin/accounts/10/role")
        .set("Authorization", authorization(userId))
        .send({ role: "RegionalAdmin" })
        .expect(403);
      expect(prisma.user.update).not.toHaveBeenCalled();
    },
  );

  it.each(["role", "institution"])(
    "revokes old event withdrawal and reads after the current %s changes",
    async (change) => {
      const actor = users.find(
        (user) => user.userId === (change === "role" ? 30n : 10n),
      )!;
      const original = { role: actor.role, chapterId: actor.chapterId };
      eventRecord = eventFixture(Number(actor.userId));
      const auth = authorization(Number(actor.userId));
      try {
        if (change === "role") {
          actor.role = "FacultyRepresentative";
          actor.chapterId = 1n;
        } else {
          actor.chapterId = 2n;
        }
        await request(app.getHttpServer())
          .get("/api/contributor/events/20")
          .set("Authorization", auth)
          .expect(403);
        await request(app.getHttpServer())
          .patch("/api/contributor/events/20/publish")
          .set("Authorization", auth)
          .send({ isPublished: false })
          .expect(403);
        await request(app.getHttpServer())
          .patch("/api/contributor/events/20/cancel")
          .set("Authorization", auth)
          .send({ isCancelled: true })
          .expect(403);
        expect(prisma.event.update).not.toHaveBeenCalled();
      } finally {
        Object.assign(actor, original);
      }
    },
  );

  it("applies account deactivation and role changes to an existing session on the next request", async () => {
    const actor = users[2];
    const auth = authorization(30);
    try {
      await request(app.getHttpServer())
        .get("/api/regional/announcements")
        .set("Authorization", auth)
        .expect(200);
      actor.role = "FacultyRepresentative";
      await request(app.getHttpServer())
        .get("/api/regional/announcements")
        .set("Authorization", auth)
        .expect(403);
      actor.isActive = false;
      await request(app.getHttpServer())
        .get("/api/contributor/events")
        .set("Authorization", auth)
        .expect(401);
    } finally {
      actor.role = "RegionalOfficer";
      actor.isActive = true;
    }
  });

  it.each([
    { createdByUserId: "40" },
    { isPublished: true },
    { scope: "Official" },
  ])("rejects client-controlled event identity or state %j", async (forged) => {
    await request(app.getHttpServer())
      .post("/api/contributor/events")
      .set("Authorization", authorization(50))
      .send({ ...eventInput, ...forged })
      .expect(400);
    expect(prisma.event.create).not.toHaveBeenCalled();
  });

  it("accepts the existing session cookie for contributor publishing", async () => {
    const token = authorization(50).slice("Bearer ".length);
    await request(app.getHttpServer())
      .post("/api/contributor/events")
      .set("Cookie", `icpep_session=${encodeURIComponent(token)}`)
      .send(eventInput)
      .expect(201);
  });

  it("lets regional officers create, publish, edit and unpublish their own announcements", async () => {
    const auth = authorization(30);
    await request(app.getHttpServer())
      .post("/api/regional/announcements")
      .set("Authorization", auth)
      .send(announcementInput)
      .expect(201)
      .expect((response) => {
        expect(response.body.announcement).toMatchObject({
          createdByUserId: "30",
          isPublished: false,
        });
      });
    await request(app.getHttpServer())
      .patch("/api/regional/announcements/90/publish")
      .set("Authorization", auth)
      .send({ isPublished: true })
      .expect(200)
      .expect((response) => {
        expect(response.body.announcement.isPublished).toBe(true);
        expect(response.body.announcement.publishedAt).toBeTruthy();
        expect(JSON.stringify(response.body)).not.toMatch(
          /private-password-hash|officer\d+@example\.com/,
        );
      });
    await request(app.getHttpServer())
      .patch("/api/regional/announcements/90")
      .set("Authorization", auth)
      .send({ title: "Edited by owner" })
      .expect(200)
      .expect((response) => {
        expect(response.body.announcement.title).toBe("Edited by owner");
      });
    await request(app.getHttpServer())
      .patch("/api/regional/announcements/90/publish")
      .set("Authorization", auth)
      .send({ isPublished: false })
      .expect(200)
      .expect((response) => {
        expect(response.body.announcement.isPublished).toBe(false);
      });
    await request(app.getHttpServer())
      .get("/api/regional/announcements")
      .set("Authorization", auth)
      .expect(200);
    expect(prisma.announcement.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { createdByUserId: 30n } }),
    );
    expect(prisma.contentAction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          resource: "Announcement",
          resourceId: 90n,
          action: "Published",
          actorUserId: 30n,
        }),
      }),
    );
  });

  it("prevents a regional officer editing, publishing or removing another officer's announcement", async () => {
    announcementRecord = announcementFixture(30);
    const auth = authorization(60);
    await request(app.getHttpServer())
      .get("/api/regional/announcements/90")
      .set("Authorization", auth)
      .expect(403);
    await request(app.getHttpServer())
      .patch("/api/regional/announcements/90")
      .set("Authorization", auth)
      .send({ title: "Forged" })
      .expect(403);
    await request(app.getHttpServer())
      .patch("/api/regional/announcements/90/publish")
      .set("Authorization", auth)
      .send({ isPublished: false })
      .expect(403);
    await request(app.getHttpServer())
      .delete("/api/regional/announcements/90")
      .set("Authorization", auth)
      .expect(403);
    expect(prisma.announcement.update).not.toHaveBeenCalled();
    expect(prisma.announcement.delete).not.toHaveBeenCalled();
  });

  it("allows admins to moderate announcements from a regional officer", async () => {
    announcementRecord = announcementFixture(30);
    const auth = authorization(40);
    await request(app.getHttpServer())
      .patch("/api/admin/announcements/90")
      .set("Authorization", auth)
      .send({ title: "Moderated" })
      .expect(200);
    await request(app.getHttpServer())
      .patch("/api/admin/announcements/90/publish")
      .set("Authorization", auth)
      .send({ isPublished: false })
      .expect(200);
    await request(app.getHttpServer())
      .delete("/api/admin/announcements/90")
      .set("Authorization", auth)
      .expect(200);
  });

  it.each([10, 50])(
    "blocks contributor %s from official regional announcement writes and chapter responses where unauthorized",
    async (userId) => {
      await request(app.getHttpServer())
        .post("/api/regional/announcements")
        .set("Authorization", authorization(userId))
        .send(announcementInput)
        .expect(403);
      if (userId === 50) {
        await request(app.getHttpServer())
          .post("/api/chapter/collaborations/50/responses")
          .set("Authorization", authorization(userId))
          .send({ message: "Interested" })
          .expect(403);
        await request(app.getHttpServer())
          .post("/api/assistance-requests")
          .set("Authorization", authorization(userId))
          .send({})
          .expect(403);
      }
    },
  );

  it("denies a chapter officer another chapter's assistance request", async () => {
    prisma.assistanceRequest.findFirst.mockResolvedValue(null);
    await request(app.getHttpServer())
      .get("/api/assistance-requests/40")
      .set("Authorization", authorization(20))
      .expect(404);
    expect(prisma.assistanceRequest.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          assistanceRequestId: 40n,
          chapterId: 2n,
        },
      }),
    );
  });

  it("returns public assistance updates without internal notes or their flag", async () => {
    prisma.assistanceRequest.findFirst.mockImplementation(
      async ({ include }) => {
        const updates = [
          {
            updateId: 1n,
            message: "Public update",
            isInternalNote: false,
            newStatus: null,
            createdAt: new Date(),
            user: users[2],
          },
          {
            updateId: 2n,
            message: "Confidential internal note",
            isInternalNote: true,
            newStatus: null,
            createdAt: new Date(),
            user: users[2],
          },
        ];
        return {
          assistanceRequestId: 40n,
          ticketCode: "R3-TEST",
          category: "General",
          subject: "Help",
          description: "Details",
          priority: "Normal",
          status: "Submitted",
          submittedAt: new Date(),
          resolvedAt: null,
          updatedAt: null,
          chapter: {
            chapterId: 1n,
            schoolName: "Test School",
            chapterName: "Test Chapter",
            acronym: null,
          },
          submittedBy: users[0],
          assignedTo: null,
          updates: updates.filter(
            (update) =>
              include.updates.where?.isInternalNote === undefined ||
              update.isInternalNote === include.updates.where.isInternalNote,
          ),
        };
      },
    );
    const response = await request(app.getHttpServer())
      .get("/api/assistance-requests/40")
      .set("Authorization", authorization(10))
      .expect(200);
    expect(response.body.updates).toHaveLength(1);
    expect(response.body.updates[0].message).toBe("Public update");
    expect(JSON.stringify(response.body)).not.toContain("Confidential");
    expect(response.body.updates[0]).not.toHaveProperty("isInternalNote");
  });

  it("denies another chapter editing or deciding responses on a post", async () => {
    prisma.collaborationPost.findUnique.mockResolvedValue({
      collaborationPostId: 50n,
      chapterId: 1n,
      createdByUserId: 10n,
      status: "Open",
    });
    await request(app.getHttpServer())
      .patch("/api/chapter/collaborations/50")
      .set("Authorization", authorization(20))
      .send({ title: "Unauthorized change" })
      .expect(403);
    await request(app.getHttpServer())
      .patch("/api/chapter/collaborations/50/responses/70/status")
      .set("Authorization", authorization(20))
      .send({ status: "Accepted" })
      .expect(403);
  });

  it("lets a chapter create and edit a collaboration with an empty optional contact email", async () => {
    const post = {
      collaborationPostId: 50n,
      chapterId: 1n,
      createdByUserId: 10n,
      collaborationType: "Project",
      title: "Partner project",
      description: "Work together",
      eventName: null,
      eventDate: null,
      location: null,
      contactName: null,
      contactEmail: null,
      contactNumber: null,
      status: "Open",
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: null,
      chapter: {
        chapterId: 1n,
        schoolName: "Test School",
        chapterName: "Test Chapter",
        acronym: null,
      },
      createdBy: users[0],
    };
    prisma.collaborationPost.create.mockResolvedValue(post);
    prisma.collaborationPost.findUnique.mockResolvedValue(post);
    prisma.collaborationPost.update.mockResolvedValue(post);
    await request(app.getHttpServer())
      .post("/api/chapter/collaborations")
      .set("Authorization", authorization(10))
      .send({
        collaborationType: "Project",
        title: "Partner project",
        description: "Work together",
        contactEmail: "",
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.post.contactEmail).toBeNull();
      });
    await request(app.getHttpServer())
      .patch("/api/chapter/collaborations/50")
      .set("Authorization", authorization(10))
      .send({ contactEmail: "" })
      .expect(200);
    expect(prisma.collaborationPost.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ contactEmail: null }),
      }),
    );
  });

  it("still rejects a malformed nonempty collaboration contact email", async () => {
    await request(app.getHttpServer())
      .post("/api/chapter/collaborations")
      .set("Authorization", authorization(10))
      .send({
        collaborationType: "Project",
        title: "Partner project",
        description: "Work together",
        contactEmail: "not-an-email",
      })
      .expect(400);
    expect(prisma.collaborationPost.create).not.toHaveBeenCalled();
  });

  it.each([
    ["Open", null, 10, 400],
    ["Closed", null, 20, 400],
    ["Open", new Date("2000-01-01"), 20, 400],
    ["Open", null, 20, 409],
  ])(
    "rejects self, closed, expired or duplicate collaboration responses (%s, %s, user %s)",
    async (status, expiresAt, userId, expected) => {
      prisma.collaborationPost.findUnique.mockResolvedValue({
        collaborationPostId: 50n,
        chapterId: 1n,
        status,
        expiresAt,
      });
      prisma.collaborationResponse.findFirst.mockResolvedValue({
        collaborationResponseId: 70n,
      });
      await request(app.getHttpServer())
        .post("/api/chapter/collaborations/50/responses")
        .set("Authorization", authorization(userId))
        .send({ message: "Interested" })
        .expect(expected);
    },
  );
});
