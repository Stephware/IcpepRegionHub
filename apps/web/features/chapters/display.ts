import type { Chapter } from "./types";

export function chapterDisplayName(
  chapter: Pick<Chapter, "chapterName" | "acronym">,
) {
  return chapter.acronym
    ? `${chapter.chapterName} (${chapter.acronym})`
    : chapter.chapterName;
}

export function chapterOptionLabel(
  chapter: Pick<Chapter, "schoolName" | "chapterName" | "acronym">,
) {
  const displayName = chapterDisplayName(chapter);

  return normalizeLabel(displayName) === normalizeLabel(chapter.schoolName)
    ? chapter.schoolName
    : `${displayName} — ${chapter.schoolName}`;
}

function normalizeLabel(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

export function officerInitials(fullName: string) {
  const names = fullName.trim().split(/\s+/).filter(Boolean);
  if (!names.length) return "IC";
  return `${names[0][0]}${names.length > 1 ? names[names.length - 1][0] : ""}`.toLocaleUpperCase(
    "en-US",
  );
}
