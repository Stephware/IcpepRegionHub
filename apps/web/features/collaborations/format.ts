export function formatCollaborationDate(value: string | null) {
  if (!value) {
    return "Not specified";
  }

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

export function collaborationExcerpt(content: string, maxLength = 180) {
  const normalized = content.trim().replace(/\s+/g, " ");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}…`;
}

export function collaborationStatusClass(status: string) {
  switch (status) {
    case "Open":
      return "bg-emerald-50 text-emerald-700";
    case "Expired":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function collaborationChapterLabel(chapter: {
  chapterName: string;
  acronym: string | null;
}) {
  return chapter.acronym
    ? `${chapter.chapterName} (${chapter.acronym})`
    : chapter.chapterName;
}
