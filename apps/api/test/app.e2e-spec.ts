import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AnnouncementsController } from "../src/announcements/announcements.controller.js";
import { AnnouncementsService } from "../src/announcements/announcements.service.js";
import { AuthController } from "../src/auth/auth.controller.js";
import { AuthService } from "../src/auth/auth.service.js";
import { SessionTokenService } from "../src/auth/session-token.service.js";

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
