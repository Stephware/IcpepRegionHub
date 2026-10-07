"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, EmptyState, LoadingState } from "@/components/ui/feedback";
import { buildCalendarMonth } from "./calendar";
import { listPublicEvents } from "./api";
import {
  eventOrganizerLabel,
  formatEventDateTime,
  formatEventDay,
} from "./format";
import type { EventItem } from "./types";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function eventBadgeVariant(status: EventItem["status"]) {
  if (status === "Cancelled") {
    return "danger" as const;
  }

  if (status === "Completed") {
    return "neutral" as const;
  }

  if (status === "Ongoing") {
    return "warning" as const;
  }

  return "success" as const;
}

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
    return (
      <div className="mt-8">
        <LoadingState label="Loading events..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8">
        <Alert tone="error">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Event view">
        <Button
          onClick={() => setView("list")}
          variant={view === "list" ? "primary" : "secondary"}
        >
          List view
        </Button>
        <Button
          onClick={() => setView("calendar")}
          variant={view === "calendar" ? "primary" : "secondary"}
        >
          Calendar view
        </Button>
      </div>

      {!events.length ? (
        <div className="mt-6">
          <EmptyState
            description="Upcoming Region 3 and chapter events will appear here."
            title="No published events yet."
          />
        </div>
      ) : view === "calendar" ? (
        <Card className="mt-6 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4">
            <Button onClick={() => changeMonth(-1)} size="sm" variant="secondary">
              Previous
            </Button>
            <h2 className="text-center font-semibold text-slate-950">
              {new Intl.DateTimeFormat("en-PH", {
                month: "long",
                year: "numeric",
              }).format(month)}
            </h2>
            <Button onClick={() => changeMonth(1)} size="sm" variant="secondary">
              Next
            </Button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
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
                              : "bg-blue-50 text-blue-700"
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
          </div>
        </Card>
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
              <div className="mt-4">
                <EmptyState title="No upcoming events are currently published." />
              </div>
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
    <Link href={`/events/${event.eventId}`}>
      <Card className="h-full overflow-hidden transition hover:border-blue-300 hover:shadow">
        {event.coverImageUrl ? (
          <img
            alt=""
            className="h-44 w-full object-cover"
            src={event.coverImageUrl}
          />
        ) : (
          <div className="flex h-32 items-center justify-center bg-blue-50 text-sm font-semibold text-blue-700">
            ICpEP Region 3 Event
          </div>
        )}

        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant={eventBadgeVariant(event.status)}>{event.status}</Badge>
            <Badge variant="teal">{event.eventType}</Badge>
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
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-blue-700">
            {formatEventDay(event.startDateTime)}
          </p>
        </div>
      </Card>
    </Link>
  );
}
