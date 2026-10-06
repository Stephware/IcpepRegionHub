"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAdminAnnouncements,
  setAnnouncementPinned,
  setAnnouncementPublished,
  updateAnnouncement,
} from "./api";
import { announcementExcerpt, formatAnnouncementDate } from "./format";
import type {
  AdminAnnouncement,
  AnnouncementInput,
} from "./types";

const emptyForm: AnnouncementInput = {
  title: "",
  content: "",
  category: "",
  visibility: "Public",
  coverImageUrl: "",
  externalLink: "",
  expiresAt: null,
};

function toFormDate(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function AnnouncementAdminManager() {
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [selected, setSelected] = useState<AdminAnnouncement | null>(null);
  const [form, setForm] = useState<AnnouncementInput>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadAnnouncements = useCallback(async () => {
    const items = await listAdminAnnouncements();
    setAnnouncements(items);
    return items;
  }, []);

  useEffect(() => {
    let cancelled = false;

    listAdminAnnouncements()
      .then((items) => {
        if (!cancelled) {
          setAnnouncements(items);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load announcements.",
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

  function updateField<K extends keyof AnnouncementInput>(
    field: K,
    value: AnnouncementInput[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startCreate() {
    setSelected(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
  }

  function selectAnnouncement(announcement: AdminAnnouncement) {
    setSelected(announcement);
    setForm({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      visibility: announcement.visibility,
      coverImageUrl: announcement.coverImageUrl ?? "",
      externalLink: announcement.externalLink ?? "",
      expiresAt: announcement.expiresAt
        ? toFormDate(announcement.expiresAt)
        : null,
    });
    setError("");
    setNotice("");
  }

  function showError(requestError: unknown, fallback: string) {
    setError(requestError instanceof Error ? requestError.message : fallback);
    setNotice("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload: AnnouncementInput = {
        ...form,
        expiresAt: form.expiresAt
          ? new Date(form.expiresAt).toISOString()
          : null,
      };

      const result = selected
        ? await updateAnnouncement(selected.announcementId, payload)
        : await createAnnouncement(payload);

      setSelected(result.announcement);
      setNotice(result.message);
      await loadAnnouncements();
    } catch (requestError) {
      showError(requestError, "Unable to save announcement.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(announcement: AdminAnnouncement) {
    setError("");
    setNotice("");

    try {
      const result = await setAnnouncementPublished(
        announcement.announcementId,
        !announcement.isPublished,
      );
      setNotice(result.message);
      setSelected(result.announcement);
      await loadAnnouncements();
    } catch (requestError) {
      showError(requestError, "Unable to change publication status.");
    }
  }

  async function togglePinned(announcement: AdminAnnouncement) {
    setError("");
    setNotice("");

    try {
      const result = await setAnnouncementPinned(
        announcement.announcementId,
        !announcement.isPinned,
      );
      setNotice(result.message);
      setSelected(result.announcement);
      await loadAnnouncements();
    } catch (requestError) {
      showError(requestError, "Unable to change pinned status.");
    }
  }

  async function removeAnnouncement(announcement: AdminAnnouncement) {
    if (
      !window.confirm(
        `Delete "${announcement.title}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setError("");
    setNotice("");

    try {
      const result = await deleteAnnouncement(announcement.announcementId);
      setNotice(result.message);
      setSelected(null);
      setForm(emptyForm);
      await loadAnnouncements();
    } catch (requestError) {
      showError(requestError, "Unable to delete announcement.");
    }
  }

  if (loading) {
    return <p className="mt-8 text-sm text-slate-600">Loading announcements...</p>;
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white"
          onClick={startCreate}
          type="button"
        >
          New announcement
        </button>

        <div className="mt-4 space-y-2">
          {announcements.length ? (
            announcements.map((announcement) => (
              <button
                className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                  selected?.announcementId === announcement.announcementId
                    ? "border-teal-300 bg-teal-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
                key={announcement.announcementId}
                onClick={() => selectAnnouncement(announcement)}
                type="button"
              >
                <span className="block truncate text-sm font-medium text-slate-950">
                  {announcement.title}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {announcement.category} · {announcement.visibility}
                </span>
                <span className="mt-2 flex flex-wrap gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      announcement.isPublished
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {announcement.isPublished ? "Published" : "Draft"}
                  </span>
                  {announcement.isPinned ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Pinned
                    </span>
                  ) : null}
                </span>
              </button>
            ))
          ) : (
            <p className="py-4 text-sm text-slate-500">
              No announcements have been created yet.
            </p>
          )}
        </div>
      </aside>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {error ? (
          <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="mb-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {notice}
          </p>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              {selected ? "Edit announcement" : "Create announcement"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              New announcements begin as drafts until you publish them.
            </p>
          </div>

          {selected ? (
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                onClick={() => void togglePublished(selected)}
                type="button"
              >
                {selected.isPublished ? "Unpublish" : "Publish"}
              </button>
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
                disabled={!selected.isPublished}
                onClick={() => void togglePinned(selected)}
                type="button"
              >
                {selected.isPinned ? "Unpin" : "Pin"}
              </button>
              <button
                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700"
                onClick={() => void removeAnnouncement(selected)}
                type="button"
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>

        {selected ? (
          <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              Status:{" "}
              <span className="font-medium text-slate-900">
                {selected.isPublished ? "Published" : "Draft"}
              </span>
              {selected.isPinned ? " · Pinned" : ""}
            </p>
            <p className="mt-1">
              Published: {formatAnnouncementDate(selected.publishedAt)}
            </p>
            <p className="mt-1">
              Preview: {announcementExcerpt(selected.content, 120)}
            </p>
          </div>
        ) : null}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <Field
            label="Title"
            onChange={(value) => updateField("title", value)}
            required
            value={form.title}
          />

          <label className="block text-sm font-medium text-slate-800">
            Content
            <textarea
              className="mt-2 min-h-56 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-700"
              onChange={(event) => updateField("content", event.target.value)}
              required
              value={form.content}
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Category"
              onChange={(value) => updateField("category", value)}
              placeholder="General, Event, Advisory..."
              required
              value={form.category}
            />

            <label className="text-sm font-medium text-slate-800">
              Visibility
              <select
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-700"
                onChange={(event) =>
                  updateField(
                    "visibility",
                    event.target.value as "Public" | "MembersOnly",
                  )
                }
                value={form.visibility}
              >
                <option value="Public">Public</option>
                <option value="MembersOnly">Members only</option>
              </select>
            </label>

            <Field
              label="Cover image URL"
              onChange={(value) => updateField("coverImageUrl", value)}
              value={form.coverImageUrl ?? ""}
            />
            <Field
              label="External link"
              onChange={(value) => updateField("externalLink", value)}
              value={form.externalLink ?? ""}
            />
            <Field
              label="Expiration"
              onChange={(value) => updateField("expiresAt", value || null)}
              type="datetime-local"
              value={form.expiresAt ?? ""}
            />
          </div>

          <button
            className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving
              ? "Saving..."
              : selected
                ? "Save changes"
                : "Create draft"}
          </button>
        </form>
      </section>
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
    <label className="block text-sm font-medium text-slate-800">
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
