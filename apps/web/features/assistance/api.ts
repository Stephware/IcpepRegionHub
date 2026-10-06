import { apiFetch } from "@/lib/api/client";
import type {
  AssistanceRequestDetails,
  AssistanceRequestInput,
  AssistanceRequestSummary,
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
