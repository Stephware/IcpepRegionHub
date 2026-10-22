"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Alert, LoadingState } from "@/components/ui/feedback";
import { HubIcon, type HubIconName } from "@/components/landing/hub-icon";
import { useAuth } from "@/features/auth/auth-context";
import { formatAnnouncementDate } from "@/features/announcements/format";
import {
  assistancePriorityClass,
  assistanceStatusClass,
} from "@/features/assistance/format";
import { collaborationChapterLabel } from "@/features/collaborations/format";
import { formatEventDateTime } from "@/features/events/format";
import { loadDashboard } from "./api";
import {
  assignedAssistanceCount,
  openAssistanceCount,
  recentAnnouncements,
  recentCollaborations,
  upcomingEventCount,
  upcomingEvents,
  urgentAssistanceCount,
  unassignedAssistanceCount,
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
    return <LoadingState label="Loading your dashboard..." />;
  }

  if (error || !dashboard) {
    return (
      <Alert tone="error">
        <p className="font-semibold">Dashboard unavailable</p>
        <p className="mt-2">{error || "Unable to load dashboard data."}</p>
      </Alert>
    );
  }

  if (dashboard.role === "ChapterOfficer") {
    return (
      <>
        <DashboardWelcome
          chapterName={dashboard.data.chapter?.chapterName}
          firstName={user.firstName}
          role="ChapterOfficer"
        />
        <ChapterOfficerDashboard data={dashboard.data} />
      </>
    );
  }

  if (dashboard.role === "FacultyRepresentative") {
    return (
      <>
        <DashboardWelcome
          chapterName={dashboard.data.chapter?.schoolName}
          firstName={user.firstName}
          role="FacultyRepresentative"
        />
        <FacultyDashboard data={dashboard.data} />
      </>
    );
  }

  if (dashboard.role === "RegionalOfficer") {
    return (
      <>
        <DashboardWelcome firstName={user.firstName} role="RegionalOfficer" />
        <RegionalOfficerDashboard
          data={dashboard.data}
          userId={user.userId}
        />
      </>
    );
  }

  return (
    <>
      <DashboardWelcome firstName={user.firstName} role="RegionalAdmin" />
      <RegionalAdminDashboard data={dashboard.data} />
    </>
  );
}

function DashboardWelcome({
  firstName,
  role,
  chapterName,
}: {
  firstName: string;
  role:
    | "ChapterOfficer"
    | "FacultyRepresentative"
    | "RegionalOfficer"
    | "RegionalAdmin";
  chapterName?: string;
}) {
  const roleLabel =
    role === "RegionalAdmin"
      ? "Regional Admin"
      : role === "RegionalOfficer"
        ? "Regional Officer"
        : role === "FacultyRepresentative"
          ? "Faculty Representative"
          : "Chapter Officer";
  const description =
    role === "RegionalAdmin"
      ? "Manage Region 3 accounts, chapters, official content, assistance, and collaboration moderation."
      : role === "RegionalOfficer"
        ? "Coordinate regional assistance requests and keep track of activity across Region 3."
        : role === "FacultyRepresentative"
          ? "Publish academic opportunities for your institution and stay connected with Region 3."
          : "Manage your chapter's assistance and collaboration activity while staying updated on Region 3.";

  return (
    <section className="overflow-hidden rounded-2xl bg-[linear-gradient(115deg,#032b82_0%,#075ed8_58%,#0b8ee8_100%)] px-6 py-7 text-white shadow-sm sm:px-8 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-100">
            ICpEP Region 3 Hub
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50 sm:text-base">
            {description}
          </p>
          {chapterName ? (
            <p className="mt-3 text-sm font-semibold text-white">
              {chapterName}
            </p>
          ) : null}
        </div>
        <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white">
          {roleLabel}
        </span>
      </div>
    </section>
  );
}

function FacultyDashboard({
  data,
}: {
  data: Extract<DashboardData, { role: "FacultyRepresentative" }>["data"];
}) {
  return (
    <div className="mt-8 space-y-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <Metric
          href="/events"
          label="Upcoming events"
          value={upcomingEventCount(data.events)}
        />
        <Metric
          href="/collaborations"
          label="Open collaborations"
          value={data.collaborations.length}
        />
      </section>
      <QuickActions
        actions={[
          {
            href: "/manage/events",
            label: "Manage academic events",
            description:
              "Save drafts and publish academic opportunities for your institution.",
            icon: "calendar",
          },
          {
            href: "/collaborations",
            label: "Browse collaborations",
            description: "Explore opportunities shared by chapters.",
            icon: "collaboration",
          },
          ...(data.chapter
            ? [
                {
                  href: `/chapters/${data.chapter.chapterId}`,
                  label: "View affiliated institution",
                  description: "See your institution's chapter profile.",
                  icon: "chapters" as const,
                },
              ]
            : []),
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <AnnouncementPanel
          announcements={recentAnnouncements(data.announcements)}
        />
        <EventPanel events={upcomingEvents(data.events)} />
        <CollaborationPanel
          collaborations={recentCollaborations(data.collaborations)}
        />
      </div>
    </div>
  );
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
  const eventCount = useMemo(
    () => upcomingEventCount(data.events),
    [data.events],
  );
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
        <Metric href="/assistance" label="Open assistance requests" value={openRequests} />
        <Metric href="/collaborations" label="My open collaboration posts" value={ownOpenCollaborations} />
        <Metric href="/events" label="Upcoming events" value={eventCount} />
        <Metric href="/collaborations" label="Open collaborations" value={data.collaborations.length} />
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

      <NeedsAttention
        items={[
          {
            href: "/assistance",
            label: "Open chapter assistance requests",
            value: openRequests,
          },
          {
            href: "/collaborations",
            label: "Your active collaboration posts",
            value: ownOpenCollaborations,
          },
          {
            href: "/events",
            label: "Upcoming and ongoing events",
            value: eventCount,
          },
        ]}
      />

      <QuickActions
        actions={[
          {
            href: "/manage/events",
            label: "Manage chapter events",
            description: "Save drafts and publish events for your chapter.",
            icon: "calendar",
          },
          {
            href: "/chapter/profile",
            label: "Edit chapter contacts",
            description:
              "Update your chapter's email, contact number, and social link.",
            icon: "chapters",
          },
          {
            href: "/assistance",
            label: "Submit assistance request",
            description: "Send a chapter concern to the regional team.",
            icon: "assistance",
          },
          {
            href: "/collaborations",
            label: "Create collaboration post",
            description: "Invite other chapters to work with your chapter.",
            icon: "collaboration",
          },
          {
            href: "/collaborations",
            label: "Browse collaborations",
            description: "Find open opportunities from other chapters.",
            icon: "collaboration",
          },
          ...(data.chapter
            ? [
                {
                  href: `/chapters/${data.chapter.chapterId}`,
                  label: "View chapter profile",
                  description:
                    "See your chapter identity and current officers.",
                  icon: "chapters" as const,
                },
              ]
            : []),
          {
            href: "/events",
            label: "View events",
            description: "See published Region 3 and chapter events.",
            icon: "calendar",
          },
          {
            href: "/announcements",
            label: "View announcements",
            description: "Read official public and member updates.",
            icon: "announcement",
          },
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
          href="/assistance"
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
  const unassigned = unassignedAssistanceCount(data.assistanceRequests);

  return (
    <div className="mt-8 space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric href="/regional/assistance" label="Open regional requests" value={openRequests} />
        <Metric href="/regional/assistance" label="Assigned to me" value={assigned} />
        <Metric href="/regional/assistance" label="Urgent open requests" value={urgent} />
        <Metric href="/regional/assistance" label="Unassigned requests" value={unassigned} />
      </section>

      <NeedsAttention
        items={[
          {
            href: "/regional/assistance",
            label: "Urgent open requests",
            value: urgent,
          },
          {
            href: "/regional/assistance",
            label: "Unassigned open requests",
            value: unassigned,
          },
          {
            href: "/regional/assistance",
            label: "Open requests assigned to you",
            value: assigned,
          },
        ]}
      />

      <QuickActions
        actions={[
          {
            href: "/manage/events",
            label: "Manage regional events",
            description:
              "Save drafts and publish your official regional events.",
            icon: "calendar",
          },
          {
            href: "/regional/announcements",
            label: "Manage announcements",
            description: "Publish and update your regional announcements.",
            icon: "announcement",
          },
          {
            href: "/regional/assistance",
            label: "Manage assistance requests",
            description: "Review, assign, prioritize, and update chapter concerns.",
            icon: "assistance",
          },
          {
            href: "/collaborations",
            label: "Browse collaborations",
            description: "Monitor active opportunities posted by chapters.",
            icon: "collaboration",
          },
          {
            href: "/events",
            label: "View regional calendar",
            description: "Check published activities and schedules.",
            icon: "calendar",
          },
          {
            href: "/announcements",
            label: "Read announcements",
            description: "Keep up with official Region 3 updates.",
            icon: "announcement",
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <AssistancePanel
          requests={data.assistanceRequests.slice(0, 5)}
          title="Regional assistance queue"
          emptyMessage="No regional assistance requests are waiting."
          href="/regional/assistance"
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
        <Metric href="/admin/accounts" label="Pending accounts" value={data.pendingAccounts.length} />
        <Metric href="/admin/chapters" label="Active chapters" value={activeChapters} />
        <Metric href="/admin/assistance" label="Open assistance requests" value={openRequests} />
        <Metric href="/admin/assistance" label="Urgent requests" value={urgent} />
      </section>

      <NeedsAttention
        items={[
          {
            href: "/admin/accounts",
            label: "Accounts awaiting review",
            value: data.pendingAccounts.length,
          },
          {
            href: "/admin/announcements",
            label: "Announcement drafts",
            value: draftAnnouncements,
          },
          { href: "/admin/events", label: "Event drafts", value: draftEvents },
          {
            href: "/admin/assistance",
            label: "Open assistance requests",
            value: openRequests,
          },
          {
            href: "/admin/assistance",
            label: "Urgent open requests",
            value: urgent,
          },
          {
            href: "/admin/collaborations",
            label: "Open collaboration posts",
            value: data.collaborations.length,
          },
        ]}
      />

      <QuickActions
        actions={[
          {
            href: "/admin/accounts",
            label: "Review accounts",
            description: "Approve registrations and manage roles or access.",
            icon: "chapters",
          },
          {
            href: "/admin/chapters",
            label: "Manage chapters",
            description: "Update chapter profiles, status, and officer records.",
            icon: "chapters",
          },
          {
            href: "/admin/announcements",
            label: "Manage announcements",
            description: "Create, edit, publish, pin, or remove official updates.",
            icon: "announcement",
          },
          {
            href: "/admin/events",
            label: "Manage events",
            description: "Create, publish, update, cancel, or remove events.",
            icon: "calendar",
          },
          {
            href: "/admin/assistance",
            label: "Manage assistance",
            description: "Coordinate and resolve chapter assistance requests.",
            icon: "assistance",
          },
          {
            href: "/admin/collaborations",
            label: "Moderate collaborations",
            description: "Review, close, reopen, or remove collaboration posts.",
            icon: "collaboration",
          },
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
          href="/admin/collaborations"
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
          href="/admin/assistance"
        />
        <AnnouncementPanel announcements={announcements} />
        <EventPanel events={events} />
        <CollaborationPanel collaborations={collaborations} />
      </div>
    </div>
  );
}

function NeedsAttention({
  items,
}: {
  items: Array<{ href: string; label: string; value: number }>;
}) {
  const activeItems = items.filter((item) => item.value > 0);

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-950">Needs your attention</h2>
      <p className="mt-1 text-sm text-slate-500">
        Current requests and activity you can review.
      </p>
      {activeItems.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {activeItems.map((item) => (
            <Metric key={item.label} {...item} />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          Nothing needs your attention right now.
        </p>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold text-slate-950">{value}</p>
        {href ? (
          <HubIcon className="h-4 w-4 text-blue-600" name="arrow" />
        ) : null}
      </div>
    </>
  );

  return href ? (
    <Link
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow"
      href={href}
    >
      {content}
    </Link>
  ) : (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {content}
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
  actions: Array<{
    href: string;
    label: string;
    description: string;
    icon: HubIconName;
  }>;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-950">Quick actions</h2>
      <p className="mt-1 text-sm text-slate-500">
        Common actions available to your account.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <Link
            className="group flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow"
            href={action.href}
            key={action.label}
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
              <HubIcon name={action.icon} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-950">{action.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {action.description}
              </p>
            </div>
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

function EventPanel({ events }: { events: ReturnType<typeof upcomingEvents> }) {
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
                {post.collaborationType} ·{" "}
                {collaborationChapterLabel(post.chapter)}
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
  href,
}: {
  requests: Extract<
    DashboardData,
    { role: "ChapterOfficer" | "RegionalOfficer" | "RegionalAdmin" }
  >["data"]["assistanceRequests"];
  title: string;
  emptyMessage: string;
  href: string;
}) {
  return (
    <Panel href={href} title={title}>
      {requests.length ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <Link
              className="block border-b border-slate-100 pb-4 last:border-0 last:pb-0 hover:text-blue-700"
              href={href === "/assistance" ? `/assistance/${request.assistanceRequestId}` : href}
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
            </Link>
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
