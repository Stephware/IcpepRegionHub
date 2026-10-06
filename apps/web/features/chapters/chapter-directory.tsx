"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Alert, EmptyState, LoadingState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form-controls";
import { Pagination } from "@/components/ui/pagination";
import { listPublicChapters } from "./api";
import { chapterDisplayName } from "./display";
import type { Chapter } from "./types";

const pageSize = 6;

export function ChapterDirectory() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
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

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return chapters;
    }

    return chapters.filter((chapter) =>
      [
        chapter.schoolName,
        chapter.chapterName,
        chapter.acronym ?? "",
        chapter.address ?? "",
      ].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [chapters, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  function handleSearch(value: string) {
    setQuery(value);
    setPage(1);
  }

  if (loading) {
    return (
      <div className="mt-8">
        <LoadingState label="Loading chapters..." />
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
      <div className="max-w-xl">
        <label className="text-sm font-medium text-slate-800">
          Search chapters
          <Input
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="School, chapter, acronym, or location"
            type="search"
            value={query}
          />
        </label>
      </div>

      {!filtered.length ? (
        <div className="mt-6">
          <EmptyState
            description={
              query
                ? "Try a different school, chapter, acronym, or location."
                : "Active ICpEP Region 3 chapters will appear here."
            }
            title={query ? "No chapters match your search." : "No active chapters yet."}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {visible.map((chapter) => (
              <Link
                href={`/chapters/${chapter.chapterId}`}
                key={chapter.chapterId}
              >
                <Card className="h-full p-5 transition hover:border-teal-300 hover:shadow">
                  <div className="flex gap-4">
                    {chapter.logoUrl ? (
                      <img
                        alt={`${chapter.chapterName} logo`}
                        className="h-16 w-16 rounded-lg border border-slate-200 object-contain"
                        src={chapter.logoUrl}
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-lg font-semibold text-teal-700">
                        {chapter.acronym?.slice(0, 3) ?? "IC"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="font-semibold text-slate-950">
                        {chapterDisplayName(chapter)}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        {chapter.schoolName}
                      </p>
                      {chapter.address ? (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                          {chapter.address}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <Pagination
            onPageChange={setPage}
            page={safePage}
            pageCount={pageCount}
          />
        </>
      )}
    </div>
  );
}
