import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const chapterSelectSource = readFileSync(
  new URL("../features/chapters/chapter-select.tsx", import.meta.url),
  "utf8",
);
const registerFormSource = readFileSync(
  new URL("../features/auth/register-form.tsx", import.meta.url),
  "utf8",
);

describe("registration chapter select source", () => {
  it("loads chapter choices from the Chapter API and submits chapter IDs", () => {
    expect(chapterSelectSource).toContain("listPublicChapters");
    expect(chapterSelectSource).toContain("value={chapter.chapterId}");
    expect(registerFormSource).toContain("<ChapterSelect");
    expect(registerFormSource).toContain("chapterId");
  });

  it("does not hardcode official school names in the frontend selector", () => {
    expect(chapterSelectSource).not.toMatch(
      /Angeles University Foundation|Bulacan State University - Main Campus|National University Clark/,
    );
  });
});
