"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getPublicEvent } from "./api";
import {
  eventOrganizerLabel,
  formatEventDateTime,
  isRegistrationOpen,
} from "./format";
import type { EventItem } from "./types";

export function EventDetails() {
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getPublicEvent(params.id)
      .then((item) => {
        if (!cancelled) {
          setEvent(item);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load event.",
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
  }, [params.id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-sm text-slate-600">Loading event...</p>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link className="text-sm font-medium text-teal-700" href="/events">
          ← Back to events
        </Link>
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Event was not found."}
        </p>
      </main>
    );
  }

  const registrationOpen = isRegistrationOpen(
    event.registrationDeadline,
    event.status,
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link className="text-sm font-medium text-teal-700" href="/events">
        ← Back to events
      </Link>

      <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {event.coverImageUrl ? (
          <img
            alt=""
            className="max-h-[28rem] w-full object-cover"
            src={event.coverImageUrl}
          />
        ) : null}

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                event.status === "Cancelled"
                  ? "bg-red-50 text-red-700"
                  : event.status === "Completed"
                    ? "bg-slate-100 text-slate-600"
                    : event.status === "Ongoing"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {event.status}
            </span>
            <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">
              {event.eventType}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold text-slate-950">
            {event.title}
          </h1>
          <p className="mt-3 text-slate-600">
            Organized by {eventOrganizerLabel(event.organizer)}
          </p>

          {event.status === "Cancelled" ? (
            <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              This event has been cancelled.
            </p>
          ) : null}

          <dl className="mt-8 grid gap-5 border-y border-slate-200 py-6 sm:grid-cols-2">
            <Info label="Starts" value={formatEventDateTime(event.startDateTime)} />
            <Info
              label="Ends"
              value={
                event.endDateTime
                  ? formatEventDateTime(event.endDateTime)
                  : "Not specified"
              }
            />
            <Info label="Venue" value={event.venue ?? "To be announced"} />
            <Info
              label="Registration deadline"
              value={
                event.registrationDeadline
                  ? formatEventDateTime(event.registrationDeadline)
                  : "No deadline specified"
              }
            />
          </dl>

          {event.description ? (
            <div className="mt-8 whitespace-pre-wrap text-base leading-7 text-slate-700">
              {event.description}
            </div>
          ) : null}

          {event.registrationLink ? (
            <div className="mt-8">
              {registrationOpen ? (
                <a
                  className="inline-flex rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white"
                  href={event.registrationLink}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open registration ↗
                </a>
              ) : (
                <p className="text-sm font-medium text-slate-500">
                  Registration is closed.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </article>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-800">{value}</dd>
    </div>
  );
}
