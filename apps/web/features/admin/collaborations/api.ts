import { apiFetch } from "@/lib/api/client";
import type {
  AdminCollaborationPost,
  AdminCollaborationPostDetails,
} from "./types";

export function listAdminCollaborationPosts() {
  return apiFetch<AdminCollaborationPost[]>("/admin/collaborations");
}

export function getAdminCollaborationPost(postId: string) {
  return apiFetch<AdminCollaborationPostDetails>(
    `/admin/collaborations/${postId}`,
  );
}

export function setAdminCollaborationStatus(
  postId: string,
  status: "Open" | "Closed",
) {
  return apiFetch<{ message: string; post: AdminCollaborationPost }>(
    `/admin/collaborations/${postId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}

export function deleteAdminCollaborationPost(postId: string) {
  return apiFetch<{ message: string }>(
    `/admin/collaborations/${postId}`,
    {
      method: "DELETE",
    },
  );
}
