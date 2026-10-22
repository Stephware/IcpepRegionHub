"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ChapterSelect } from "@/features/chapters/chapter-select";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form-controls";
import { useAuth } from "./auth-context";
import {
  facultyDesignations,
  type FacultyDesignation,
  type PublicRegistrationRole,
} from "./types";
import {
  registrationErrors,
  registrationServerErrors,
} from "./registration-validation";

export function RegisterForm() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    role: "ChapterOfficer" as PublicRegistrationRole,
    facultyDesignation: "" as FacultyDesignation | "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    chapterId: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof typeof form, string>>
  >({});
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
    const errors = registrationErrors(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setSubmitting(true);

    try {
      const result = await register({
        ...form,
        facultyDesignation:
          form.role === "FacultyRepresentative"
            ? (form.facultyDesignation as FacultyDesignation)
            : undefined,
      });
      setSuccess(result.message);
      setForm({
        role: "ChapterOfficer",
        facultyDesignation: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        chapterId: "",
      });
    } catch (requestError) {
      setFieldErrors(
        registrationServerErrors(
          requestError instanceof Error ? requestError.message : "",
        ),
      );
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
    <form className="mt-8 space-y-5" noValidate onSubmit={handleSubmit}>
      <Field label="Register as" error={fieldErrors.role}>
        <Select
          value={form.role}
          onChange={(event) => updateField("role", event.target.value)}
        >
          <option value="ChapterOfficer">Chapter Officer</option>
          <option value="FacultyRepresentative">Faculty Representative</option>
        </Select>
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" error={fieldErrors.firstName}>
          <Input
            autoComplete="given-name"
            id="firstName"
            onChange={(event) => updateField("firstName", event.target.value)}
            required
            value={form.firstName}
          />
        </Field>

        <Field label="Last name" error={fieldErrors.lastName}>
          <Input
            autoComplete="family-name"
            id="lastName"
            onChange={(event) => updateField("lastName", event.target.value)}
            required
            value={form.lastName}
          />
        </Field>
      </div>

      <Field label="Email" error={fieldErrors.email}>
        <Input
          autoComplete="email"
          id="registerEmail"
          onChange={(event) => updateField("email", event.target.value)}
          required
          type="email"
          value={form.email}
        />
      </Field>

      <Field label="Affiliated institution" error={fieldErrors.chapterId}>
        <ChapterSelect
          onChange={(value) => updateField("chapterId", value)}
          required
          value={form.chapterId}
        />
      </Field>

      {form.role === "FacultyRepresentative" ? (
        <Field
          label="Faculty designation"
          error={fieldErrors.facultyDesignation}
        >
          <Select
            required
            value={form.facultyDesignation}
            onChange={(event) =>
              updateField("facultyDesignation", event.target.value)
            }
          >
            <option value="">Select your designation</option>
            {facultyDesignations.map((designation) => (
              <option key={designation} value={designation}>
                {designation}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <Field
        label="Password"
        hint="Use at least 8 characters."
        error={fieldErrors.password}
      >
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

      <Button disabled={submitting} fullWidth type="submit">
        {submitting ? "Submitting..." : "Register account"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        Already approved?{" "}
        <Link
          className="font-medium text-blue-700 hover:underline"
          href="/login"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
