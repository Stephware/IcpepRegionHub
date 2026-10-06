import { apiFetch } from "@/lib/api/client";
import type {
  AdminChapter,
  AdminChapterOfficer,
  Chapter,
  ChapterInput,
  ChapterOfficer,
  ChapterOfficerInput,
} from "./types";

export function listPublicChapters() {
  return apiFetch<Chapter[]>("/chapters");
}

export function getPublicChapter(chapterId: string) {
  return apiFetch<Chapter>(`/chapters/${chapterId}`);
}

export function listCurrentChapterOfficers(chapterId: string) {
  return apiFetch<ChapterOfficer[]>(`/chapters/${chapterId}/officers`);
}

export function listAdminChapters() {
  return apiFetch<AdminChapter[]>("/admin/chapters");
}

export function getAdminChapter(chapterId: string) {
  return apiFetch<AdminChapter>(`/admin/chapters/${chapterId}`);
}

export function createChapter(input: ChapterInput) {
  return apiFetch<{ message: string; chapter: AdminChapter }>(
    "/admin/chapters",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function updateChapter(chapterId: string, input: Partial<ChapterInput>) {
  return apiFetch<{ message: string; chapter: AdminChapter }>(
    `/admin/chapters/${chapterId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function updateChapterStatus(
  chapterId: string,
  status: "Active" | "Inactive",
) {
  return apiFetch<{ message: string; chapter: AdminChapter }>(
    `/admin/chapters/${chapterId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}

export function listAdminChapterOfficers(chapterId: string) {
  return apiFetch<AdminChapterOfficer[]>(
    `/admin/chapters/${chapterId}/officers`,
  );
}

export function createChapterOfficer(
  chapterId: string,
  input: ChapterOfficerInput,
) {
  return apiFetch<{ message: string; officer: AdminChapterOfficer }>(
    `/admin/chapters/${chapterId}/officers`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function updateChapterOfficer(
  chapterId: string,
  officerId: string,
  input: Partial<ChapterOfficerInput>,
) {
  return apiFetch<{ message: string; officer: AdminChapterOfficer }>(
    `/admin/chapters/${chapterId}/officers/${officerId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function setChapterOfficerCurrent(
  chapterId: string,
  officerId: string,
  isCurrent: boolean,
) {
  return apiFetch<{ message: string; officer: AdminChapterOfficer }>(
    `/admin/chapters/${chapterId}/officers/${officerId}/current`,
    {
      method: "PATCH",
      body: JSON.stringify({ isCurrent }),
    },
  );
}
