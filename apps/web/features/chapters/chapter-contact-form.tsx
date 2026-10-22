"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Alert, LoadingState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { apiFetch } from "@/lib/api/client";
import type { Chapter } from "./types";

export function ChapterContactForm() {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [form, setForm] = useState({
    officialEmail: "",
    contactNumber: "",
    facebookUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiFetch<Chapter>("/chapter/profile")
      .then((data) => {
        if (cancelled) return;
        setChapter(data);
        setForm({
          officialEmail: data.officialEmail ?? "",
          contactNumber: data.contactNumber ?? "",
          facebookUrl: data.facebookUrl ?? "",
        });
      })
      .catch((requestError) => {
        if (!cancelled)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load your chapter.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await apiFetch<{ message: string; chapter: Chapter }>(
        "/chapter/profile",
        { method: "PATCH", body: JSON.stringify(form) },
      );
      setChapter(result.chapter);
      setForm({
        officialEmail: result.chapter.officialEmail ?? "",
        contactNumber: result.chapter.contactNumber ?? "",
        facebookUrl: result.chapter.facebookUrl ?? "",
      });
      setNotice(result.message);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update chapter contacts.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading your chapter..." />;
  if (!chapter)
    return (
      <Alert tone="error">{error || "Your chapter is unavailable."}</Alert>
    );

  return (
    <form className="mt-8 space-y-5" onSubmit={save}>
      <p className="font-medium text-slate-900">
        {chapter.chapterName} · {chapter.schoolName}
      </p>
      <Field label="Official email">
        <Input
          type="email"
          value={form.officialEmail}
          onChange={(event) =>
            setForm({ ...form, officialEmail: event.target.value })
          }
        />
      </Field>
      <Field label="Contact number">
        <Input
          type="tel"
          maxLength={30}
          value={form.contactNumber}
          onChange={(event) =>
            setForm({ ...form, contactNumber: event.target.value })
          }
        />
      </Field>
      <Field label="Facebook link" hint="Use a full URL, including https://.">
        <Input
          type="url"
          value={form.facebookUrl}
          onChange={(event) =>
            setForm({ ...form, facebookUrl: event.target.value })
          }
        />
      </Field>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save chapter contacts"}
      </Button>
    </form>
  );
}
