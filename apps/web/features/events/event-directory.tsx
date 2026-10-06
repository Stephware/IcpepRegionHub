"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildCalendarMonth } from "./calendar";
import { listPublicEvents } from "./api";
import {
  eventOrganizerLabel,
  formatEventDateTime,
  formatEventDay,
} from "./format";
import type { EventItem } from "./types";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function EventDirectory() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [month, setMonth] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;

    listPublicEvents()
      .then((items) => {
        if (!cancelled) {
          setEvents(items);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load events.",
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

  const calendarDays = useMemo(
    () => buildCalendarMonth(month, events),
    [events, month],
  );

  const upcoming = useMemo(
    () =>
      events.filter(
        (event) =>
          event.status === "Upcoming" ||
          event.status === "Ongoing" ||
          event.status === "Cancelled",
      ),
    [events],
  );

  const completed = useMemo(
    () => events.filter((event) => event.status === "Completed"),
    [events],
  );

  function changeMonth(offset: number) {
    setMonth((current) => {
      const next = new Date(current.getFullYear(), current.getMonth() + offset, 1);
      return next;
    });
  }

  if (loading) {
    return <p className="mt-8 text-sm text-slate-600">Loading events...</p>;
  }

  if (error) {
    return (
      <p className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2">
        <button
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            view === "list"
              ? "bg-teal-700 text-white"
              : "border border-slate-300 bg-white text-slate-700"
          }`}
          onClick={() => setView("list")}
          type="button"
        >
          List view
        </button>
        <button
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            view === "calendar"
              ? "bg-teal-700 text-white"
              : "border border-slate-300 bg-white text-slate-700"
          }`}
          onClick={() => setView("calendar")}
          type="button"
        >
          Calendar view
        </button>
      </div>

      {!events.length ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-medium text-slate-900">No published events yet.</p>
          <p className="mt-2 text-sm text-slate-600">
            Upcoming Region 3 and chapter events will appear here.
          </p>
        </div>
      ) : view === "calendar" ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              onClick={() => changeMonth(-1)}
              type="button"
            >
              Previous
            </button>
            <h2 className="font-semibold text-slate-950">
              {new Intl.DateTimeFormat("en-PH", {
                month: "long",
                year: "numeric",
              }).format(month)}
            </h2>
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              onClick={() => changeMonth(1)}
              type="button"
            >
              Next
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {weekDays.map((day) => (
              <div
                className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-slate-500"
                key={day}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day) => (
              <div
                className={`min-h-28 border-b border-r border-slate-100 p-2 ${
                  day.inCurrentMonth ? "bg-white" : "bg-slate-50"
                }`}
                key={day.date.toISOString()}
              >
                <div
                  className={`text-xs font-medium ${
                    day.inCurrentMonth ? "text-slate-700" : "text-slate-400"
                  }`}
                >
                  {day.date.getDate()}
                </div>
                <div className="mt-2 space-y-1">
                  {day.events.slice(0, 3).map((event) => (
                    <Link
                      className={`block truncate rounded px-2 py-1 text-xs font-medium ${
                        event.status === "Cancelled"
                          ? "bg-red-50 text-red-700 line-through"
                          : "bg-teal-50 text-teal-700"
                      }`}
                      href={`/events/${event.eventId}`}
                      key={event.eventId}
                      title={event.title}
                    >
                      {event.title}
                    </Link>
                  ))}
                  {day.events.length > 3 ? (
                    <p className="text-xs text-slate-500">
                      +{day.events.length - 3} more
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              Upcoming & current events
            </h2>
            {upcoming.length ? (
              <div className="mt-4 grid gap-5 md:grid-cols-2">
                {upcoming.map((event) => (
                  <EventCard event={event} key={event.eventId} />
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
                No upcoming events are currently published.
              </p>
            )}
          </section>

          {completed.length ? (
            <section>
              <h2 className="text-xl font-semibold text-slate-950">
                Previous events
              </h2>
              <div className="mt-4 grid gap-5 md:grid-cols-2">
                {completed.map((event) => (
                  <EventCard event={event} key={event.eventId} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: EventItem }) {
  return (
    <Link
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-teal-300 hover:shadow"
      href={`/events/${event.eventId}`}
    >
      {event.coverImageUrl ? (
        <img
          alt=""
          className="h-44 w-full object-cover"
          src={event.coverImageUrl}
        />
      ) : (
        <div className="flex h-32 items-center justify-center bg-teal-50 text-sm font-semibold text-teal-700">
          ICpEP Region 3 Event
        </div>
      )}

      <div className="p-5">
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

        <h3 className="mt-3 text-lg font-semibold text-slate-950">
          {event.title}
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          {formatEventDateTime(event.startDateTime)}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {eventOrganizerLabel(event.organizer)}
        </p>
        {event.venue ? (
          <p className="mt-2 text-sm text-slate-500">{event.venue}</p>
        ) : null}
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-teal-700">
          {formatEventDay(event.startDateTime)}
        </p>
      </div>
    </Link>
  );
}
