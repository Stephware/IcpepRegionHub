"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import {
  getMemberAnnouncement,
  getPublicAnnouncement,
} from "./api";
import { formatAnnouncementDate } from "./format";
import type { MemberAnnouncement } from "./types";

export function AnnouncementDetails() {
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [announcement, setAnnouncement] =
    useState<MemberAnnouncement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let cancelled = false;
    const request = user
      ? getMemberAnnouncement(params.id)
      : getPublicAnnouncement(params.id).then((item) => ({
          ...item,
          visibility: "Public" as const,
        }));

    request
      .then((item) => {
        if (!cancelled) {
          setAnnouncement(item);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load announcement.",
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
  }, [authLoading, params.id, user]);

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm text-slate-600">Loading announcement...</p>
      </main>
    );
  }

  if (error || !announcement) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <Link className="text-sm font-medium text-teal-700" href="/announcements">
          ← Back to announcements
        </Link>
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Announcement was not found."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link className="text-sm font-medium text-teal-700" href="/announcements">
        ← Back to announcements
      </Link>

      <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {announcement.coverImageUrl ? (
          <img
            alt=""
            className="max-h-96 w-full object-cover"
            src={announcement.coverImageUrl}
          />
        ) : null}

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap gap-2">
            {announcement.isPinned ? (
              <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                Pinned
              </span>
            ) : null}
            {announcement.visibility === "MembersOnly" ? (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                Members only
              </span>
            ) : null}
            <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">
              {announcement.category}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold text-slate-950">
            {announcement.title}
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            {formatAnnouncementDate(announcement.publishedAt)} · Posted by{" "}
            {announcement.createdBy.firstName}{" "}
            {announcement.createdBy.lastName}
          </p>

          <div className="mt-8 whitespace-pre-wrap text-base leading-7 text-slate-700">
            {announcement.content}
          </div>

          {announcement.externalLink ? (
            <a
              className="mt-8 inline-flex rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white"
              href={announcement.externalLink}
              rel="noreferrer"
              target="_blank"
            >
              Open related link ↗
            </a>
          ) : null}
        </div>
      </article>
    </main>
  );
}
