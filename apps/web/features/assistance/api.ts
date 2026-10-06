import { apiFetch } from "@/lib/api/client";
import type {
  AssistancePriority,
  AssistanceRequestDetails,
  AssistanceRequestInput,
  AssistanceRequestSummary,
  AssistanceStatus,
  RegionalAssignee,
  RegionalAssistanceFilters,
  RegionalAssistanceRequestDetails,
  RegionalAssistanceUpdate,
} from "./types";

export function listChapterAssistanceRequests() {
  return apiFetch<AssistanceRequestSummary[]>("/assistance-requests");
}

export function getChapterAssistanceRequest(requestId: string) {
  return apiFetch<AssistanceRequestDetails>(
    `/assistance-requests/${requestId}`,
  );
}

export function createAssistanceRequest(input: AssistanceRequestInput) {
  return apiFetch<{
    message: string;
    request: AssistanceRequestDetails;
  }>("/assistance-requests", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listRegionalAssistanceRequests(
  filters: RegionalAssistanceFilters = {},
) {
  const query = new URLSearchParams();

  if (filters.status) {
    query.set("status", filters.status);
  }

  if (filters.priority) {
    query.set("priority", filters.priority);
  }

  if (filters.chapterId) {
    query.set("chapterId", filters.chapterId);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return apiFetch<AssistanceRequestSummary[]>(
    `/regional/assistance-requests${suffix}`,
  );
}

export function getRegionalAssistanceRequest(requestId: string) {
  return apiFetch<RegionalAssistanceRequestDetails>(
    `/regional/assistance-requests/${requestId}`,
  );
}

export function listRegionalAssignees() {
  return apiFetch<RegionalAssignee[]>(
    "/regional/assistance-requests/assignees",
  );
}

export function assignRegionalAssistanceRequest(
  requestId: string,
  userId: string | null,
) {
  return apiFetch<{
    message: string;
    request: AssistanceRequestSummary;
  }>(`/regional/assistance-requests/${requestId}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ userId }),
  });
}

export function updateRegionalAssistancePriority(
  requestId: string,
  priority: AssistancePriority,
) {
  return apiFetch<{
    message: string;
    request: AssistanceRequestSummary;
  }>(`/regional/assistance-requests/${requestId}/priority`, {
    method: "PATCH",
    body: JSON.stringify({ priority }),
  });
}

export function addRegionalAssistanceUpdate(
  requestId: string,
  message: string,
  isInternalNote: boolean,
) {
  return apiFetch<{
    message: string;
    update: RegionalAssistanceUpdate;
  }>(`/regional/assistance-requests/${requestId}/updates`, {
    method: "POST",
    body: JSON.stringify({ message, isInternalNote }),
  });
}

export function updateRegionalAssistanceStatus(
  requestId: string,
  status: AssistanceStatus,
  message?: string,
) {
  return apiFetch<{
    message: string;
    request: RegionalAssistanceRequestDetails;
  }>(`/regional/assistance-requests/${requestId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      message: message?.trim() || undefined,
    }),
  });
}
