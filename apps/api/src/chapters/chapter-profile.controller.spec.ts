import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "@jest/globals";
import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { SessionTokenService } from "../auth/session-token.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { ChaptersModule } from "./chapters.module.js";

const originalChapter = {
  chapterId: 1n,
  schoolName: "Sample University",
  chapterName: "Sample Chapter",
  acronym: "SC",
  officialEmail: "original@example.com",
  contactNumber: "09123456789",
  facebookUrl: "https://facebook.com/sample",
  address: null,
  logoUrl: null,
  status: "Active",
  createdAt: new Date(),
  updatedAt: null,
};
const originalUser = {
  userId: 10n,
  chapterId: 1n,
  firstName: "Ana",
  lastName: "Santos",
  email: "ana@example.com",
  role: "ChapterOfficer",
  isApproved: true,
  isActive: true,
  facultyDesignation: null,
};

describe("chapter profile endpoint", () => {
  let app: INestApplication;
  let token: string;
  let chapter = { ...originalChapter };
  let user: Omit<typeof originalUser, "chapterId"> & {
    chapterId: bigint | null;
  } = { ...originalUser };
  const prisma = {
    user: { findUnique: async () => user },
    chapter: {
      findFirst: async ({
        where,
      }: {
        where: { chapterId: bigint; status?: string };
      }) =>
        where.chapterId === chapter.chapterId &&
        (!where.status || chapter.status === where.status)
          ? chapter
          : null,
      update: async ({ data }: { data: Partial<typeof originalChapter> }) => {
        chapter = {
          ...chapter,
          ...Object.fromEntries(
            Object.entries(data).filter(([, value]) => value !== undefined),
          ),
        };
        return chapter;
      },
    },
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_SECRET:
                "chapter-profile-only-test-secret-at-least-32-characters",
            }),
          ],
        }),
        ChaptersModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    token = module
      .get(SessionTokenService)
      .sign({ sub: "10", role: "ChapterOfficer", chapterId: "1" });
  });
  beforeEach(() => {
    chapter = { ...originalChapter };
    user = { ...originalUser };
  });
  afterAll(async () => {
    await app?.close();
  });

  it("returns only the authenticated chapter's public profile", async () => {
    const response = await request(app.getHttpServer())
      .get("/chapter/profile")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body.chapterId).toBe("1");
    expect(response.body).not.toHaveProperty("status");
    expect(response.body).not.toHaveProperty("createdAt");
  });

  it("updates contact fields, trims input and clears blanks without changing identity", async () => {
    const response = await request(app.getHttpServer())
      .patch("/chapter/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        officialEmail: " new@example.com ",
        contactNumber: " ",
        facebookUrl: " https://facebook.com/new ",
      })
      .expect(200);
    expect(response.body.chapter).toMatchObject({
      chapterId: "1",
      schoolName: originalChapter.schoolName,
      officialEmail: "new@example.com",
      contactNumber: null,
      facebookUrl: "https://facebook.com/new",
    });
    expect(response.body.chapter).not.toHaveProperty("status");
    const saved = await request(app.getHttpServer())
      .get("/chapter/profile")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(saved.body.officialEmail).toBe("new@example.com");
  });

  it("preserves omitted contacts and clears email or social link with blank input", async () => {
    const response = await request(app.getHttpServer())
      .patch("/chapter/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ officialEmail: " ", facebookUrl: "" })
      .expect(200);
    expect(response.body.chapter).toMatchObject({
      officialEmail: null,
      facebookUrl: null,
      contactNumber: originalChapter.contactNumber,
    });
  });

  it.each([
    { chapterId: "2" },
    { schoolName: "Forged identity" },
    { status: "Inactive" },
    { officialEmail: "invalid" },
    { facebookUrl: "javascript:alert(1)" },
    { facebookUrl: "ftp://example.com/file" },
    { facebookUrl: "example.com" },
    { contactNumber: 123 },
    { officialEmail: null },
  ])("rejects invalid or disallowed fields %p", async (body) => {
    await request(app.getHttpServer())
      .patch("/chapter/profile")
      .set("Authorization", `Bearer ${token}`)
      .send(body)
      .expect(400);
    expect(chapter).toEqual(originalChapter);
  });

  it.each(["FacultyRepresentative", "RegionalOfficer", "RegionalAdmin"])(
    "blocks %s from official chapter contact editing",
    async (role) => {
      user.role = role;
      await request(app.getHttpServer())
        .patch("/chapter/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ contactNumber: "123" })
        .expect(403);
    },
  );

  it("requires authentication and a currently approved, active account", async () => {
    await request(app.getHttpServer()).get("/chapter/profile").expect(401);
    user.isApproved = false;
    await request(app.getHttpServer())
      .get("/chapter/profile")
      .set("Authorization", `Bearer ${token}`)
      .expect(401);
    user.isApproved = true;
    user.isActive = false;
    await request(app.getHttpServer())
      .get("/chapter/profile")
      .set("Authorization", `Bearer ${token}`)
      .expect(401);
  });

  it("uses the current stored affiliation and rejects an account without a chapter", async () => {
    user.chapterId = 2n;
    await request(app.getHttpServer())
      .get("/chapter/profile")
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
    user.chapterId = null;
    await request(app.getHttpServer())
      .patch("/chapter/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ contactNumber: "123" })
      .expect(403);
  });

  it("does not allow an inactive affiliated chapter to be viewed or updated", async () => {
    chapter.status = "Inactive";
    await request(app.getHttpServer())
      .get("/chapter/profile")
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
    await request(app.getHttpServer())
      .patch("/chapter/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ contactNumber: "123" })
      .expect(404);
    expect(chapter.contactNumber).toBe(originalChapter.contactNumber);
  });
});
