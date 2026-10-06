import { describe, expect, it } from "vitest";
import { chapterDisplayName } from "../features/chapters/display";

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
});
