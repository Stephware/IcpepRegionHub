"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HubIcon } from "@/components/landing/hub-icon";
import { LandingHero } from "@/components/landing/landing-hero";
import { SectionTitle } from "@/components/landing/section-title";
import { listPublicAnnouncements } from "@/features/announcements/api";
import { formatAnnouncementDate } from "@/features/announcements/format";
import type { Announcement } from "@/features/announcements/types";
import { listPublicChapters } from "@/features/chapters/api";
import type { Chapter } from "@/features/chapters/types";
import { listPublicEvents } from "@/features/events/api";
import { formatEventDateTime } from "@/features/events/format";
import type { EventItem } from "@/features/events/types";

export function HomeLanding() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      listPublicAnnouncements(),
      listPublicEvents(),
      listPublicChapters(),
    ])
      .then(([announcementResult, eventResult, chapterResult]) => {
        if (cancelled) {
          return;
        }

        if (announcementResult.status === "fulfilled") {
          setAnnouncements(announcementResult.value);
        }
        if (eventResult.status === "fulfilled") {
          setEvents(eventResult.value);
        }
        if (chapterResult.status === "fulfilled") {
          setChapters(chapterResult.value);
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

  const latestAnnouncements = useMemo(
    () =>
      [...announcements]
        .sort(
          (a, b) =>
            new Date(b.publishedAt ?? 0).getTime() -
            new Date(a.publishedAt ?? 0).getTime(),
        )
        .slice(0, 3),
    [announcements],
  );

  const upcomingEvents = useMemo(
    () =>
      [...events]
        .filter(
          (event) =>
            event.status === "Upcoming" || event.status === "Ongoing",
        )
        .sort(
          (a, b) =>
            new Date(a.startDateTime).getTime() -
            new Date(b.startDateTime).getTime(),
        )
        .slice(0, 3),
    [events],
  );

  const visibleChapters = chapters.slice(0, 5);

  return (
    <>
      <LandingHero
        actions={[
          {
            href: "/announcements",
            label: "Explore Announcements",
            icon: "announcement",
          },
          {
            href: "/events",
            label: "View Events",
            icon: "calendar",
            variant: "secondary",
          },
        ]}
        description="Your central hub for ICpEP Student Edition – Region 3. Connect with chapters, stay updated on announcements and events, and explore opportunities across Central Luzon."
        eyebrow="ICpEP.se Region 3 Hub"
        title="One Region. Stronger Together."
        visualCaption="Students · Chapters · Communities"
        visualLabel="A stronger Region 3."
      />

      <section className="relative z-10 -mt-10 pb-12">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 lg:grid-cols-3">
          <PreviewPanel
            href="/announcements"
            icon="announcement"
            loading={loading}
            title="Latest Announcements"
          >
            {latestAnnouncements.map((announcement) => (
              <Link
                className="block rounded-lg px-3 py-3 transition hover:bg-blue-50"
                href={`/announcements/${announcement.announcementId}`}
                key={announcement.announcementId}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {announcement.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {announcement.category}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatAnnouncementDate(announcement.publishedAt)}
                  </span>
                </div>
              </Link>
            ))}
          </PreviewPanel>

          <PreviewPanel
            href="/events"
            icon="calendar"
            loading={loading}
            title="Upcoming Events"
          >
            {upcomingEvents.map((event) => (
              <Link
                className="flex gap-3 rounded-lg px-3 py-3 transition hover:bg-blue-50"
                href={`/events/${event.eventId}`}
                key={event.eventId}
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-center text-xs font-bold uppercase text-blue-700">
                  {new Intl.DateTimeFormat("en-PH", {
                    month: "short",
                    day: "numeric",
                  }).format(new Date(event.startDateTime))}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {event.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatEventDateTime(event.startDateTime)}
                  </p>
                </div>
              </Link>
            ))}
          </PreviewPanel>

          <PreviewPanel
            href="/chapters"
            icon="chapters"
            loading={loading}
            title="Chapter Directory"
          >
            {visibleChapters.map((chapter) => (
              <Link
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-blue-50"
                href={`/chapters/${chapter.chapterId}`}
                key={chapter.chapterId}
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-blue-100 bg-blue-50 text-xs font-bold text-blue-700">
                  {chapter.acronym?.slice(0, 3) ?? "R3"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {chapter.schoolName}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {chapter.chapterName}
                  </p>
                </div>
                <HubIcon className="ml-auto h-4 w-4 text-slate-400" name="arrow" />
              </Link>
            ))}
          </PreviewPanel>
        </div>
      </section>

      <section className="bg-[#f7faff] py-14">
        <div className="mx-auto max-w-7xl px-6">
          <SectionTitle
            description="Everything important for Region 3 chapters, organized in one place."
            eyebrow="Why use the hub?"
            title="More Opportunities for a Stronger Region 3"
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <FeatureCard
              description="Get official announcements, reminders, and regional advisories."
              href="/announcements"
              icon="announcement"
              title="Official Updates"
            />
            <FeatureCard
              description="Discover assemblies, seminars, competitions, and chapter activities."
              href="/events"
              icon="calendar"
              title="Regional Events"
            />
            <FeatureCard
              description="Explore ICpEP.se chapters across Region 3 and connect with members."
              href="/chapters"
              icon="chapters"
              title="Chapter Directory"
            />
            <FeatureCard
              description="Find partner chapters and participate in shared regional initiatives."
              href="/collaborations"
              icon="collaboration"
              title="Collaboration Board"
            />
          </div>
        </div>
      </section>
    </>
  );
}

function PreviewPanel({
  title,
  href,
  icon,
  loading,
  children,
}: {
  title: string;
  href: string;
  icon: "announcement" | "calendar" | "chapters";
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <article className="min-h-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(30,64,175,0.10)]">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600 text-white">
          <HubIcon name={icon} />
        </div>
        <h2 className="font-bold text-slate-950">{title}</h2>
        <Link
          className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
          href={href}
        >
          View all
          <HubIcon className="h-3.5 w-3.5" name="arrow" />
        </Link>
      </div>

      <div className="mt-2 divide-y divide-slate-100">
        {loading ? (
          <p className="px-3 py-8 text-center text-sm text-slate-500">
            Loading...
          </p>
        ) : (
          children
        )}
      </div>
    </article>
  );
}

function FeatureCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: "announcement" | "calendar" | "chapters" | "collaboration";
}) {
  return (
    <Link
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
      href={href}
    >
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
        <HubIcon name={icon} />
      </div>
      <h3 className="mt-4 font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </Link>
  );
}
