"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

type Metrics = {
  pendingAccounts: number;
  activeUsers: number;
  activeChapters: number;
  draftAnnouncements: number;
  draftEvents: number;
  openAssistance: number;
  openCollaborations: number;
};

export function AdminOverview() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    apiFetch<Metrics>("/admin/overview")
      .then((overview) => {
        if (!cancelled) {
          setMetrics(overview);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load admin overview.",
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

  if (loading) {
    return <p className="mt-8 text-sm text-slate-600">Loading admin overview...</p>;
  }

  if (error || !metrics) {
    return (
      <p className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || "Unable to load admin overview."}
      </p>
    );
  }

  const modules = [
    {
      href: "/admin/accounts",
      title: "Accounts",
      value: metrics.pendingAccounts,
      label: "pending approvals",
      description: "Approve registrations, update roles, and manage access.",
    },
    {
      href: "/admin/chapters",
      title: "Chapters",
      value: metrics.activeChapters,
      label: "active chapters",
      description: "Maintain chapter information and officer records.",
    },
    {
      href: "/admin/announcements",
      title: "Announcements",
      value: metrics.draftAnnouncements,
      label: "drafts",
      description: "Publish and maintain official Region 3 updates.",
    },
    {
      href: "/admin/events",
      title: "Events",
      value: metrics.draftEvents,
      label: "drafts",
      description: "Manage the regional and chapter event calendar.",
    },
    {
      href: "/admin/assistance",
      title: "Assistance",
      value: metrics.openAssistance,
      label: "open requests",
      description: "Coordinate chapter concerns and regional responses.",
    },
    {
      href: "/admin/collaborations",
      title: "Collaborations",
      value: metrics.openCollaborations,
      label: "open posts",
      description: "Review collaboration posts and response activity.",
    },
  ];

  return (
    <div className="mt-8 space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Pending approvals" value={metrics.pendingAccounts} />
        <Metric label="Active user accounts" value={metrics.activeUsers} />
        <Metric label="Active chapters" value={metrics.activeChapters} />
        <Metric label="Open assistance" value={metrics.openAssistance} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-950">
          Management modules
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <Link
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow"
              href={module.href}
              key={module.href}
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-semibold text-slate-950">{module.title}</h3>
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  {module.value} {module.label}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {module.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
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
