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

export function listAdminAnnouncements() {
  return apiFetch<AdminAnnouncement[]>("/admin/announcements");
}

export function createAnnouncement(input: AnnouncementInput) {
  return apiFetch<{ message: string; announcement: AdminAnnouncement }>(
    "/admin/announcements",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function updateAnnouncement(
  id: string,
  input: Partial<AnnouncementInput>,
) {
  return apiFetch<{ message: string; announcement: AdminAnnouncement }>(
    `/admin/announcements/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function setAnnouncementPublished(id: string, isPublished: boolean) {
  return apiFetch<{ message: string; announcement: AdminAnnouncement }>(
    `/admin/announcements/${id}/publish`,
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

export function deleteAnnouncement(id: string) {
  return apiFetch<{ message: string }>(`/admin/announcements/${id}`, {
    method: "DELETE",
  });
}
