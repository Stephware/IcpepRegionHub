import { describe, expect, it } from "vitest";
import {
  announcementExcerpt,
  formatAnnouncementDate,
} from "../features/announcements/format";

describe("announcement formatting", () => {
  it("shortens long announcement text", () => {
    const content = "A".repeat(30);

    expect(announcementExcerpt(content, 10)).toBe("AAAAAAAAAA…");
  });

  it("keeps short announcement text unchanged", () => {
    expect(announcementExcerpt("Short update", 30)).toBe("Short update");
  });

  it("identifies missing publication dates", () => {
    expect(formatAnnouncementDate(null)).toBe("Not published");
  });
});
