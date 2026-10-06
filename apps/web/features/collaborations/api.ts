import { apiFetch } from "@/lib/api/client";
import type {
  CollaborationPost,
  CollaborationPostInput,
} from "./types";

export function listOpenCollaborationPosts(type?: string) {
  const query = type?.trim()
    ? `?type=${encodeURIComponent(type.trim())}`
    : "";

  return apiFetch<CollaborationPost[]>(`/collaborations${query}`);
}

export function getOpenCollaborationPost(postId: string) {
  return apiFetch<CollaborationPost>(`/collaborations/${postId}`);
}

export function listMyCollaborationPosts() {
  return apiFetch<CollaborationPost[]>("/chapter/collaborations");
}

export function getMyCollaborationPost(postId: string) {
  return apiFetch<CollaborationPost>(
    `/chapter/collaborations/${postId}`,
  );
}

export function createCollaborationPost(input: CollaborationPostInput) {
  return apiFetch<{ message: string; post: CollaborationPost }>(
    "/chapter/collaborations",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function updateCollaborationPost(
  postId: string,
  input: Partial<CollaborationPostInput>,
) {
  return apiFetch<{ message: string; post: CollaborationPost }>(
    `/chapter/collaborations/${postId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function closeCollaborationPost(postId: string) {
  return apiFetch<{ message: string; post: CollaborationPost }>(
    `/chapter/collaborations/${postId}/close`,
    {
      method: "PATCH",
    },
  );
}

export function deleteCollaborationPost(postId: string) {
  return apiFetch<{ message: string }>(
    `/chapter/collaborations/${postId}`,
    {
      method: "DELETE",
    },
  );
}
