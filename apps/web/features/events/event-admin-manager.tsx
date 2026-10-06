"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { listPublicChapters } from "@/features/chapters/api";
import type { Chapter } from "@/features/chapters/types";
import {
  createEvent,
  deleteEvent,
  listAdminEvents,
  setEventCancelled,
  setEventPublished,
  updateEvent,
} from "./api";
import { eventOrganizerLabel, formatEventDateTime } from "./format";
import type { AdminEvent, EventInput } from "./types";

const emptyForm: EventInput = {
  title: "",
  description: "",
  eventType: "",
  organizerChapterId: null,
  venue: "",
  startDateTime: "",
  endDateTime: null,
  registrationDeadline: null,
  registrationLink: "",
  coverImageUrl: "",
};

function toLocalInput(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function toIsoOrNull(value: string | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

export function EventAdminManager() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selected, setSelected] = useState<AdminEvent | null>(null);
  const [form, setForm] = useState<EventInput>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadEvents = useCallback(async () => {
    const items = await listAdminEvents();
    setEvents(items);
    return items;
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([listAdminEvents(), listPublicChapters()])
      .then(([eventItems, chapterItems]) => {
        if (!cancelled) {
          setEvents(eventItems);
          setChapters(chapterItems);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load event management.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function updateField<K extends keyof EventInput>(
    field: K,
    value: EventInput[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function showError(requestError: unknown, fallback: string) {
    setError(requestError instanceof Error ? requestError.message : fallback);
    setNotice("");
  }

  function startCreate() {
    setSelected(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
  }

  function selectEvent(event: AdminEvent) {
    setSelected(event);
    setForm({
      title: event.title,
      description: event.description ?? "",
      eventType: event.eventType,
      organizerChapterId: event.organizerChapterId,
      venue: event.venue ?? "",
      startDateTime: toLocalInput(event.startDateTime),
      endDateTime: toLocalInput(event.endDateTime) || null,
      registrationDeadline: toLocalInput(event.registrationDeadline) || null,
      registrationLink: event.registrationLink ?? "",
      coverImageUrl: event.coverImageUrl ?? "",
    });
    setError("");
    setNotice("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload: EventInput = {
        ...form,
        organizerChapterId: form.organizerChapterId || null,
        startDateTime: new Date(form.startDateTime).toISOString(),
        endDateTime: toIsoOrNull(form.endDateTime),
        registrationDeadline: toIsoOrNull(form.registrationDeadline),
      };

      const result = selected
        ? await updateEvent(selected.eventId, payload)
        : await createEvent(payload);

      setSelected(result.event);
      setNotice(result.message);
      await loadEvents();
    } catch (requestError) {
      showError(requestError, "Unable to save event.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(event: AdminEvent) {
    setError("");
    setNotice("");

    try {
      const result = await setEventPublished(
        event.eventId,
        !event.isPublished,
      );
      setSelected(result.event);
      setNotice(result.message);
      await loadEvents();
    } catch (requestError) {
      showError(requestError, "Unable to change publication status.");
    }
  }

  async function toggleCancelled(event: AdminEvent) {
    setError("");
    setNotice("");

    try {
      const result = await setEventCancelled(
        event.eventId,
        event.storedStatus !== "Cancelled",
      );
      setSelected(result.event);
      setNotice(result.message);
      await loadEvents();
    } catch (requestError) {
      showError(requestError, "Unable to change event status.");
    }
  }

  async function removeEvent(event: AdminEvent) {
    if (!window.confirm(`Delete "${event.title}"? This action cannot be undone.`)) {
      return;
    }

    setError("");
    setNotice("");

    try {
      const result = await deleteEvent(event.eventId);
      setSelected(null);
      setForm(emptyForm);
      setNotice(result.message);
      await loadEvents();
    } catch (requestError) {
      showError(requestError, "Unable to delete event.");
    }
  }

  if (loading) {
    return <p className="mt-8 text-sm text-slate-600">Loading events...</p>;
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white"
          onClick={startCreate}
          type="button"
        >
          New event
        </button>

        <div className="mt-4 space-y-2">
          {events.length ? (
            events.map((event) => (
              <button
                className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                  selected?.eventId === event.eventId
                    ? "border-teal-300 bg-teal-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
                key={event.eventId}
                onClick={() => selectEvent(event)}
                type="button"
              >
                <span className="block truncate text-sm font-medium text-slate-950">
                  {event.title}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {formatEventDateTime(event.startDateTime)}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {eventOrganizerLabel(event.organizer)}
                </span>
                <span className="mt-2 flex flex-wrap gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      event.isPublished
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {event.isPublished ? "Published" : "Draft"}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      event.status === "Cancelled"
                        ? "bg-red-50 text-red-700"
                        : "bg-teal-50 text-teal-700"
                    }`}
                  >
                    {event.status}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <p className="py-4 text-sm text-slate-500">
              No events have been created yet.
            </p>
          )}
        </div>
      </aside>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {error ? (
          <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="mb-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {notice}
          </p>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              {selected ? "Edit event" : "Create event"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Events start as drafts and become public after publishing.
            </p>
          </div>

          {selected ? (
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
                disabled={
                  !selected.isPublished &&
                  selected.storedStatus === "Cancelled"
                }
                onClick={() => void togglePublished(selected)}
                type="button"
              >
                {selected.isPublished ? "Unpublish" : "Publish"}
              </button>
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                onClick={() => void toggleCancelled(selected)}
                type="button"
              >
                {selected.storedStatus === "Cancelled" ? "Restore" : "Cancel event"}
              </button>
              <button
                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700"
                onClick={() => void removeEvent(selected)}
                type="button"
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>

        {selected ? (
          <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              Status:{" "}
              <span className="font-medium text-slate-900">
                {selected.status}
              </span>{" "}
              · {selected.isPublished ? "Published" : "Draft"}
            </p>
            <p className="mt-1">
              Organizer: {eventOrganizerLabel(selected.organizer)}
            </p>
          </div>
        ) : null}

        <form
          className="mt-6 grid gap-5 sm:grid-cols-2"
          onSubmit={handleSubmit}
        >
          <div className="sm:col-span-2">
            <Field
              label="Event title"
              onChange={(value) => updateField("title", value)}
              required
              value={form.title}
            />
          </div>

          <Field
            label="Event type"
            onChange={(value) => updateField("eventType", value)}
            placeholder="Assembly, Seminar, Competition..."
            required
            value={form.eventType}
          />

          <label className="text-sm font-medium text-slate-800">
            Organizer
            <select
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-700"
              onChange={(event) =>
                updateField("organizerChapterId", event.target.value || null)
              }
              value={form.organizerChapterId ?? ""}
            >
              <option value="">ICpEP Region 3</option>
              {chapters.map((chapter) => (
                <option key={chapter.chapterId} value={chapter.chapterId}>
                  {chapter.chapterName}
                  {chapter.acronym ? ` (${chapter.acronym})` : ""}
                </option>
              ))}
            </select>
          </label>

          <Field
            label="Start"
            onChange={(value) => updateField("startDateTime", value)}
            required
            type="datetime-local"
            value={form.startDateTime}
          />
          <Field
            label="End"
            onChange={(value) => updateField("endDateTime", value || null)}
            type="datetime-local"
            value={form.endDateTime ?? ""}
          />
          <Field
            label="Venue"
            onChange={(value) => updateField("venue", value)}
            value={form.venue ?? ""}
          />
          <Field
            label="Registration deadline"
            onChange={(value) =>
              updateField("registrationDeadline", value || null)
            }
            type="datetime-local"
            value={form.registrationDeadline ?? ""}
          />
          <Field
            label="Registration link"
            onChange={(value) => updateField("registrationLink", value)}
            value={form.registrationLink ?? ""}
          />
          <Field
            label="Cover image URL"
            onChange={(value) => updateField("coverImageUrl", value)}
            value={form.coverImageUrl ?? ""}
          />

          <label className="text-sm font-medium text-slate-800 sm:col-span-2">
            Description
            <textarea
              className="mt-2 min-h-48 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-700"
              onChange={(event) => updateField("description", event.target.value)}
              value={form.description ?? ""}
            />
          </label>

          <div className="sm:col-span-2">
            <button
              className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              disabled={saving || !form.startDateTime}
              type="submit"
            >
              {saving
                ? "Saving..."
                : selected
                  ? "Save changes"
                  : "Create draft"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange(value: string): void;
  type?: string;
  required?: boolean;
  placeholder?: string;
};

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: FieldProps) {
  return (
    <label className="text-sm font-medium text-slate-800">
      {label}
      <input
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-700"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}
