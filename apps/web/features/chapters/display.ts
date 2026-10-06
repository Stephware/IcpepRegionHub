import type { Chapter } from "./types";

export function chapterDisplayName(
  chapter: Pick<Chapter, "chapterName" | "acronym">,
) {
  return chapter.acronym
    ? `${chapter.chapterName} (${chapter.acronym})`
    : chapter.chapterName;
}
