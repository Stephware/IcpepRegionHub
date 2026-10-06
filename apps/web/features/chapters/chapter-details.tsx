"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getPublicChapter,
  listCurrentChapterOfficers,
} from "./api";
import { chapterDisplayName } from "./display";
import type { Chapter, ChapterOfficer } from "./types";

export function ChapterDetails() {
  const params = useParams<{ id: string }>();
  const chapterId = params.id;
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [officers, setOfficers] = useState<ChapterOfficer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getPublicChapter(chapterId),
      listCurrentChapterOfficers(chapterId),
    ])
      .then(([chapterResult, officerResult]) => {
        if (!cancelled) {
          setChapter(chapterResult);
          setOfficers(officerResult);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load chapter details.",
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
  }, [chapterId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-sm text-slate-600">Loading chapter...</p>
      </main>
    );
  }

  if (error || !chapter) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link className="text-sm font-medium text-teal-700" href="/chapters">
          ← Back to chapters
        </Link>
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Chapter was not found."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link className="text-sm font-medium text-teal-700" href="/chapters">
        ← Back to chapters
      </Link>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row">
          {chapter.logoUrl ? (
            <img
              alt={`${chapter.chapterName} logo`}
              className="h-24 w-24 rounded-xl border border-slate-200 object-contain"
              src={chapter.logoUrl}
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-teal-50 text-2xl font-semibold text-teal-700">
              {chapter.acronym?.slice(0, 3) ?? "IC"}
            </div>
          )}

          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
              ICpEP Region 3 Chapter
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">
              {chapterDisplayName(chapter)}
            </h1>
            <p className="mt-2 text-slate-600">{chapter.schoolName}</p>
            {chapter.address ? (
              <p className="mt-2 text-sm text-slate-500">{chapter.address}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Official email
            </p>
            <p className="mt-1 text-sm text-slate-800">
              {chapter.officialEmail ?? "Not provided"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Contact number
            </p>
            <p className="mt-1 text-sm text-slate-800">
              {chapter.contactNumber ?? "Not provided"}
            </p>
          </div>
          {chapter.facebookUrl ? (
            <div className="sm:col-span-2">
              <a
                className="text-sm font-medium text-teal-700 hover:underline"
                href={chapter.facebookUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open official Facebook page ↗
              </a>
            </div>
          ) : null}
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-slate-950">
          Current officers
        </h2>
        {officers.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {officers.map((officer) => (
              <article
                className="rounded-xl border border-slate-200 bg-white p-5"
                key={officer.chapterOfficerId}
              >
                <p className="font-semibold text-slate-950">
                  {officer.fullName}
                </p>
                <p className="mt-1 text-sm font-medium text-teal-700">
                  {officer.position}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  AY {officer.academicYear}
                </p>
                {officer.email ? (
                  <p className="mt-3 text-sm text-slate-700">
                    {officer.email}
                  </p>
                ) : null}
                {officer.contactNumber ? (
                  <p className="mt-1 text-sm text-slate-700">
                    {officer.contactNumber}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
            Current officer information has not been added yet.
          </p>
        )}
      </section>
    </main>
  );
}
