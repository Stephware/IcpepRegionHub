"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { formatAnnouncementDate } from "@/features/announcements/format";
import { assistancePriorityClass, assistanceStatusClass } from "@/features/assistance/format";
import { collaborationChapterLabel } from "@/features/collaborations/format";
import { formatEventDateTime } from "@/features/events/format";
import { loadDashboard } from "./api";
import {
  assignedAssistanceCount,
  openAssistanceCount,
  recentAnnouncements,
  recentCollaborations,
  upcomingEvents,
  urgentAssistanceCount,
} from "./helpers";
import type { DashboardData } from "./types";

export function RoleDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    loadDashboard()
      .then((data) => {
        if (!cancelled) {
          setDashboard(data);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load dashboard.",
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
  }, [user]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-600">Loading your dashboard...</p>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-800">Dashboard unavailable</p>
        <p className="mt-2 text-sm text-red-700">
          {error || "Unable to load dashboard data."}
        </p>
      </div>
    );
  }

  if (dashboard.role === "ChapterOfficer") {
    return (
      <ChapterOfficerDashboard data={dashboard.data} />
    );
  }

  if (dashboard.role === "RegionalOfficer") {
    return (
      <RegionalOfficerDashboard
        data={dashboard.data}
        userId={user.userId}
      />
    );
  }

  return <RegionalAdminDashboard data={dashboard.data} />;
}

function ChapterOfficerDashboard({
  data,
}: {
  data: Extract<DashboardData, { role: "ChapterOfficer" }>["data"];
}) {
  const announcements = useMemo(
    () => recentAnnouncements(data.announcements),
    [data.announcements],
  );
  const events = useMemo(() => upcomingEvents(data.events), [data.events]);
  const collaborations = useMemo(
    () => recentCollaborations(data.collaborations),
    [data.collaborations],
  );
  const openRequests = openAssistanceCount(data.assistanceRequests);
  const ownOpenCollaborations = data.ownCollaborations.filter(
    (post) => post.status === "Open",
  ).length;

  return (
    <div className="mt-8 space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Open assistance requests" value={openRequests} />
        <Metric label="My open collaboration posts" value={ownOpenCollaborations} />
        <Metric label="Upcoming events" value={events.length} />
        <Metric label="Open collaborations" value={data.collaborations.length} />
      </section>

      {data.chapter ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
            Your chapter
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            {data.chapter.chapterName}
            {data.chapter.acronym ? ` (${data.chapter.acronym})` : ""}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{data.chapter.schoolName}</p>
          <div className="mt-4">
            <Link
              className="text-sm font-medium text-blue-700 hover:underline"
              href={`/chapters/${data.chapter.chapterId}`}
            >
              View chapter profile →
            </Link>
          </div>
        </section>
      ) : null}

      <QuickActions
        actions={[
          { href: "/assistance", label: "Submit assistance request" },
          { href: "/collaborations", label: "Create collaboration post" },
          { href: "/events", label: "Browse events" },
          { href: "/announcements", label: "View announcements" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <AnnouncementPanel announcements={announcements} />
        <EventPanel events={events} />
        <CollaborationPanel collaborations={collaborations} />
        <AssistancePanel
          requests={data.assistanceRequests.slice(0, 4)}
          title="Chapter assistance"
          emptyMessage="No assistance requests have been submitted by your chapter."
        />
      </div>

    </div>
  );
}

function RegionalOfficerDashboard({
  data,
  userId,
}: {
  data: Extract<DashboardData, { role: "RegionalOfficer" }>["data"];
  userId: string;
}) {
  const announcements = recentAnnouncements(data.announcements);
  const events = upcomingEvents(data.events);
  const collaborations = recentCollaborations(data.collaborations);
  const openRequests = openAssistanceCount(data.assistanceRequests);
  const assigned = assignedAssistanceCount(data.assistanceRequests, userId);
  const urgent = urgentAssistanceCount(data.assistanceRequests);

  return (
    <div className="mt-8 space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Open regional requests" value={openRequests} />
        <Metric label="Assigned to me" value={assigned} />
        <Metric label="Urgent open requests" value={urgent} />
        <Metric label="Open collaborations" value={data.collaborations.length} />
      </section>

      <QuickActions
        actions={[
          { href: "/regional/assistance", label: "Manage assistance requests" },
          { href: "/collaborations", label: "Browse collaborations" },
          { href: "/events", label: "View regional calendar" },
          { href: "/announcements", label: "Read announcements" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <AssistancePanel
          requests={data.assistanceRequests.slice(0, 5)}
          title="Regional assistance queue"
          emptyMessage="No regional assistance requests are waiting."
        />
        <AnnouncementPanel announcements={announcements} />
        <EventPanel events={events} />
        <CollaborationPanel collaborations={collaborations} />
      </div>
    </div>
  );
}

function RegionalAdminDashboard({
  data,
}: {
  data: Extract<DashboardData, { role: "RegionalAdmin" }>["data"];
}) {
  const announcements = recentAnnouncements(data.announcements);
  const events = upcomingEvents(data.events);
  const collaborations = recentCollaborations(data.collaborations);
  const openRequests = openAssistanceCount(data.assistanceRequests);
  const urgent = urgentAssistanceCount(data.assistanceRequests);
  const activeChapters = data.activeChapters;
  const draftAnnouncements = data.draftAnnouncements;
  const draftEvents = data.draftEvents;

  return (
    <div className="mt-8 space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Pending accounts" value={data.pendingAccounts.length} />
        <Metric label="Active chapters" value={activeChapters} />
        <Metric label="Open assistance requests" value={openRequests} />
        <Metric label="Urgent requests" value={urgent} />
      </section>

      <QuickActions
        actions={[
          { href: "/admin", label: "Open admin portal" },
          { href: "/admin/chapters", label: "Manage chapters" },
          { href: "/admin/announcements", label: "Manage announcements" },
          { href: "/admin/events", label: "Manage events" },
          { href: "/admin/assistance", label: "Manage assistance" },
          { href: "/admin/collaborations", label: "Moderate collaborations" },
        ]}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatusCard
          href="/admin/announcements"
          label="Announcement drafts"
          value={draftAnnouncements}
        />
        <StatusCard
          href="/admin/events"
          label="Event drafts"
          value={draftEvents}
        />
        <StatusCard
          href="/collaborations"
          label="Open collaborations"
          value={data.collaborations.length}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <PendingAccountsPanel accounts={data.pendingAccounts.slice(0, 5)} />
        <AssistancePanel
          requests={data.assistanceRequests.slice(0, 5)}
          title="Regional assistance queue"
          emptyMessage="No regional assistance requests are waiting."
        />
        <AnnouncementPanel announcements={announcements} />
        <EventPanel events={events} />
        <CollaborationPanel collaborations={collaborations} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function StatusCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300"
      href={href}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </Link>
  );
}

function QuickActions({
  actions,
}: {
  actions: Array<{ href: string; label: string }>;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-950">Quick actions</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {actions.map((action) => (
          <Link
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
            href={action.href}
            key={action.href}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function Panel({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <Link className="text-sm font-medium text-blue-700" href={href}>
          View all
        </Link>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function AnnouncementPanel({
  announcements,
}: {
  announcements: ReturnType<typeof recentAnnouncements>;
}) {
  return (
    <Panel href="/announcements" title="Recent announcements">
      {announcements.length ? (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Link
              className="block border-b border-slate-100 pb-4 last:border-0 last:pb-0"
              href={`/announcements/${announcement.announcementId}`}
              key={announcement.announcementId}
            >
              <p className="font-medium text-slate-950">{announcement.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                {announcement.category} ·{" "}
                {formatAnnouncementDate(announcement.publishedAt)}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <Empty text="No announcements are available." />
      )}
    </Panel>
  );
}

function EventPanel({
  events,
}: {
  events: ReturnType<typeof upcomingEvents>;
}) {
  return (
    <Panel href="/events" title="Upcoming events">
      {events.length ? (
        <div className="space-y-4">
          {events.map((event) => (
            <Link
              className="block border-b border-slate-100 pb-4 last:border-0 last:pb-0"
              href={`/events/${event.eventId}`}
              key={event.eventId}
            >
              <p className="font-medium text-slate-950">{event.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                {formatEventDateTime(event.startDateTime)}
                {event.venue ? ` · ${event.venue}` : ""}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <Empty text="No upcoming events are published." />
      )}
    </Panel>
  );
}

function CollaborationPanel({
  collaborations,
}: {
  collaborations: ReturnType<typeof recentCollaborations>;
}) {
  return (
    <Panel href="/collaborations" title="Open collaborations">
      {collaborations.length ? (
        <div className="space-y-4">
          {collaborations.map((post) => (
            <Link
              className="block border-b border-slate-100 pb-4 last:border-0 last:pb-0"
              href={`/collaborations/${post.collaborationPostId}`}
              key={post.collaborationPostId}
            >
              <p className="font-medium text-slate-950">{post.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                {post.collaborationType} · {collaborationChapterLabel(post.chapter)}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <Empty text="No open collaboration posts are available." />
      )}
    </Panel>
  );
}

function AssistancePanel({
  requests,
  title,
  emptyMessage,
}: {
  requests: Extract<
    DashboardData,
    { role: "ChapterOfficer" | "RegionalOfficer" | "RegionalAdmin" }
  >["data"]["assistanceRequests"];
  title: string;
  emptyMessage: string;
}) {
  const regionalHref =
    title === "Regional assistance queue"
      ? "/regional/assistance"
      : "/assistance";

  return (
    <Panel href={regionalHref} title={title}>
      {requests.length ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              className="border-b border-slate-100 pb-4 last:border-0 last:pb-0"
              key={request.assistanceRequestId}
            >
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${assistanceStatusClass(
                    request.status,
                  )}`}
                >
                  {request.status}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${assistancePriorityClass(
                    request.priority,
                  )}`}
                >
                  {request.priority}
                </span>
              </div>
              <p className="mt-2 font-medium text-slate-950">{request.subject}</p>
              <p className="mt-1 text-xs text-slate-500">{request.ticketCode}</p>
            </div>
          ))}
        </div>
      ) : (
        <Empty text={emptyMessage} />
      )}
    </Panel>
  );
}

function PendingAccountsPanel({
  accounts,
}: {
  accounts: Extract<DashboardData, { role: "RegionalAdmin" }>["data"]["pendingAccounts"];
}) {
  return (
    <Panel href="/admin/accounts" title="Pending account approvals">
      {accounts.length ? (
        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              className="border-b border-slate-100 pb-4 last:border-0 last:pb-0"
              key={account.userId}
            >
              <p className="font-medium text-slate-950">
                {account.firstName} {account.lastName}
              </p>
              <p className="mt-1 text-xs text-slate-500">{account.email}</p>
            </div>
          ))}
        </div>
      ) : (
        <Empty text="No accounts are waiting for approval." />
      )}
    </Panel>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-slate-500">{text}</p>;
}
