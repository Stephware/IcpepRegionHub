import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AnnouncementsController } from "../src/announcements/announcements.controller.js";
import { AnnouncementsService } from "../src/announcements/announcements.service.js";

describe("Announcements placeholder (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AnnouncementsController],
      providers: [AnnouncementsService],
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
      .expect({
        module: "announcements",
        status: "ready",
      });
  });
});
