"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import {
  createCollaborationResponse,
  getMyCollaborationResponse,
  getOpenCollaborationPost,
  withdrawCollaborationResponse,
} from "./api";
import {
  collaborationChapterLabel,
  collaborationResponseStatusClass,
  collaborationStatusClass,
  formatCollaborationDate,
} from "./format";
import type {
  CollaborationPost,
  CollaborationResponse,
} from "./types";

export function CollaborationDetails() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<CollaborationPost | null>(null);
  const [response, setResponse] = useState<CollaborationResponse | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const canRespond =
    user?.role === "ChapterOfficer" &&
    Boolean(user.chapterId) &&
    post?.chapter.chapterId !== user.chapterId;

  useEffect(() => {
    let cancelled = false;

    getOpenCollaborationPost(params.id)
      .then(async (item) => {
        if (cancelled) {
          return;
        }

        setPost(item);

        if (
          user?.role === "ChapterOfficer" &&
          user.chapterId &&
          item.chapter.chapterId !== user.chapterId
        ) {
          const existing = await getMyCollaborationResponse(params.id);

          if (!cancelled) {
            setResponse(existing);
          }
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
  }, [params.id, user?.chapterId, user?.role]);

  async function handleInterest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const result = await createCollaborationResponse(params.id, message);
      setResponse(result.response);
      setMessage("");
      setNotice(result.message);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit collaboration interest.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdraw() {
    if (!window.confirm("Withdraw your chapter's collaboration response?")) {
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const result = await withdrawCollaborationResponse(params.id);
      setResponse(null);
      setNotice(result.message);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to withdraw collaboration response.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-sm text-slate-600">
          Loading collaboration post...
        </p>
      </main>
    );
  }

  if (error && !post) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link
          className="text-sm font-medium text-teal-700"
          href="/collaborations"
        >
          ← Back to collaboration board
        </Link>
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      </main>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link
        className="text-sm font-medium text-teal-700"
        href="/collaborations"
      >
        ← Back to collaboration board
      </Link>

      {error ? (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </p>
      ) : null}

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
          <Info label="Event" value={post.eventName ?? "Not specified"} />
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
            <Info
              label="Contact person"
              value={post.contactName ?? "Not provided"}
            />
            <Info label="Email" value={post.contactEmail ?? "Not provided"} />
            <Info
              label="Contact number"
              value={post.contactNumber ?? "Not provided"}
            />
          </div>
        </section>
      </article>

      {canRespond ? (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            Chapter interest
          </h2>

          {response ? (
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${collaborationResponseStatusClass(
                    response.status,
                  )}`}
                >
                  {response.status}
                </span>
                <span className="text-xs text-slate-500">
                  Submitted {formatCollaborationDate(response.createdAt)}
                </span>
              </div>

              {response.message ? (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {response.message}
                </p>
              ) : null}

              {response.status === "Pending" ? (
                <button
                  className="mt-5 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 disabled:opacity-60"
                  disabled={submitting}
                  onClick={() => void handleWithdraw()}
                  type="button"
                >
                  Withdraw interest
                </button>
              ) : null}
            </div>
          ) : (
            <form className="mt-4" onSubmit={handleInterest}>
              <p className="text-sm text-slate-600">
                Let the posting chapter know that your chapter is interested.
                Only one response can be submitted per chapter.
              </p>
              <label className="mt-4 block text-sm font-medium text-slate-800">
                Optional message
                <textarea
                  className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-700"
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Briefly explain how your chapter would like to collaborate."
                  value={message}
                />
              </label>
              <button
                className="mt-4 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Submitting..." : "I'm interested"}
              </button>
            </form>
          )}
        </section>
      ) : null}

      {user?.role === "ChapterOfficer" &&
      user.chapterId === post.chapter.chapterId &&
      user.userId === post.createdBy.userId ? (
        <div className="mt-8">
          <Link
            className="inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
            href={`/collaborations/manage/${post.collaborationPostId}`}
          >
            Manage responses
          </Link>
        </div>
      ) : null}
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
