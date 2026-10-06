"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { listPublicChapters } from "./api";
import { chapterDisplayName } from "./display";
import type { Chapter } from "./types";

export function ChapterDirectory() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    listPublicChapters()
      .then((items) => {
        if (!cancelled) {
          setChapters(items);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load chapters.",
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
    return <p className="mt-8 text-sm text-slate-600">Loading chapters...</p>;
  }

  if (error) {
    return (
      <p className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (!chapters.length) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="font-medium text-slate-900">No active chapters yet.</p>
        <p className="mt-2 text-sm text-slate-600">
          Active ICpEP Region 3 chapters will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-5 md:grid-cols-2">
      {chapters.map((chapter) => (
        <Link
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow"
          href={`/chapters/${chapter.chapterId}`}
          key={chapter.chapterId}
        >
          <div className="flex gap-4">
            {chapter.logoUrl ? (
              <img
                alt={`${chapter.chapterName} logo`}
                className="h-16 w-16 rounded-lg border border-slate-200 object-contain"
                src={chapter.logoUrl}
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-teal-50 text-lg font-semibold text-teal-700">
                {chapter.acronym?.slice(0, 3) ?? "IC"}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-950">
                {chapterDisplayName(chapter)}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{chapter.schoolName}</p>
              {chapter.address ? (
                <p className="mt-2 text-sm text-slate-500">{chapter.address}</p>
              ) : null}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
