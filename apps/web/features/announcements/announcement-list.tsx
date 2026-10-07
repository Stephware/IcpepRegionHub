"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import {
  listMemberAnnouncements,
  listPublicAnnouncements,
} from "./api";
import { announcementExcerpt, formatAnnouncementDate } from "./format";
import type { MemberAnnouncement } from "./types";

export function AnnouncementList() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<MemberAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let cancelled = false;
    const request = user
      ? listMemberAnnouncements()
      : listPublicAnnouncements().then((announcements) =>
          announcements.map((announcement) => ({
            ...announcement,
            visibility: "Public" as const,
          })),
        );

    request
      .then((announcements) => {
        if (!cancelled) {
          setItems(announcements);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load announcements.",
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
  }, [authLoading, user]);

  if (authLoading || loading) {
    return <p className="mt-8 text-sm text-slate-600">Loading announcements...</p>;
  }

  if (error) {
    return (
      <p className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (!items.length) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="font-medium text-slate-900">No announcements yet.</p>
        <p className="mt-2 text-sm text-slate-600">
          Published regional announcements will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-5">
      {items.map((announcement) => (
        <Link
          className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-300 hover:shadow"
          href={`/announcements/${announcement.announcementId}`}
          key={announcement.announcementId}
        >
          <div className="grid md:grid-cols-[220px_minmax(0,1fr)]">
            {announcement.coverImageUrl ? (
              <img
                alt=""
                className="h-48 w-full object-cover md:h-full"
                decoding="async"
                loading="lazy"
                src={announcement.coverImageUrl}
              />
            ) : (
              <div className="flex min-h-36 items-center justify-center bg-blue-50 px-6 text-center text-sm font-semibold text-blue-700">
                ICpEP Region 3
              </div>
            )}

            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2">
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
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  {announcement.category}
                </span>
              </div>

              <h2 className="mt-3 text-xl font-semibold text-slate-950">
                {announcement.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {announcementExcerpt(announcement.content)}
              </p>
              <p className="mt-4 text-xs text-slate-500">
                {formatAnnouncementDate(announcement.publishedAt)} ·{" "}
                {announcement.createdBy.firstName}{" "}
                {announcement.createdBy.lastName}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
