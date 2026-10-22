"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "./auth-context";
import type { AuthUser } from "./types";

export function AccountProfile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await apiFetch<{ message: string; user: AuthUser }>(
        "/auth/me",
        { method: "PATCH", body: JSON.stringify(form) },
      );
      setForm({
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
      });
      await refreshUser();
      setNotice(result.message);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update your account.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={save}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name">
          <Input
            required
            maxLength={100}
            autoComplete="given-name"
            value={form.firstName}
            onChange={(event) =>
              setForm({ ...form, firstName: event.target.value })
            }
          />
        </Field>
        <Field label="Last name">
          <Input
            required
            maxLength={100}
            autoComplete="family-name"
            value={form.lastName}
            onChange={(event) =>
              setForm({ ...form, lastName: event.target.value })
            }
          />
        </Field>
      </div>
      <Field label="Email">
        <Input
          required
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
      </Field>
      <p className="text-sm text-slate-600">
        Account role: {user?.role.replace(/([a-z])([A-Z])/g, "$1 $2")}
        {user?.facultyDesignation ? ` · ${user.facultyDesignation}` : ""}.
        Contact a Regional Admin to change your role or institution.
      </p>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save account"}
      </Button>
    </form>
  );
}
