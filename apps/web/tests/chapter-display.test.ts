import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OfficerPhoto } from "../features/chapters/officer-photo";
import { describe, expect, it } from "vitest";
import {
  chapterDisplayName,
  chapterOptionLabel,
  officerInitials,
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

describe("officer initials", () => {
  it.each([
    [" Juan Dela Cruz ", "JC"],
    ["Maria", "M"],
    ["", "IC"],
    ["  Ana   Reyes ", "AR"],
  ])("uses a clean placeholder for %s", (name, expected) => {
    expect(officerInitials(name)).toBe(expected);
  });
});

describe("officer photo", () => {
  it("renders configured photos with an accessible name", () => {
    const html = renderToStaticMarkup(
      createElement(OfficerPhoto, {
        fullName: "Juan Dela Cruz",
        photoUrl: "/assets/people/juan.jpg",
      }),
    );
    expect(html).toContain('src="/assets/people/juan.jpg"');
    expect(html).toContain('alt="Juan Dela Cruz"');
  });

  it("renders initials without inventing a photo", () => {
    const html = renderToStaticMarkup(
      createElement(OfficerPhoto, {
        fullName: "Juan Dela Cruz",
        photoUrl: null,
      }),
    );
    expect(html).toContain("JC");
    expect(html).not.toContain("<img");
  });
});
