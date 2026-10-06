import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AnnouncementsController } from "../src/announcements/announcements.controller.js";
import { AnnouncementsService } from "../src/announcements/announcements.service.js";

describe("Announcements API (e2e)", () => {
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AnnouncementsController],
      providers: [
        {
          provide: AnnouncementsService,
          useValue: announcementsService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("/api/announcements (GET)", () => {
    return request(app.getHttpServer())
      .get("/api/announcements")
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
        expect(response.body[0].title).toBe("Regional Update");
      });
  });
});
