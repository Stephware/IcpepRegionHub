"use client";

import { useEffect, useState } from "react";
import { listPublicChapters } from "./api";
import { chapterOptionLabel } from "./display";
import type { Chapter } from "./types";

type ChapterSelectProps = {
  value: string;
  onChange(value: string): void;
  required?: boolean;
};

export function ChapterSelect({
  value,
  onChange,
  required = false,
}: ChapterSelectProps) {
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

  return (
    <>
      <select
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-teal-700"
        disabled={loading || Boolean(error)}
        id="chapterId"
        onChange={(event) => onChange(event.target.value)}
        required={required}
        value={value}
      >
        <option value="">
          {loading ? "Loading chapters..." : "Select your chapter"}
        </option>
        {chapters.map((chapter) => (
          <option key={chapter.chapterId} value={chapter.chapterId}>
            {chapterOptionLabel(chapter)}
          </option>
        ))}
      </select>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      {!loading && !error && !chapters.length ? (
        <p className="mt-2 text-xs text-amber-700">
          No active chapters are available for registration yet.
        </p>
      ) : null}
    </>
  );
}
