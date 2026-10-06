"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getOpenCollaborationPost } from "./api";
import {
  collaborationChapterLabel,
  collaborationStatusClass,
  formatCollaborationDate,
} from "./format";
import type { CollaborationPost } from "./types";

export function CollaborationDetails() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<CollaborationPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getOpenCollaborationPost(params.id)
      .then((item) => {
        if (!cancelled) {
          setPost(item);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load collaboration post.",
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
  }, [params.id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-sm text-slate-600">
          Loading collaboration post...
        </p>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link
          className="text-sm font-medium text-teal-700"
          href="/collaborations"
        >
          ← Back to collaboration board
        </Link>
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Collaboration post was not found."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link
        className="text-sm font-medium text-teal-700"
        href="/collaborations"
      >
        ← Back to collaboration board
      </Link>

      <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">
            {post.collaborationType}
          </span>
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${collaborationStatusClass(
              post.status,
            )}`}
          >
            {post.status}
          </span>
        </div>

        <h1 className="mt-4 text-3xl font-semibold text-slate-950">
          {post.title}
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Posted by {post.createdBy.firstName} {post.createdBy.lastName} for{" "}
          {collaborationChapterLabel(post.chapter)}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {formatCollaborationDate(post.createdAt)}
        </p>

        <div className="mt-8 whitespace-pre-wrap border-y border-slate-200 py-6 text-base leading-7 text-slate-700">
          {post.description}
        </div>

        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          <Info label="School" value={post.chapter.schoolName} />
          <Info
            label="Event"
            value={post.eventName ?? "Not specified"}
          />
          <Info
            label="Event date"
            value={formatCollaborationDate(post.eventDate)}
          />
          <Info label="Location" value={post.location ?? "Not specified"} />
          <Info
            label="Post expires"
            value={formatCollaborationDate(post.expiresAt)}
          />
        </dl>

        <section className="mt-8 rounded-xl bg-slate-50 p-5">
          <h2 className="font-semibold text-slate-950">Contact information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Info label="Contact person" value={post.contactName ?? "Not provided"} />
            <Info label="Email" value={post.contactEmail ?? "Not provided"} />
            <Info
              label="Contact number"
              value={post.contactNumber ?? "Not provided"}
            />
          </div>
        </section>
      </article>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-800">{value}</dd>
    </div>
  );
}
