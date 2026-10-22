import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import type { PrismaClient } from "../src/generated/prisma/client.js";

export const DEMO_DATABASE_MARKER = "icpep-region3-hub:disposable-demo";
const scrypt = promisify(scryptCallback);
// Stable IDs keep reruns from duplicating records whose titles were edited in the UI.
const ID = 9_000_000_000_000n;

export function getDemoConfig(env: NodeJS.ProcessEnv) {
  if (env.NODE_ENV !== "development" || env.DEMO_SEED_ENABLED !== "true") {
    throw new Error(
      "Demo seed requires NODE_ENV=development and DEMO_SEED_ENABLED=true.",
    );
  }
  const databaseName = env.DEMO_DATABASE_NAME;
  if (
    !databaseName ||
    !/^[a-z][a-z0-9_]*_disposable_demo$/.test(databaseName)
  ) {
    throw new Error(
      "DEMO_DATABASE_NAME must explicitly name a *_disposable_demo database.",
    );
  }
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL URL.");
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    decodeURIComponent(url.pathname.slice(1)) !== databaseName ||
    [...url.searchParams].some(
      ([key, value]) => key !== "schema" || value !== "public",
    )
  ) {
    throw new Error(
      "Demo seed only accepts the named local disposable database with the public schema.",
    );
  }
  const password = env.DEMO_SEED_PASSWORD;
  if (!password || password.length < 8 || password.length > 128) {
    throw new Error(
      "Set DEMO_SEED_PASSWORD to 8–128 characters in your local environment.",
    );
  }
  return { databaseUrl, databaseName, password };
}

export async function hashDemoPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${key.toString("hex")}`;
}

export function buildDemoRecords(
  chapters: { auf: bigint; bulacan: bigint },
  passwordHash: string,
  now: Date,
) {
  const later = (days: number) => new Date(now.getTime() + days * 86_400_000);
  const users = [
    {
      userId: ID + 1n,
      email: "admin@hub-demo.test",
      lastName: "Admin",
      role: "RegionalAdmin",
      chapterId: null,
      isApproved: true,
    },
    {
      userId: ID + 2n,
      email: "regional@hub-demo.test",
      lastName: "Regional Officer",
      role: "RegionalOfficer",
      chapterId: null,
      isApproved: true,
    },
    {
      userId: ID + 3n,
      email: "auf@hub-demo.test",
      lastName: "AUF Officer",
      role: "ChapterOfficer",
      chapterId: chapters.auf,
      isApproved: true,
    },
    {
      userId: ID + 4n,
      email: "bulacan@hub-demo.test",
      lastName: "Bulacan Officer",
      role: "ChapterOfficer",
      chapterId: chapters.bulacan,
      isApproved: true,
    },
    {
      userId: ID + 5n,
      email: "pending@hub-demo.test",
      lastName: "Pending Officer",
      role: "ChapterOfficer",
      chapterId: chapters.auf,
      isApproved: false,
    },
    {
      userId: ID + 6n,
      email: "faculty@hub-demo.test",
      lastName: "Faculty Representative",
      role: "FacultyRepresentative",
      chapterId: chapters.auf,
      facultyDesignation: "Faculty Adviser",
      isApproved: true,
    },
  ].map((user) => ({
    ...user,
    firstName: "Demo",
    passwordHash,
    isActive: true,
  }));
  const [admin, regional, auf, bulacan] = users;
  const faculty = users[5];
  const announcements = [
    {
      title: "[DEMO] Region 3 walkthrough welcome",
      visibility: "Public",
      isPublished: true,
      isPinned: true,
      content:
        "DEMO DATA — Fictional welcome for the local walkthrough. This is not an official ICpEP announcement.",
    },
    {
      title: "[DEMO] Chapter project showcase",
      visibility: "Public",
      isPublished: true,
      isPinned: false,
      content:
        "DEMO DATA — Fictional showcase invitation. Explore the sample events and chapter directory.",
    },
    {
      title: "[DEMO] Officer coordination briefing",
      visibility: "MembersOnly",
      isPublished: true,
      isPinned: false,
      content:
        "DEMO DATA — Fictional member-only briefing. Approved officers can read this; public visitors cannot.",
    },
    {
      title: "[DEMO] Draft regional advisory",
      visibility: "Public",
      isPublished: false,
      isPinned: false,
      content:
        "DEMO DATA — Edit and publish this fictional draft during the walkthrough.",
    },
  ].map((item, index) => ({
    ...item,
    announcementId: ID + 101n + BigInt(index),
    category: "Demo",
    createdByUserId: admin.userId,
    publishedAt: item.isPublished ? now : null,
  }));
  const events = [
    {
      title: "[DEMO] Regional engineering showcase",
      organizerChapterId: null,
      scope: "Regional",
      isPublished: true,
    },
    {
      title: "[DEMO] AUF peer learning workshop",
      organizerChapterId: chapters.auf,
      scope: "Chapter",
      isPublished: true,
    },
    {
      title: "[DEMO] Bulacan project exchange draft",
      organizerChapterId: chapters.bulacan,
      scope: "Chapter",
      isPublished: false,
    },
    {
      title: "[DEMO] Faculty academic research seminar",
      organizerChapterId: chapters.auf,
      scope: "Academic",
      isPublished: true,
    },
  ].map((item, index) => ({
    ...item,
    eventId: ID + 201n + BigInt(index),
    description:
      "DEMO DATA — Fictional local walkthrough activity. No real registration or event is scheduled.",
    eventType: "Workshop",
    venue: "[DEMO] Fictional training room",
    startDateTime: later(14 + index * 7),
    endDateTime: later(14 + index * 7 + 0.125),
    registrationDeadline: later(12 + index * 7),
    registrationLink: "https://hub-demo.test/registration",
    status: "Upcoming",
    publishedAt: item.isPublished ? now : null,
    createdByUserId: item.scope === "Academic" ? faculty.userId : admin.userId,
  }));
  const officers = [auf, bulacan].map((user, index) => ({
    chapterOfficerId: ID + 301n + BigInt(index),
    chapterId: user.chapterId!,
    userId: user.userId,
    fullName: `Demo ${index === 0 ? "AUF" : "Bulacan"} Officer (fictional)`,
    position: "[DEMO] Chapter President",
    email: user.email,
    academicYear: `${now.getUTCFullYear()}-${now.getUTCFullYear() + 1}`,
    photoUrl: null,
    isCurrent: true,
  }));
  const requests = [
    {
      subject: "[DEMO] Workshop resource guidance",
      chapterId: chapters.auf,
      submittedByUserId: auf.userId,
      category: "Events",
      priority: "Normal",
      status: "Submitted",
      assignedToUserId: null,
      resolvedAt: null,
    },
    {
      subject: "[DEMO] Chapter membership coordination",
      chapterId: chapters.bulacan,
      submittedByUserId: bulacan.userId,
      category: "Membership",
      priority: "Urgent",
      status: "In Progress",
      assignedToUserId: regional.userId,
      resolvedAt: null,
    },
    {
      subject: "[DEMO] Project presentation support",
      chapterId: chapters.auf,
      submittedByUserId: auf.userId,
      category: "Technical",
      priority: "High",
      status: "Resolved",
      assignedToUserId: regional.userId,
      resolvedAt: now,
    },
  ].map((item, index) => ({
    ...item,
    assistanceRequestId: ID + 401n + BigInt(index),
    ticketCode: `DEMO-R3-00${index + 1}`,
    description:
      "DEMO DATA — Fictional assistance request for demonstrating regional support. No real chapter concern is represented.",
  }));
  const updates = [
    {
      assistanceRequestId: requests[0].assistanceRequestId,
      message:
        "[DEMO] Request received. The regional team will review the sample workshop requirements.",
      isInternalNote: false,
      newStatus: null,
    },
    {
      assistanceRequestId: requests[1].assistanceRequestId,
      message:
        "[DEMO] Membership requirements are under review; coordination is in progress.",
      isInternalNote: false,
      newStatus: "In Progress",
    },
    {
      assistanceRequestId: requests[1].assistanceRequestId,
      message:
        "[DEMO] INTERNAL: verify the sample membership checklist before replying. This note must remain regional-only.",
      isInternalNote: true,
      newStatus: null,
    },
    {
      assistanceRequestId: requests[2].assistanceRequestId,
      message:
        "[DEMO] Sample presentation guidance provided; request resolved.",
      isInternalNote: false,
      newStatus: "Resolved",
    },
  ].map((item, index) => ({
    ...item,
    updateId: ID + 501n + BigInt(index),
    userId: regional.userId,
  }));
  const posts = [
    {
      title: "[DEMO] AUF seeks peer workshop partners",
      chapterId: chapters.auf,
      createdByUserId: auf.userId,
      status: "Open",
      expiresAt: later(30),
    },
    {
      title: "[DEMO] Bulacan invites project exchange",
      chapterId: chapters.bulacan,
      createdByUserId: bulacan.userId,
      status: "Open",
      expiresAt: later(40),
    },
    {
      title: "[DEMO] Completed AUF mentoring invitation",
      chapterId: chapters.auf,
      createdByUserId: auf.userId,
      status: "Closed",
      expiresAt: null,
    },
  ].map((item, index) => ({
    ...item,
    collaborationPostId: ID + 601n + BigInt(index),
    collaborationType: "Peer Learning",
    description:
      "DEMO DATA — Fictional collaboration opportunity. Use it to demonstrate cross-chapter responses and moderation.",
    contactEmail: item.chapterId === chapters.auf ? auf.email : bulacan.email,
  }));
  const responses = [
    {
      collaborationPostId: posts[0].collaborationPostId,
      chapterId: chapters.bulacan,
      userId: bulacan.userId,
      status: "Pending",
      message:
        "[DEMO] Bulacan would like to join this fictional peer workshop. Review, accept, decline, or withdraw this response.",
    },
    {
      collaborationPostId: posts[1].collaborationPostId,
      chapterId: chapters.auf,
      userId: auf.userId,
      status: "Accepted",
      message:
        "[DEMO] AUF has joined this fictional project exchange. This response demonstrates an accepted collaboration.",
    },
  ].map((item, index) => ({
    ...item,
    collaborationResponseId: ID + 701n + BigInt(index),
  }));
  return {
    users,
    announcements,
    events,
    officers,
    requests,
    updates,
    posts,
    responses,
  };
}

export async function preserveDemoRecord<T extends object>(
  existing: T | null,
  identity: Partial<T>,
  create: () => Promise<T>,
) {
  if (!existing) return create();
  for (const key of Object.keys(identity) as (keyof T)[]) {
    if (existing[key] !== identity[key])
      throw new Error(
        "Demo record identity conflicts with existing data; nothing was overwritten.",
      );
  }
  return existing;
}

export async function seedDemoDatabase(
  prisma: PrismaClient,
  config: ReturnType<typeof getDemoConfig>,
) {
  const passwordHash = await hashDemoPassword(config.password);
  return prisma.$transaction(
    async (tx) => {
      const [database] = await tx.$queryRaw<
        { name: string; marker: string | null }[]
      >`
      SELECT current_database() AS name, shobj_description(oid, 'pg_database') AS marker
      FROM pg_database WHERE datname = current_database()
    `;
      if (
        database?.name !== config.databaseName ||
        database.marker !== DEMO_DATABASE_MARKER
      ) {
        throw new Error(
          `Database must be explicitly marked with COMMENT ON DATABASE ... IS '${DEMO_DATABASE_MARKER}'.`,
        );
      }
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(76423201)`;
      const chapters = await tx.chapter.findMany({
        where: {
          schoolName: {
            in: [
              "Angeles University Foundation",
              "Bulacan State University - Main Campus",
            ],
          },
        },
      });
      const auf = chapters.filter(
        (chapter) => chapter.schoolName === "Angeles University Foundation",
      );
      const bulacan = chapters.filter(
        (chapter) =>
          chapter.schoolName === "Bulacan State University - Main Campus",
      );
      if (
        auf.length !== 1 ||
        bulacan.length !== 1 ||
        [...auf, ...bulacan].some((chapter) => chapter.status !== "Active")
      ) {
        throw new Error(
          "Run the official db:seed on the demo database first; exactly one active AUF and Bulacan Main chapter is required.",
        );
      }
      const data = buildDemoRecords(
        { auf: auf[0].chapterId, bulacan: bulacan[0].chapterId },
        passwordHash,
        new Date(),
      );
      for (const user of data.users) {
        const emails = await tx.user.findMany({
          where: { email: { equals: user.email, mode: "insensitive" } },
        });
        if (emails.some((match) => match.userId !== user.userId))
          throw new Error(
            "Demo email already belongs to another account; nothing was overwritten.",
          );
        await preserveDemoRecord(
          await tx.user.findUnique({ where: { userId: user.userId } }),
          { email: user.email, firstName: "Demo" },
          () => tx.user.create({ data: user }),
        );
      }
      for (const item of data.officers)
        await preserveDemoRecord(
          await tx.chapterOfficer.findUnique({
            where: { chapterOfficerId: item.chapterOfficerId },
          }),
          { userId: item.userId },
          () => tx.chapterOfficer.create({ data: item }),
        );
      for (const item of data.announcements)
        await preserveDemoRecord(
          await tx.announcement.findUnique({
            where: { announcementId: item.announcementId },
          }),
          { createdByUserId: item.createdByUserId },
          () => tx.announcement.create({ data: item }),
        );
      for (const item of data.events)
        await preserveDemoRecord(
          await tx.event.findUnique({ where: { eventId: item.eventId } }),
          { createdByUserId: item.createdByUserId },
          () => tx.event.create({ data: item }),
        );
      for (const item of data.requests)
        await preserveDemoRecord(
          await tx.assistanceRequest.findUnique({
            where: { assistanceRequestId: item.assistanceRequestId },
          }),
          { submittedByUserId: item.submittedByUserId },
          () => tx.assistanceRequest.create({ data: item }),
        );
      for (const item of data.updates)
        await preserveDemoRecord(
          await tx.assistanceRequestUpdate.findUnique({
            where: { updateId: item.updateId },
          }),
          {
            assistanceRequestId: item.assistanceRequestId,
            userId: item.userId,
          },
          () => tx.assistanceRequestUpdate.create({ data: item }),
        );
      for (const item of data.posts)
        await preserveDemoRecord(
          await tx.collaborationPost.findUnique({
            where: { collaborationPostId: item.collaborationPostId },
          }),
          { createdByUserId: item.createdByUserId },
          () => tx.collaborationPost.create({ data: item }),
        );
      for (const item of data.responses)
        await preserveDemoRecord(
          (await tx.collaborationResponse.findUnique({
            where: {
              collaborationPostId_chapterId: {
                collaborationPostId: item.collaborationPostId,
                chapterId: item.chapterId,
              },
            },
          })) ??
            (await tx.collaborationResponse.findUnique({
              where: { collaborationResponseId: item.collaborationResponseId },
            })),
          {
            collaborationPostId: item.collaborationPostId,
            chapterId: item.chapterId,
            userId: item.userId,
          },
          () => tx.collaborationResponse.create({ data: item }),
        );
      for (const [index, chapter] of [auf[0], bulacan[0]].entries()) {
        await tx.chapter.update({
          where: { chapterId: chapter.chapterId },
          data: {
            officialEmail:
              chapter.officialEmail ??
              `${index === 0 ? "auf" : "bulacan"}-chapter@hub-demo.test`,
            address:
              chapter.address ??
              "[DEMO] Fictional chapter coordination desk — not an official campus address.",
          },
        });
      }
      return {
        users: data.users.length,
        announcements: data.announcements.length,
        events: data.events.length,
        requests: data.requests.length,
        posts: data.posts.length,
        responses: data.responses.length,
      };
    },
    { timeout: 30_000 },
  );
}
