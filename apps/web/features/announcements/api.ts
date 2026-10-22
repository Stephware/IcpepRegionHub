import { apiFetch } from "@/lib/api/client";
import type {
  AdminAnnouncement,
  Announcement,
  AnnouncementInput,
  MemberAnnouncement,
} from "./types";

export function listPublicAnnouncements() {
  return apiFetch<Announcement[]>("/announcements");
}

export function getPublicAnnouncement(id: string) {
  return apiFetch<Announcement>(`/announcements/${id}`);
}

export function listMemberAnnouncements() {
  return apiFetch<MemberAnnouncement[]>("/member/announcements");
}

export function getMemberAnnouncement(id: string) {
  return apiFetch<MemberAnnouncement>(`/member/announcements/${id}`);
}

export function listAdminAnnouncements(scope: "admin" | "regional" = "admin") {
  return apiFetch<AdminAnnouncement[]>(`/${scope}/announcements`);
}

export function createAnnouncement(
  input: AnnouncementInput,
  scope: "admin" | "regional" = "admin",
) {
  return apiFetch<{ message: string; announcement: AdminAnnouncement }>(
    `/${scope}/announcements`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function updateAnnouncement(
  id: string,
  input: Partial<AnnouncementInput>,
  scope: "admin" | "regional" = "admin",
) {
  return apiFetch<{ message: string; announcement: AdminAnnouncement }>(
    `/${scope}/announcements/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function setAnnouncementPublished(
  id: string,
  isPublished: boolean,
  scope: "admin" | "regional" = "admin",
) {
  return apiFetch<{ message: string; announcement: AdminAnnouncement }>(
    `/${scope}/announcements/${id}/publish`,
    {
      method: "PATCH",
      body: JSON.stringify({ isPublished }),
    },
  );
}

export function setAnnouncementPinned(id: string, isPinned: boolean) {
  return apiFetch<{ message: string; announcement: AdminAnnouncement }>(
    `/admin/announcements/${id}/pin`,
    {
      method: "PATCH",
      body: JSON.stringify({ isPinned }),
    },
  );
}

export function deleteAnnouncement(
  id: string,
  scope: "admin" | "regional" = "admin",
) {
  return apiFetch<{ message: string }>(`/${scope}/announcements/${id}`, {
    method: "DELETE",
  });
}
