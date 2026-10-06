"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ChapterSelect } from "@/features/chapters/chapter-select";
import { useAuth } from "./auth-context";

export function RegisterForm() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    chapterId: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const result = await register(form);
      setSuccess(result.message);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        chapterId: "",
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit registration.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-800" htmlFor="firstName">
            First name
          </label>
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-teal-700"
            id="firstName"
            onChange={(event) => updateField("firstName", event.target.value)}
            required
            value={form.firstName}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-800" htmlFor="lastName">
            Last name
          </label>
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-teal-700"
            id="lastName"
            onChange={(event) => updateField("lastName", event.target.value)}
            required
            value={form.lastName}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-800" htmlFor="registerEmail">
          Email
        </label>
        <input
          autoComplete="email"
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-teal-700"
          id="registerEmail"
          onChange={(event) => updateField("email", event.target.value)}
          required
          type="email"
          value={form.email}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-800" htmlFor="chapterId">
          Chapter
        </label>
        <ChapterSelect
          onChange={(value) => updateField("chapterId", value)}
          required
          value={form.chapterId}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-800" htmlFor="registerPassword">
          Password
        </label>
        <input
          autoComplete="new-password"
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-teal-700"
          id="registerPassword"
          minLength={8}
          onChange={(event) => updateField("password", event.target.value)}
          required
          type="password"
          value={form.password}
        />
        <p className="mt-2 text-xs text-slate-500">Use at least 8 characters.</p>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <div className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
          <p>{success}</p>
          <p className="mt-1">
            A Regional Admin must approve the account before you can sign in.
          </p>
        </div>
      ) : null}

      <button
        className="w-full rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={submitting || !form.chapterId}
        type="submit"
      >
        {submitting ? "Submitting..." : "Register account"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Already approved?{" "}
        <Link className="font-medium text-teal-700" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
