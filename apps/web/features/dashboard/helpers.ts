import type { MemberAnnouncement } from "@/features/announcements/types";
import type { AssistanceRequestSummary } from "@/features/assistance/types";
import type { CollaborationPost } from "@/features/collaborations/types";
import type { EventItem } from "@/features/events/types";

export function recentAnnouncements(
  announcements: MemberAnnouncement[],
  limit = 3,
) {
  return [...announcements]
    .sort(
      (left, right) =>
        new Date(right.publishedAt ?? 0).getTime() -
        new Date(left.publishedAt ?? 0).getTime(),
    )
    .slice(0, limit);
}

export function upcomingEvents(events: EventItem[], limit = 3) {
  return [...events]
    .filter(
      (event) =>
        event.status === "Upcoming" || event.status === "Ongoing",
    )
    .sort(
      (left, right) =>
        new Date(left.startDateTime).getTime() -
        new Date(right.startDateTime).getTime(),
    )
    .slice(0, limit);
}

export function recentCollaborations(
  collaborations: CollaborationPost[],
  limit = 3,
) {
  return [...collaborations]
    .filter((post) => post.status === "Open")
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    )
    .slice(0, limit);
}

export function openAssistanceCount(
  requests: AssistanceRequestSummary[],
) {
  return requests.filter(
    (request) =>
      request.status !== "Resolved" && request.status !== "Closed",
  ).length;
}

export function assignedAssistanceCount(
  requests: AssistanceRequestSummary[],
  userId: string,
) {
  return requests.filter(
    (request) =>
      request.assignedTo?.userId === userId &&
      request.status !== "Resolved" &&
      request.status !== "Closed",
  ).length;
}

export function urgentAssistanceCount(
  requests: AssistanceRequestSummary[],
) {
  return requests.filter(
    (request) =>
      request.priority === "Urgent" &&
      request.status !== "Resolved" &&
      request.status !== "Closed",
  ).length;
}
