"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getMyCollaborationPost,
  listCollaborationResponses,
  updateCollaborationResponseStatus,
} from "./api";
import {
  collaborationChapterLabel,
  collaborationResponseStatusClass,
  formatCollaborationDate,
} from "./format";
import type {
  CollaborationPost,
  CollaborationResponse,
} from "./types";

export function CollaborationResponseManager() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<CollaborationPost | null>(null);
  const [responses, setResponses] = useState<CollaborationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getMyCollaborationPost(params.id),
      listCollaborationResponses(params.id),
    ])
      .then(([postResult, responseItems]) => {
        if (!cancelled) {
          setPost(postResult);
          setResponses(responseItems);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load collaboration responses.",
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

  async function updateStatus(
    response: CollaborationResponse,
    status: "Accepted" | "Declined",
  ) {
    setActionId(response.collaborationResponseId);
    setError("");
    setNotice("");

    try {
      const result = await updateCollaborationResponseStatus(
        params.id,
        response.collaborationResponseId,
        status,
      );
      setNotice(result.message);
      setResponses((current) =>
        current.map((item) =>
          item.collaborationResponseId ===
          result.response.collaborationResponseId
            ? result.response
            : item,
        ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update collaboration response.",
      );
    } finally {
      setActionId(null);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm text-slate-600">
          Loading collaboration responses...
        </p>
      </main>
    );
  }

  if (error && !post) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
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
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link
        className="text-sm font-medium text-teal-700"
        href="/collaborations"
      >
        ← Back to collaboration board
      </Link>

      <p className="mt-6 text-sm font-medium uppercase tracking-wide text-teal-700">
        Collaboration Management
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">
        Responses for {post.title}
      </h1>
      <p className="mt-3 text-sm text-slate-600">
        Posted for {collaborationChapterLabel(post.chapter)}
      </p>

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

      {responses.length ? (
        <div className="mt-8 space-y-4">
          {responses.map((response) => (
            <article
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              key={response.collaborationResponseId}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-slate-950">
                    {collaborationChapterLabel(response.chapter)}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Submitted by {response.user.firstName}{" "}
                    {response.user.lastName} · {response.user.email}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatCollaborationDate(response.createdAt)}
                  </p>
                </div>

                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${collaborationResponseStatusClass(
                    response.status,
                  )}`}
                >
                  {response.status}
                </span>
              </div>

              {response.message ? (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {response.message}
                </p>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  No message was included.
                </p>
              )}

              {response.status === "Pending" ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                    disabled={
                      actionId === response.collaborationResponseId
                    }
                    onClick={() =>
                      void updateStatus(response, "Accepted")
                    }
                    type="button"
                  >
                    Accept
                  </button>
                  <button
                    className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 disabled:opacity-60"
                    disabled={
                      actionId === response.collaborationResponseId
                    }
                    onClick={() =>
                      void updateStatus(response, "Declined")
                    }
                    type="button"
                  >
                    Decline
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-medium text-slate-900">
            No chapter responses yet.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Interested chapters will appear here after they respond.
          </p>
        </div>
      )}
    </main>
  );
}
