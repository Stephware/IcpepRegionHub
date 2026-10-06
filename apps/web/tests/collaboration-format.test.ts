import { describe, expect, it } from "vitest";
import {
  collaborationChapterLabel,
  collaborationExcerpt,
  collaborationStatusClass,
  formatCollaborationDate,
} from "../features/collaborations/format";

describe("collaboration formatting", () => {
  it("shows the chapter acronym when available", () => {
    expect(
      collaborationChapterLabel({
        chapterName: "ICpEP.se Sample Chapter",
        acronym: "SAMPLE",
      }),
    ).toBe("ICpEP.se Sample Chapter (SAMPLE)");
  });

  it("shortens long collaboration descriptions", () => {
    expect(collaborationExcerpt("A".repeat(30), 10)).toBe("AAAAAAAAAA…");
  });

  it("uses an open style for active posts", () => {
    expect(collaborationStatusClass("Open")).toContain("text-emerald-700");
  });

  it("identifies a missing event date", () => {
    expect(formatCollaborationDate(null)).toBe("Not specified");
  });
});
