"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getChapterAssistanceRequest } from "./api";
import {
  assistancePriorityClass,
  assistanceStatusClass,
  formatAssistanceDate,
} from "./format";
import type { AssistanceRequestDetails } from "./types";

export function AssistanceDetails() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<AssistanceRequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getChapterAssistanceRequest(params.id)
      .then((item) => {
        if (!cancelled) {
          setRequest(item);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load assistance request.",
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

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-sm text-slate-600">Loading request...</p>
      </main>
    );
  }

  if (error || !request) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link className="text-sm font-medium text-teal-700" href="/assistance">
          ← Back to assistance
        </Link>
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Assistance request was not found."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link className="text-sm font-medium text-teal-700" href="/assistance">
        ← Back to assistance
      </Link>

      <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
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

        <p className="mt-4 text-sm font-medium text-teal-700">
          {request.ticketCode}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">
          {request.subject}
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Submitted {formatAssistanceDate(request.submittedAt)} by{" "}
          {request.submittedBy.firstName} {request.submittedBy.lastName}
        </p>

        <div className="mt-8 border-y border-slate-200 py-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Request details
          </h2>
          <div className="mt-3 whitespace-pre-wrap text-base leading-7 text-slate-700">
            {request.description}
          </div>
        </div>

        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          <Info
            label="Chapter"
            value={
              request.chapter.acronym
                ? `${request.chapter.chapterName} (${request.chapter.acronym})`
                : request.chapter.chapterName
            }
          />
          <Info
            label="Assigned to"
            value={
              request.assignedTo
                ? `${request.assignedTo.firstName} ${request.assignedTo.lastName}`
                : "Not assigned yet"
            }
          />
        </dl>
      </article>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-slate-950">
          Request updates
        </h2>

        {request.updates.length ? (
          <div className="mt-4 space-y-4">
            {request.updates.map((update) => (
              <article
                className="rounded-xl border border-slate-200 bg-white p-5"
                key={update.updateId}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-950">
                    {update.user.firstName} {update.user.lastName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatAssistanceDate(update.createdAt)}
                  </p>
                </div>
                {update.newStatus ? (
                  <p className="mt-2 text-xs font-medium text-teal-700">
                    Status changed to {update.newStatus}
                  </p>
                ) : null}
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {update.message}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
            No public updates have been posted yet.
          </p>
        )}
      </section>
    </main>
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
