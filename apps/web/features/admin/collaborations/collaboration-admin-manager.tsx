"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, EmptyState, LoadingState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  deleteAdminCollaborationPost,
  getAdminCollaborationPost,
  listAdminCollaborationPosts,
  setAdminCollaborationStatus,
} from "./api";
import type {
  AdminCollaborationPost,
  AdminCollaborationPostDetails,
} from "./types";
import {
  collaborationChapterLabel,
  collaborationResponseStatusClass,
  collaborationStatusClass,
  formatCollaborationDate,
} from "@/features/collaborations/format";

type Filter = "All" | "Open" | "Closed" | "Expired";

export function CollaborationAdminManager() {
  const [posts, setPosts] = useState<AdminCollaborationPost[]>([]);
  const [selected, setSelected] =
    useState<AdminCollaborationPostDetails | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteTarget, setDeleteTarget] =
    useState<AdminCollaborationPostDetails | null>(null);

  useEffect(() => {
    let cancelled = false;

    listAdminCollaborationPosts()
      .then((items) => {
        if (!cancelled) {
          setPosts(items);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load collaboration posts.",
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

  const visiblePosts = useMemo(
    () =>
      filter === "All"
        ? posts
        : posts.filter((post) => post.status === filter),
    [filter, posts],
  );

  async function refresh() {
    setPosts(await listAdminCollaborationPosts());
  }

  async function openPost(postId: string) {
    setDetailsLoading(true);
    setError("");
    setNotice("");

    try {
      setSelected(await getAdminCollaborationPost(postId));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load collaboration post.",
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  async function toggleStatus(post: AdminCollaborationPostDetails) {
    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      const nextStatus = post.status === "Open" ? "Closed" : "Open";
      const result = await setAdminCollaborationStatus(
        post.collaborationPostId,
        nextStatus,
      );
      setNotice(result.message);
      await refresh();
      setSelected(await getAdminCollaborationPost(post.collaborationPostId));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update collaboration status.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function removePost(post: AdminCollaborationPostDetails) {
    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      const result = await deleteAdminCollaborationPost(
        post.collaborationPostId,
      );
      setNotice(result.message);
      setSelected(null);
      setDeleteTarget(null);
      await refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete collaboration post.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-8">
        <LoadingState label="Loading collaboration moderation..." />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap gap-2">
        {(["All", "Open", "Closed", "Expired"] as Filter[]).map((item) => (
          <button
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              filter === item
                ? "bg-teal-700 text-white"
                : "border border-slate-300 bg-white text-slate-700"
            }`}
            key={item}
            onClick={() => setFilter(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-900">
            Collaboration posts
          </p>
          <div className="mt-4 max-h-[48rem] space-y-2 overflow-y-auto">
            {visiblePosts.length ? (
              visiblePosts.map((post) => (
                <button
                  className={`w-full rounded-lg border p-3 text-left ${
                    selected?.collaborationPostId === post.collaborationPostId
                      ? "border-teal-300 bg-teal-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                  key={post.collaborationPostId}
                  onClick={() => void openPost(post.collaborationPostId)}
                  type="button"
                >
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${collaborationStatusClass(
                        post.status,
                      )}`}
                    >
                      {post.status}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {post.responseCount} responses
                    </span>
                  </div>
                  <p className="mt-2 font-medium text-slate-950">
                    {post.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {collaborationChapterLabel(post.chapter)}
                  </p>
                </button>
              ))
            ) : (
              <p className="py-4 text-sm text-slate-500">
                No collaboration posts match this filter.
              </p>
            )}
          </div>
        </aside>

        <section>
          {detailsLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-600">Loading post...</p>
            </div>
          ) : selected ? (
            <div className="space-y-6">
              <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${collaborationStatusClass(
                          selected.status,
                        )}`}
                      >
                        {selected.status}
                      </span>
                      <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">
                        {selected.collaborationType}
                      </span>
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                      {selected.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {collaborationChapterLabel(selected.chapter)} ·{" "}
                      {formatCollaborationDate(selected.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selected.status !== "Expired" ? (
                      <button
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
                        disabled={actionLoading}
                        onClick={() => void toggleStatus(selected)}
                        type="button"
                      >
                        {selected.status === "Open" ? "Close post" : "Reopen post"}
                      </button>
                    ) : null}
                    <Button
                      disabled={actionLoading}
                      onClick={() => setDeleteTarget(selected)}
                      variant="danger"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <p className="mt-6 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {selected.description}
                </p>

                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Info label="Created by" value={`${selected.createdBy.firstName} ${selected.createdBy.lastName}`} />
                  <Info label="Responses" value={String(selected.responseCount)} />
                  <Info label="Location" value={selected.location ?? "Not specified"} />
                  <Info label="Expires" value={formatCollaborationDate(selected.expiresAt)} />
                </dl>
              </article>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Responses
                </h3>
                {selected.responses.length ? (
                  <div className="mt-4 space-y-3">
                    {selected.responses.map((response) => (
                      <article
                        className="rounded-lg border border-slate-200 p-4"
                        key={response.collaborationResponseId}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-950">
                              {collaborationChapterLabel(response.chapter)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {response.user.firstName} {response.user.lastName} ·{" "}
                              {response.user.email}
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
                          <p className="mt-3 text-sm text-slate-700">
                            {response.message}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    No chapter responses yet.
                  </p>
                )}
              </section>
            </div>
          ) : (
            <EmptyState
              description="Review post details and responses, then close, reopen, or delete the post when moderation is needed."
              title="Select a collaboration post"
            />
          )}
        </section>
      </div>
      <ConfirmDialog
        busy={actionLoading}
        confirmLabel="Delete post"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.title}"? This also removes its responses.`
            : ""
        }
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void removePost(deleteTarget);
          }
        }}
        open={Boolean(deleteTarget)}
        title="Delete collaboration post?"
      />
    </div>
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
