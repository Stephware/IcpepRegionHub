import { apiFetch } from "@/lib/api/client";
import type { AdminEvent, EventInput, EventItem } from "./types";

export function listPublicEvents() {
  return apiFetch<EventItem[]>("/events");
}

export function getPublicEvent(eventId: string) {
  return apiFetch<EventItem>(`/events/${eventId}`);
}

export function listAdminEvents() {
  return apiFetch<AdminEvent[]>("/admin/events");
}

export function createEvent(input: EventInput) {
  return apiFetch<{ message: string; event: AdminEvent }>("/admin/events", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateEvent(eventId: string, input: Partial<EventInput>) {
  return apiFetch<{ message: string; event: AdminEvent }>(
    `/admin/events/${eventId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function setEventPublished(eventId: string, isPublished: boolean) {
  return apiFetch<{ message: string; event: AdminEvent }>(
    `/admin/events/${eventId}/publish`,
    {
      method: "PATCH",
      body: JSON.stringify({ isPublished }),
    },
  );
}

export function setEventCancelled(eventId: string, isCancelled: boolean) {
  return apiFetch<{ message: string; event: AdminEvent }>(
    `/admin/events/${eventId}/cancel`,
    {
      method: "PATCH",
      body: JSON.stringify({ isCancelled }),
    },
  );
}

export function deleteEvent(eventId: string) {
  return apiFetch<{ message: string }>(`/admin/events/${eventId}`, {
    method: "DELETE",
  });
}
