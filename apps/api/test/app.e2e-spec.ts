import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AnnouncementsController } from "../src/announcements/announcements.controller.js";
import { AnnouncementsService } from "../src/announcements/announcements.service.js";
import { AuthController } from "../src/auth/auth.controller.js";
import { AuthService } from "../src/auth/auth.service.js";
import { SessionTokenService } from "../src/auth/session-token.service.js";
import { UsersService } from "../src/users/users.service.js";
import { PrismaService } from "../src/prisma/prisma.service.js";
import { AnnouncementAdminController } from "../src/announcements/announcement-admin.controller.js";
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
  ].map((user) => ({
    ...user,
    firstName: "Test",
    lastName: "Officer",
    email: `officer${user.userId}@example.com`,
    isApproved: true,
    isActive: true,
  }));
  const prisma = {
    announcement: { findMany: jest.fn(), findFirst: jest.fn() },
    event: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    assistanceRequest: { findMany: jest.fn(), findFirst: jest.fn() },
    collaborationPost: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    collaborationResponse: { findFirst: jest.fn() },
    chapter: { findUnique: jest.fn() },
  };

  beforeAll(async () => {
    tokenService = new SessionTokenService(new ConfigService({
      JWT_SECRET: "e2e-only-secret-that-is-at-least-32-characters",
    }));
    const module = await Test.createTestingModule({
      controllers: [
        AnnouncementsController, AnnouncementAdminController, MemberAnnouncementsController,
        EventsController, EventAdminController,
        AssistanceRequestsController, RegionalAssistanceRequestsController,
        CollaborationsController, ChapterCollaborationsController, CollaborationAdminController,
      ],
      providers: [
        AnnouncementsService, EventsService, AssistanceRequestsService, CollaborationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: SessionTokenService, useValue: tokenService },
        { provide: UsersService, useValue: {
          findById: async (userId: bigint) => users.find((user) => user.userId === userId),
        } },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.announcement.findMany.mockResolvedValue([]);
    prisma.event.findMany.mockResolvedValue([]);
    prisma.assistanceRequest.findMany.mockResolvedValue([]);
    prisma.collaborationPost.findMany.mockResolvedValue([]);
    prisma.chapter.findUnique.mockResolvedValue({ chapterId: 1n, status: "Active" });
  });

  afterAll(async () => { await app.close(); });

  function authorization(userId: number) {
    const user = users.find((item) => item.userId === BigInt(userId))!;
    return `Bearer ${tokenService.sign({
      sub: user.userId.toString(), role: user.role, chapterId: user.chapterId?.toString() ?? null,
    })}`;
  }

  it.each([
    ["/admin/announcements", 401, 403, 403, 200],
    ["/admin/events", 401, 403, 403, 200],
    ["/admin/collaborations", 401, 403, 403, 200],
    ["/regional/assistance-requests", 401, 403, 200, 200],
    ["/assistance-requests", 401, 200, 403, 403],
    ["/chapter/collaborations", 401, 200, 403, 403],
    ["/collaborations", 401, 200, 200, 200],
    ["/member/announcements", 401, 200, 200, 200],
  ])("enforces the public/chapter/regional/admin role matrix on %s", async (path, publicStatus, chapterStatus, regionalStatus, adminStatus) => {
    await request(app.getHttpServer()).get(`/api${path}`).expect(publicStatus);
    for (const [userId, expected] of [[10, chapterStatus], [30, regionalStatus], [40, adminStatus]]) {
      await request(app.getHttpServer()).get(`/api${path}`).set("Authorization", authorization(userId)).expect(expected);
    }
  });

  it.each([10, 30])("blocks user %s from content writes and collaboration moderation", async (userId) => {
    for (const path of ["/admin/announcements", "/admin/events"]) {
      await request(app.getHttpServer()).post(`/api${path}`).set("Authorization", authorization(userId)).send({}).expect(403);
    }
    await request(app.getHttpServer()).patch("/api/admin/collaborations/50/status")
      .set("Authorization", authorization(userId)).send({ status: "Closed" }).expect(403);
  });

  it.each([30, 40])("does not let regional user %s create posts or decide chapter responses", async (userId) => {
    await request(app.getHttpServer()).post("/api/chapter/collaborations")
      .set("Authorization", authorization(userId)).send({}).expect(403);
    await request(app.getHttpServer()).patch("/api/chapter/collaborations/50/responses/70/status")
      .set("Authorization", authorization(userId)).send({ status: "Accepted" }).expect(403);
  });

  it("keeps member announcements and drafts out of public list and detail queries", async () => {
    prisma.announcement.findFirst.mockResolvedValue(null);
    await request(app.getHttpServer()).get("/api/announcements").expect(200, []);
    await request(app.getHttpServer()).get("/api/announcements/1").expect(404);
    for (const method of [prisma.announcement.findMany, prisma.announcement.findFirst]) {
      expect(method).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
        isPublished: true, visibility: "Public",
        OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
      }) }));
    }
    await request(app.getHttpServer()).get("/api/member/announcements").set("Authorization", authorization(10)).expect(200);
    expect(prisma.announcement.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: expect.objectContaining({
      isPublished: true, visibility: { in: ["Public", "MembersOnly"] },
    }) }));
  });

  it("keeps draft events out of public list and detail queries", async () => {
    prisma.event.findFirst.mockResolvedValue(null);
    await request(app.getHttpServer()).get("/api/events").expect(200, []);
    await request(app.getHttpServer()).get("/api/events/1").expect(404);
    expect(prisma.event.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isPublished: true } }));
    expect(prisma.event.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { eventId: 1n, isPublished: true } }));
  });

  it("lets the admin create a regional event without an organizer chapter", async () => {
    prisma.event.create.mockImplementation(async ({ data }) => ({
      ...data, eventId: 20n, description: null, venue: null,
      registrationLink: null, coverImageUrl: null, organizer: null,
      createdAt: new Date(), updatedAt: null, createdBy: users[3],
    }));
    await request(app.getHttpServer()).post("/api/admin/events").set("Authorization", authorization(40))
      .send({ title: "Regional Assembly", eventType: "Assembly", organizerChapterId: null, startDateTime: "2099-11-10T01:00:00.000Z" })
      .expect(201).expect((response) => {
        expect(response.body.event.organizerChapterId).toBeNull();
        expect(response.body.event.isPublished).toBe(false);
      });
  });

  it("denies a chapter officer another chapter's assistance request", async () => {
    prisma.assistanceRequest.findFirst.mockResolvedValue(null);
    await request(app.getHttpServer()).get("/api/assistance-requests/40").set("Authorization", authorization(20)).expect(404);
    expect(prisma.assistanceRequest.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: {
      assistanceRequestId: 40n, chapterId: 2n,
    } }));
  });

  it("returns public assistance updates without internal notes or their flag", async () => {
    prisma.assistanceRequest.findFirst.mockImplementation(async ({ include }) => {
      const updates = [
        { updateId: 1n, message: "Public update", isInternalNote: false, newStatus: null, createdAt: new Date(), user: users[2] },
        { updateId: 2n, message: "Confidential internal note", isInternalNote: true, newStatus: null, createdAt: new Date(), user: users[2] },
      ];
      return {
        assistanceRequestId: 40n, ticketCode: "R3-TEST", category: "General", subject: "Help",
        description: "Details", priority: "Normal", status: "Submitted", submittedAt: new Date(), resolvedAt: null, updatedAt: null,
        chapter: { chapterId: 1n, schoolName: "Test School", chapterName: "Test Chapter", acronym: null },
        submittedBy: users[0], assignedTo: null,
        updates: updates.filter((update) => include.updates.where?.isInternalNote === undefined || update.isInternalNote === include.updates.where.isInternalNote),
      };
    });
    const response = await request(app.getHttpServer()).get("/api/assistance-requests/40").set("Authorization", authorization(10)).expect(200);
    expect(response.body.updates).toHaveLength(1);
    expect(response.body.updates[0].message).toBe("Public update");
    expect(JSON.stringify(response.body)).not.toContain("Confidential");
    expect(response.body.updates[0]).not.toHaveProperty("isInternalNote");
  });

  it("denies another chapter editing or deciding responses on a post", async () => {
    prisma.collaborationPost.findUnique.mockResolvedValue({ collaborationPostId: 50n, chapterId: 1n, createdByUserId: 10n, status: "Open" });
    await request(app.getHttpServer()).patch("/api/chapter/collaborations/50").set("Authorization", authorization(20))
      .send({ title: "Unauthorized change" }).expect(403);
    await request(app.getHttpServer()).patch("/api/chapter/collaborations/50/responses/70/status").set("Authorization", authorization(20))
      .send({ status: "Accepted" }).expect(403);
  });

  it("lets a chapter create and edit a collaboration with an empty optional contact email", async () => {
    const post = {
      collaborationPostId: 50n, chapterId: 1n, createdByUserId: 10n,
      collaborationType: "Project", title: "Partner project", description: "Work together",
      eventName: null, eventDate: null, location: null, contactName: null,
      contactEmail: null, contactNumber: null, status: "Open", expiresAt: null,
      createdAt: new Date(), updatedAt: null,
      chapter: { chapterId: 1n, schoolName: "Test School", chapterName: "Test Chapter", acronym: null },
      createdBy: users[0],
    };
    prisma.collaborationPost.create.mockResolvedValue(post);
    prisma.collaborationPost.findUnique.mockResolvedValue(post);
    prisma.collaborationPost.update.mockResolvedValue(post);
    await request(app.getHttpServer()).post("/api/chapter/collaborations").set("Authorization", authorization(10))
      .send({ collaborationType: "Project", title: "Partner project", description: "Work together", contactEmail: "" })
      .expect(201).expect((response) => { expect(response.body.post.contactEmail).toBeNull(); });
    await request(app.getHttpServer()).patch("/api/chapter/collaborations/50").set("Authorization", authorization(10))
      .send({ contactEmail: "" }).expect(200);
    expect(prisma.collaborationPost.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ contactEmail: null }),
    }));
  });

  it("still rejects a malformed nonempty collaboration contact email", async () => {
    await request(app.getHttpServer()).post("/api/chapter/collaborations").set("Authorization", authorization(10))
      .send({ collaborationType: "Project", title: "Partner project", description: "Work together", contactEmail: "not-an-email" })
      .expect(400);
    expect(prisma.collaborationPost.create).not.toHaveBeenCalled();
  });

  it.each([
    ["Open", null, 10, 400],
    ["Closed", null, 20, 400],
    ["Open", new Date("2000-01-01"), 20, 400],
    ["Open", null, 20, 409],
  ])("rejects self, closed, expired or duplicate collaboration responses (%s, %s, user %s)", async (status, expiresAt, userId, expected) => {
    prisma.collaborationPost.findUnique.mockResolvedValue({ collaborationPostId: 50n, chapterId: 1n, status, expiresAt });
    prisma.collaborationResponse.findFirst.mockResolvedValue({ collaborationResponseId: 70n });
    await request(app.getHttpServer()).post("/api/chapter/collaborations/50/responses").set("Authorization", authorization(userId))
      .send({ message: "Interested" }).expect(expected);
  });
});
