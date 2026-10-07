import { describe, expect, it } from "vitest";
import {
  chapterDisplayName,
  chapterOptionLabel,
} from "../features/chapters/display";

describe("chapter display", () => {
  it("includes the acronym when one is available", () => {
    expect(
      chapterDisplayName({
        chapterName: "ICpEP.se AUF Chapter",
        acronym: "AUF",
      }),
    ).toBe("ICpEP.se AUF Chapter (AUF)");
  });

  it("uses only the chapter name when no acronym is available", () => {
    expect(
      chapterDisplayName({
        chapterName: "ICpEP.se Sample Chapter",
        acronym: null,
      }),
    ).toBe("ICpEP.se Sample Chapter");
  });

  it("does not repeat the school name for seeded registration options", () => {
    expect(
      chapterOptionLabel({
        schoolName: "Angeles University Foundation",
        chapterName: "Angeles University Foundation",
        acronym: null,
      }),
    ).toBe("Angeles University Foundation");
  });

  it("keeps chapter context when registration option names differ", () => {
    expect(
      chapterOptionLabel({
        schoolName: "Sample University",
        chapterName: "ICpEP.se Sample Chapter",
        acronym: "SAMPLE",
      }),
    ).toBe("ICpEP.se Sample Chapter (SAMPLE) — Sample University");
  });
});
