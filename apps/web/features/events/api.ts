import { apiFetch } from "@/lib/api/client";
import type { AdminEvent, EventInput, EventItem } from "./types";

export function listPublicEvents() {
  return apiFetch<EventItem[]>("/events");
}

export function getPublicEvent(eventId: string) {
  return apiFetch<EventItem>(`/events/${eventId}`);
}

export function listAdminEvents(base = "/admin/events") {
  return apiFetch<AdminEvent[]>(base);
}

export function createEvent(input: EventInput, base = "/admin/events") {
  return apiFetch<{ message: string; event: AdminEvent }>(base, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateEvent(
  eventId: string,
  input: Partial<EventInput>,
  base = "/admin/events",
) {
  return apiFetch<{ message: string; event: AdminEvent }>(
    `${base}/${eventId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function setEventPublished(
  eventId: string,
  isPublished: boolean,
  base = "/admin/events",
) {
  return apiFetch<{ message: string; event: AdminEvent }>(
    `${base}/${eventId}/publish`,
    {
      method: "PATCH",
      body: JSON.stringify({ isPublished }),
    },
  );
}

export function setEventCancelled(
  eventId: string,
  isCancelled: boolean,
  base = "/admin/events",
) {
  return apiFetch<{ message: string; event: AdminEvent }>(
    `${base}/${eventId}/cancel`,
    {
      method: "PATCH",
      body: JSON.stringify({ isCancelled }),
    },
  );
}

export function deleteEvent(eventId: string, base = "/admin/events") {
  return apiFetch<{ message: string }>(`${base}/${eventId}`, {
    method: "DELETE",
  });
}
