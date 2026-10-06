"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import {
  closeCollaborationPost,
  createCollaborationPost,
  deleteCollaborationPost,
  listMyCollaborationPosts,
  listOpenCollaborationPosts,
  updateCollaborationPost,
} from "./api";
import {
  collaborationChapterLabel,
  collaborationExcerpt,
  collaborationStatusClass,
  formatCollaborationDate,
} from "./format";
import type {
  CollaborationPost,
  CollaborationPostInput,
} from "./types";

const emptyForm: CollaborationPostInput = {
  collaborationType: "",
  title: "",
  description: "",
  eventName: "",
  eventDate: null,
  location: "",
  contactName: "",
  contactEmail: "",
  contactNumber: "",
  expiresAt: null,
};

function toLocalInput(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function toIsoOrNull(value: string | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

export function CollaborationBoard() {
  const { user } = useAuth();
  const canManage = user?.role === "ChapterOfficer";
  const [openPosts, setOpenPosts] = useState<CollaborationPost[]>([]);
  const [myPosts, setMyPosts] = useState<CollaborationPost[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [selected, setSelected] = useState<CollaborationPost | null>(null);
  const [form, setForm] = useState<CollaborationPostInput>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      listOpenCollaborationPosts(),
      canManage ? listMyCollaborationPosts() : Promise.resolve([]),
    ])
      .then(([openItems, ownItems]) => {
        if (!cancelled) {
          setOpenPosts(openItems);
          setMyPosts(ownItems);
          setTypes(
            [...new Set(openItems.map((post) => post.collaborationType))].sort(
              (left, right) => left.localeCompare(right),
            ),
          );
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
  }, [canManage]);

  const visiblePosts = useMemo(
    () =>
      typeFilter
        ? openPosts.filter(
            (post) =>
              post.collaborationType.toLowerCase() === typeFilter.toLowerCase(),
          )
        : openPosts,
    [openPosts, typeFilter],
  );

  function updateField<K extends keyof CollaborationPostInput>(
    field: K,
    value: CollaborationPostInput[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function showError(requestError: unknown, fallback: string) {
    setError(requestError instanceof Error ? requestError.message : fallback);
    setNotice("");
  }

  function startCreate() {
    setSelected(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
  }

  function startEdit(post: CollaborationPost) {
    setSelected(post);
    setForm({
      collaborationType: post.collaborationType,
      title: post.title,
      description: post.description,
      eventName: post.eventName ?? "",
      eventDate: toLocalInput(post.eventDate) || null,
      location: post.location ?? "",
      contactName: post.contactName ?? "",
      contactEmail: post.contactEmail ?? "",
      contactNumber: post.contactNumber ?? "",
      expiresAt: toLocalInput(post.expiresAt) || null,
    });
    setError("");
    setNotice("");
  }

  async function refreshPosts() {
    const [openItems, ownItems] = await Promise.all([
      listOpenCollaborationPosts(),
      canManage ? listMyCollaborationPosts() : Promise.resolve([]),
    ]);

    setOpenPosts(openItems);
    setMyPosts(ownItems);
    setTypes(
      [...new Set(openItems.map((post) => post.collaborationType))].sort(
        (left, right) => left.localeCompare(right),
      ),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload: CollaborationPostInput = {
        ...form,
        eventDate: toIsoOrNull(form.eventDate),
        expiresAt: toIsoOrNull(form.expiresAt),
      };

      const result = selected
        ? await updateCollaborationPost(selected.collaborationPostId, payload)
        : await createCollaborationPost(payload);

      setNotice(result.message);
      setSelected(result.post);
      setForm({
        collaborationType: result.post.collaborationType,
        title: result.post.title,
        description: result.post.description,
        eventName: result.post.eventName ?? "",
        eventDate: toLocalInput(result.post.eventDate) || null,
        location: result.post.location ?? "",
        contactName: result.post.contactName ?? "",
        contactEmail: result.post.contactEmail ?? "",
        contactNumber: result.post.contactNumber ?? "",
        expiresAt: toLocalInput(result.post.expiresAt) || null,
      });
      await refreshPosts();
    } catch (requestError) {
      showError(requestError, "Unable to save collaboration post.");
    } finally {
      setSaving(false);
    }
  }

  async function closePost(post: CollaborationPost) {
    if (!window.confirm(`Close "${post.title}"?`)) {
      return;
    }

    setError("");
    setNotice("");

    try {
      const result = await closeCollaborationPost(post.collaborationPostId);
      setNotice(result.message);

      if (selected?.collaborationPostId === post.collaborationPostId) {
        setSelected(result.post);
      }

      await refreshPosts();
    } catch (requestError) {
      showError(requestError, "Unable to close collaboration post.");
    }
  }

  async function removePost(post: CollaborationPost) {
    if (
      !window.confirm(
        `Delete "${post.title}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setError("");
    setNotice("");

    try {
      const result = await deleteCollaborationPost(post.collaborationPostId);
      setNotice(result.message);

      if (selected?.collaborationPostId === post.collaborationPostId) {
        startCreate();
      }

      await refreshPosts();
    } catch (requestError) {
      showError(requestError, "Unable to delete collaboration post.");
    }
  }

  if (loading) {
    return (
      <p className="mt-8 text-sm text-slate-600">
        Loading collaboration board...
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-10">
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </p>
      ) : null}

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Open collaboration opportunities
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Browse active collaboration posts from ICpEP.se chapters across
              Region 3.
            </p>
          </div>

          <label className="text-sm font-medium text-slate-800">
            Collaboration type
            <select
              className="mt-2 min-w-56 rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-700"
              onChange={(event) => setTypeFilter(event.target.value)}
              value={typeFilter}
            >
              <option value="">All types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>

        {visiblePosts.length ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visiblePosts.map((post) => (
              <Link
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow"
                href={`/collaborations/${post.collaborationPostId}`}
                key={post.collaborationPostId}
              >
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

                <h3 className="mt-4 text-lg font-semibold text-slate-950">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {collaborationExcerpt(post.description)}
                </p>

                <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <p>{collaborationChapterLabel(post.chapter)}</p>
                  <p className="mt-1">
                    Posted {formatCollaborationDate(post.createdAt)}
                  </p>
                  {post.eventDate ? (
                    <p className="mt-1">
                      Event: {formatCollaborationDate(post.eventDate)}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-medium text-slate-900">
              No open collaboration posts.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Try another type or check again when chapters post new
              opportunities.
            </p>
          </div>
        )}
      </section>

      {canManage ? (
        <section className="grid gap-8 xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  My collaboration posts
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Manage the collaboration posts that you created.
                </p>
              </div>
              <button
                className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white"
                onClick={startCreate}
                type="button"
              >
                New post
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {myPosts.length ? (
                myPosts.map((post) => (
                  <article
                    className={`rounded-xl border bg-white p-4 shadow-sm ${
                      selected?.collaborationPostId === post.collaborationPostId
                        ? "border-teal-300"
                        : "border-slate-200"
                    }`}
                    key={post.collaborationPostId}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${collaborationStatusClass(
                              post.status,
                            )}`}
                          >
                            {post.status}
                          </span>
                          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                            {post.collaborationType}
                          </span>
                        </div>
                        <h3 className="mt-3 font-semibold text-slate-950">
                          {post.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Created {formatCollaborationDate(post.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.status === "Open" ? (
                        <>
                          <button
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                            onClick={() => startEdit(post)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                            onClick={() => void closePost(post)}
                            type="button"
                          >
                            Close
                          </button>
                        </>
                      ) : null}
                      <button
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700"
                        onClick={() => void removePost(post)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
                  You have not created a collaboration post yet.
                </p>
              )}
            </div>
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              {selected ? "Edit collaboration post" : "Create collaboration post"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Share a specific opportunity where another Region 3 chapter can
              participate or coordinate with your chapter.
            </p>

            <form
              className="mt-6 grid gap-5 sm:grid-cols-2"
              onSubmit={handleSubmit}
            >
              <Field
                label="Collaboration type"
                onChange={(value) => updateField("collaborationType", value)}
                placeholder="Joint Event, Resource Sharing..."
                required
                value={form.collaborationType}
              />

              <Field
                label="Title"
                onChange={(value) => updateField("title", value)}
                required
                value={form.title}
              />

              <label className="text-sm font-medium text-slate-800 sm:col-span-2">
                Description
                <textarea
                  className="mt-2 min-h-40 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-700"
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  required
                  value={form.description}
                />
              </label>

              <Field
                label="Event name"
                onChange={(value) => updateField("eventName", value)}
                value={form.eventName ?? ""}
              />
              <Field
                label="Event date"
                onChange={(value) => updateField("eventDate", value || null)}
                type="datetime-local"
                value={form.eventDate ?? ""}
              />
              <Field
                label="Location"
                onChange={(value) => updateField("location", value)}
                value={form.location ?? ""}
              />
              <Field
                label="Expiration"
                onChange={(value) => updateField("expiresAt", value || null)}
                type="datetime-local"
                value={form.expiresAt ?? ""}
              />
              <Field
                label="Contact name"
                onChange={(value) => updateField("contactName", value)}
                value={form.contactName ?? ""}
              />
              <Field
                label="Contact email"
                onChange={(value) => updateField("contactEmail", value)}
                type="email"
                value={form.contactEmail ?? ""}
              />
              <Field
                label="Contact number"
                onChange={(value) => updateField("contactNumber", value)}
                value={form.contactNumber ?? ""}
              />

              <div className="flex gap-2 sm:col-span-2">
                <button
                  className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                  disabled={saving}
                  type="submit"
                >
                  {saving
                    ? "Saving..."
                    : selected
                      ? "Save changes"
                      : "Create post"}
                </button>
                {selected ? (
                  <button
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700"
                    onClick={startCreate}
                    type="button"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>
          </section>
        </section>
      ) : null}
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange(value: string): void;
  type?: string;
  required?: boolean;
  placeholder?: string;
};

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: FieldProps) {
  return (
    <label className="text-sm font-medium text-slate-800">
      {label}
      <input
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-700"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}
