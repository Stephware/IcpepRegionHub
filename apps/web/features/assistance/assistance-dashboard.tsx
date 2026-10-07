"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  createAssistanceRequest,
  listChapterAssistanceRequests,
} from "./api";
import {
  assistanceCategories,
  assistancePriorities,
} from "./constants";
import {
  assistancePriorityClass,
  assistanceStatusClass,
  formatAssistanceDate,
} from "./format";
import type {
  AssistancePriority,
  AssistanceRequestSummary,
} from "./types";

export function AssistanceDashboard() {
  const [requests, setRequests] = useState<AssistanceRequestSummary[]>([]);
  const [form, setForm] = useState({
    category: "General",
    subject: "",
    description: "",
    priority: "Normal" as AssistancePriority,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    listChapterAssistanceRequests()
      .then((items) => {
        if (!cancelled) {
          setRequests(items);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load assistance requests.",
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const result = await createAssistanceRequest(form);
      setNotice(
        `${result.message} Ticket: ${result.request.ticketCode}`,
      );
      setForm({
        category: "General",
        subject: "",
        description: "",
        priority: "Normal",
      });

      const items = await listChapterAssistanceRequests();
      setRequests(items);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit assistance request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">
          Submit a request
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Send a chapter concern or request directly to the regional team.
        </p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-800">
            Category
            <select
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-blue-700"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
              value={form.category}
            >
              {assistanceCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-800">
            Subject
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-blue-700"
              maxLength={250}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  subject: event.target.value,
                }))
              }
              required
              value={form.subject}
            />
          </label>

          <label className="block text-sm font-medium text-slate-800">
            Priority
            <select
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-blue-700"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  priority: event.target.value as AssistancePriority,
                }))
              }
              value={form.priority}
            >
              {assistancePriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-800">
            Description
            <textarea
              className="mt-2 min-h-44 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-blue-700"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              required
              value={form.description}
            />
          </label>

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

          <button
            className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Submitting..." : "Submit request"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">
          Chapter request history
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Requests submitted by officers from your chapter appear here.
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-slate-600">Loading requests...</p>
        ) : !requests.length ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-medium text-slate-900">No requests yet.</p>
            <p className="mt-2 text-sm text-slate-600">
              Submitted assistance tickets for your chapter will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {requests.map((request) => (
              <Link
                className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow"
                href={`/assistance/${request.assistanceRequestId}`}
                key={request.assistanceRequestId}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${assistanceStatusClass(
                      request.status,
                    )}`}
                  >
                    {request.status}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${assistancePriorityClass(
                      request.priority,
                    )}`}
                  >
                    {request.priority}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    {request.category}
                  </span>
                </div>

                <h3 className="mt-3 font-semibold text-slate-950">
                  {request.subject}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {request.ticketCode} ·{" "}
                  {formatAssistanceDate(request.submittedAt)}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Submitted by {request.submittedBy.firstName}{" "}
                  {request.submittedBy.lastName}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
