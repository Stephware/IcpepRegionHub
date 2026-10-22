import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAdminAnnouncements,
  setAnnouncementPublished,
  updateAnnouncement,
} from "../features/announcements/api";

afterEach(() => vi.restoreAllMocks());

describe("announcement management requests", () => {
  it("uses the contributor endpoints for regional officers", async () => {
    const paths: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      paths.push(String(url));
      return new Response(JSON.stringify({}), { status: 200 });
    });
    const input = {
      title: "Title",
      content: "Content",
      category: "General",
      visibility: "Public" as const,
    };
    await listAdminAnnouncements("regional");
    await createAnnouncement(input, "regional");
    await updateAnnouncement("12", input, "regional");
    await setAnnouncementPublished("12", true, "regional");
    await deleteAnnouncement("12", "regional");
    expect(
      paths.map((path) => new URL(path, "http://localhost").pathname),
    ).toEqual([
      "/api/regional/announcements",
      "/api/regional/announcements",
      "/api/regional/announcements/12",
      "/api/regional/announcements/12/publish",
      "/api/regional/announcements/12",
    ]);
  });
});
