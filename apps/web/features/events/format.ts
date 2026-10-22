import type { EventScope } from "./types";

export function formatEventDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatEventDay(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function eventOrganizerLabel(
  organizer: {
    schoolName?: string;
    chapterName: string;
    acronym: string | null;
  } | null,
  scope?: EventScope,
) {
  if (!organizer) {
    return "ICpEP Region 3";
  }

  if (scope === "Academic") {
    return organizer.schoolName ?? organizer.chapterName;
  }

  return organizer.acronym
    ? `${organizer.chapterName} (${organizer.acronym})`
    : organizer.chapterName;
}

export function isRegistrationOpen(
  deadline: string | null,
  status: string,
  now = new Date(),
) {
  if (status === "Cancelled" || status === "Completed") {
    return false;
  }

  if (!deadline) {
    return true;
  }

  return new Date(deadline).getTime() >= now.getTime();
}

export function eventScopeLabel(scope: EventScope) {
  return scope === "Academic"
    ? "Academic event"
    : scope === "Chapter"
      ? "Chapter-organized event"
      : "Regional event";
}
