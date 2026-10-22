"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Alert, LoadingState } from "@/components/ui/feedback";
import { ListSearch } from "@/components/ui/list-search";
import { Pagination } from "@/components/ui/pagination";
import { useSearchPagination } from "@/lib/use-search-pagination";
import { OfficerPhoto } from "./officer-photo";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getPublicChapter, listCurrentChapterOfficers } from "./api";
import { chapterDisplayName } from "./display";
import type { Chapter, ChapterOfficer } from "./types";

export function ChapterDetails() {
  const params = useParams<{ id: string }>();
  const chapterId = params.id;
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [officers, setOfficers] = useState<ChapterOfficer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const officerList = useSearchPagination(officers, (officer) =>
    [officer.fullName, officer.position, officer.academicYear, officer.email].join(" "),
    8,
  );

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
        <LoadingState label="Loading chapter..." />
      </main>
    );
  }

  if (error || !chapter) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link className="text-sm font-medium text-blue-700" href="/chapters">
          ← Back to chapters
        </Link>
        <div className="mt-6">
          <Alert tone="error">{error || "Chapter was not found."}</Alert>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link className="text-sm font-medium text-blue-700" href="/chapters">
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
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-blue-50 text-2xl font-semibold text-blue-700">
              {chapter.acronym?.slice(0, 3) ?? "IC"}
            </div>
          )}

          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
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
                className="text-sm font-medium text-blue-700 hover:underline"
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
        {officers.length > 8 || officerList.query ? (
          <ListSearch label="Search current officers" placeholder="Officer name, position, or year" query={officerList.query} onQueryChange={officerList.setQuery} total={officerList.total} />
        ) : null}
        {officerList.total ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {officerList.items.map((officer) => (
              <article
                className="rounded-xl border border-slate-200 bg-white p-5"
                key={officer.chapterOfficerId}
              >
                <OfficerPhoto
                  fullName={officer.fullName}
                  photoUrl={officer.photoUrl}
                />
                <p className="mt-3 font-semibold text-slate-950">
                  {officer.fullName}
                </p>
                <p className="mt-1 text-sm font-medium text-blue-700">
                  {officer.position}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  AY {officer.academicYear}
                </p>
                {officer.email ? (
                  <p className="mt-3 text-sm text-slate-700">{officer.email}</p>
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
            {officers.length ? "No officers match your search." : "Current officer information has not been added yet."}
          </p>
        )}
        <Pagination label="Current officer pages" page={officerList.page} pageCount={officerList.pageCount} onPageChange={officerList.setPage} />
      </section>
    </main>
  );
}
