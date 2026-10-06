"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ChapterSelect } from "@/features/chapters/chapter-select";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
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
        <Field label="First name">
          <Input
            id="firstName"
            onChange={(event) => updateField("firstName", event.target.value)}
            required
            value={form.firstName}
          />
        </Field>

        <Field label="Last name">
          <Input
            id="lastName"
            onChange={(event) => updateField("lastName", event.target.value)}
            required
            value={form.lastName}
          />
        </Field>
      </div>

      <Field label="Email">
        <Input
          autoComplete="email"
          id="registerEmail"
          onChange={(event) => updateField("email", event.target.value)}
          required
          type="email"
          value={form.email}
        />
      </Field>

      <Field label="Chapter">
        <ChapterSelect
          onChange={(value) => updateField("chapterId", value)}
          required
          value={form.chapterId}
        />
      </Field>

      <Field label="Password" hint="Use at least 8 characters.">
        <Input
          autoComplete="new-password"
          id="registerPassword"
          minLength={8}
          onChange={(event) => updateField("password", event.target.value)}
          required
          type="password"
          value={form.password}
        />
      </Field>

      {error ? <Alert tone="error">{error}</Alert> : null}

      {success ? (
        <Alert tone="success">
          <p>{success}</p>
          <p className="mt-1">
            A Regional Admin must approve the account before you can sign in.
          </p>
        </Alert>
      ) : null}

      <Button
        disabled={submitting || !form.chapterId}
        fullWidth
        type="submit"
      >
        {submitting ? "Submitting..." : "Register account"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        Already approved?{" "}
        <Link className="font-medium text-teal-700 hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
