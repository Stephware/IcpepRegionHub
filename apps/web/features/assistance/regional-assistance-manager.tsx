"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  addRegionalAssistanceUpdate,
  assignRegionalAssistanceRequest,
  getRegionalAssistanceRequest,
  listRegionalAssignees,
  listRegionalAssistanceRequests,
  updateRegionalAssistancePriority,
  updateRegionalAssistanceStatus,
} from "./api";
import {
  assistancePriorityClass,
  assistanceStatusClass,
  formatAssistanceDate,
} from "./format";
import {
  assistancePriorities,
} from "./constants";
import {
  countAssistanceStatuses,
  nextAssistanceStatuses,
} from "./workflow";
import type {
  AssistancePriority,
  AssistanceRequestSummary,
  AssistanceStatus,
  RegionalAssignee,
  RegionalAssistanceFilters,
  RegionalAssistanceRequestDetails,
} from "./types";

const statuses: AssistanceStatus[] = [
  "Submitted",
  "Under Review",
  "In Progress",
  "Resolved",
  "Closed",
];

export function RegionalAssistanceManager() {
  const [allRequests, setAllRequests] = useState<AssistanceRequestSummary[]>([]);
  const [requests, setRequests] = useState<AssistanceRequestSummary[]>([]);
  const [assignees, setAssignees] = useState<RegionalAssignee[]>([]);
  const [selected, setSelected] =
    useState<RegionalAssistanceRequestDetails | null>(null);
  const [filters, setFilters] = useState<RegionalAssistanceFilters>({});
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadOverview = useCallback(async () => {
    const [requestItems, userItems] = await Promise.all([
      listRegionalAssistanceRequests(),
      listRegionalAssignees(),
    ]);

    setAllRequests(requestItems);
    setRequests(requestItems);
    setAssignees(userItems);
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      listRegionalAssistanceRequests(),
      listRegionalAssignees(),
    ])
      .then(([requestItems, userItems]) => {
        if (!cancelled) {
          setAllRequests(requestItems);
          setRequests(requestItems);
          setAssignees(userItems);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load regional assistance requests.",
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

  const chapterOptions = useMemo(() => {
    const unique = new Map<string, AssistanceRequestSummary["chapter"]>();

    for (const request of allRequests) {
      unique.set(request.chapter.chapterId, request.chapter);
    }

    return [...unique.values()].sort((left, right) =>
      left.schoolName.localeCompare(right.schoolName),
    );
  }, [allRequests]);

  const counts = useMemo(
    () => countAssistanceStatuses(allRequests.map((request) => request.status)),
    [allRequests],
  );

  async function openRequest(requestId: string) {
    setDetailsLoading(true);
    setError("");
    setNotice("");

    try {
      const item = await getRegionalAssistanceRequest(requestId);
      setSelected(item);
      setReply("");
      setInternalNote("");
      setStatusMessage("");
    } catch (requestError) {
      showError(requestError, "Unable to load request details.");
    } finally {
      setDetailsLoading(false);
    }
  }

  async function refreshData(requestId?: string) {
    const [allItems, filteredItems] = await Promise.all([
      listRegionalAssistanceRequests(),
      listRegionalAssistanceRequests(filters),
    ]);

    setAllRequests(allItems);
    setRequests(filteredItems);

    if (requestId) {
      setSelected(await getRegionalAssistanceRequest(requestId));
    }
  }

  function showError(requestError: unknown, fallback: string) {
    setError(requestError instanceof Error ? requestError.message : fallback);
    setNotice("");
  }

  async function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      setRequests(await listRegionalAssistanceRequests(filters));
    } catch (requestError) {
      showError(requestError, "Unable to filter requests.");
    }
  }

  async function clearFilters() {
    const cleared: RegionalAssistanceFilters = {};
    setFilters(cleared);
    setError("");
    setNotice("");

    try {
      setRequests(await listRegionalAssistanceRequests(cleared));
    } catch (requestError) {
      showError(requestError, "Unable to load requests.");
    }
  }

  async function assignTo(userId: string) {
    if (!selected) {
      return;
    }

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      const result = await assignRegionalAssistanceRequest(
        selected.assistanceRequestId,
        userId || null,
      );
      setNotice(result.message);
      await refreshData(selected.assistanceRequestId);
    } catch (requestError) {
      showError(requestError, "Unable to assign request.");
    } finally {
      setActionLoading(false);
    }
  }

  async function changePriority(priority: AssistancePriority) {
    if (!selected) {
      return;
    }

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      const result = await updateRegionalAssistancePriority(
        selected.assistanceRequestId,
        priority,
      );
      setNotice(result.message);
      await refreshData(selected.assistanceRequestId);
    } catch (requestError) {
      showError(requestError, "Unable to update priority.");
    } finally {
      setActionLoading(false);
    }
  }

  async function postUpdate(
    event: FormEvent<HTMLFormElement>,
    internal: boolean,
  ) {
    event.preventDefault();

    if (!selected) {
      return;
    }

    const message = internal ? internalNote : reply;

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      const result = await addRegionalAssistanceUpdate(
        selected.assistanceRequestId,
        message,
        internal,
      );
      setNotice(result.message);

      if (internal) {
        setInternalNote("");
      } else {
        setReply("");
      }

      await refreshData(selected.assistanceRequestId);
    } catch (requestError) {
      showError(
        requestError,
        internal ? "Unable to add internal note." : "Unable to post update.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function changeStatus(status: AssistanceStatus) {
    if (!selected) {
      return;
    }

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      const result = await updateRegionalAssistanceStatus(
        selected.assistanceRequestId,
        status,
        statusMessage,
      );
      setNotice(result.message);
      setStatusMessage("");
      await refreshData(selected.assistanceRequestId);
    } catch (requestError) {
      showError(requestError, "Unable to update request status.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <p className="mt-8 text-sm text-slate-600">
        Loading regional assistance dashboard...
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Open requests" value={counts.open} />
        <Metric label="New submissions" value={counts.submitted} />
        <Metric label="Being handled" value={counts.inProgress} />
        <Metric label="Resolved / closed" value={counts.resolved} />
      </section>

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

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <form
          className="grid gap-4 md:grid-cols-4"
          onSubmit={applyFilters}
        >
          <FilterSelect
            label="Status"
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                status: value
                  ? (value as AssistanceStatus)
                  : undefined,
              }))
            }
            options={statuses}
            value={filters.status ?? ""}
          />
          <FilterSelect
            label="Priority"
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                priority: value
                  ? (value as AssistancePriority)
                  : undefined,
              }))
            }
            options={[...assistancePriorities]}
            value={filters.priority ?? ""}
          />

          <label className="text-sm font-medium text-slate-800">
            Chapter
            <select
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-700"
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  chapterId: event.target.value || undefined,
                }))
              }
              value={filters.chapterId ?? ""}
            >
              <option value="">All chapters</option>
              {chapterOptions.map((chapter) => (
                <option key={chapter.chapterId} value={chapter.chapterId}>
                  {chapter.acronym
                    ? `${chapter.acronym} — ${chapter.schoolName}`
                    : chapter.schoolName}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button
              className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white"
              type="submit"
            >
              Apply filters
            </button>
            <button
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700"
              onClick={() => void clearFilters()}
              type="button"
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-950">Requests</h2>
            <span className="text-xs text-slate-500">
              {requests.length} shown
            </span>
          </div>

          <div className="mt-4 max-h-[52rem] space-y-3 overflow-y-auto pr-1">
            {requests.length ? (
              requests.map((request) => (
                <button
                  className={`w-full rounded-lg border p-4 text-left transition ${
                    selected?.assistanceRequestId ===
                    request.assistanceRequestId
                      ? "border-teal-300 bg-teal-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                  key={request.assistanceRequestId}
                  onClick={() =>
                    void openRequest(request.assistanceRequestId)
                  }
                  type="button"
                >
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${assistanceStatusClass(
                        request.status,
                      )}`}
                    >
                      {request.status}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${assistancePriorityClass(
                        request.priority,
                      )}`}
                    >
                      {request.priority}
                    </span>
                  </div>
                  <p className="mt-3 font-medium text-slate-950">
                    {request.subject}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {request.ticketCode}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {request.chapter.acronym ??
                      request.chapter.chapterName}
                    {" · "}
                    {formatAssistanceDate(request.submittedAt)}
                  </p>
                </button>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-600">
                No requests match the selected filters.
              </p>
            )}
          </div>
        </aside>

        <section>
          {detailsLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-600">
                Loading request details...
              </p>
            </div>
          ) : selected ? (
            <div className="space-y-6">
              <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-teal-700">
                      {selected.ticketCode}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                      {selected.subject}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {selected.chapter.chapterName} · Submitted by{" "}
                      {selected.submittedBy.firstName}{" "}
                      {selected.submittedBy.lastName}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${assistanceStatusClass(
                        selected.status,
                      )}`}
                    >
                      {selected.status}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${assistancePriorityClass(
                        selected.priority,
                      )}`}
                    >
                      {selected.priority}
                    </span>
                  </div>
                </div>

                <div className="mt-6 whitespace-pre-wrap border-y border-slate-200 py-6 text-sm leading-6 text-slate-700">
                  {selected.description}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-slate-800">
                    Assigned regional officer
                    <select
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-700"
                      disabled={actionLoading}
                      onChange={(event) =>
                        void assignTo(event.target.value)
                      }
                      value={selected.assignedTo?.userId ?? ""}
                    >
                      <option value="">Unassigned</option>
                      {assignees.map((assignee) => (
                        <option
                          key={assignee.userId}
                          value={assignee.userId}
                        >
                          {assignee.firstName} {assignee.lastName} ·{" "}
                          {assignee.role}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm font-medium text-slate-800">
                    Priority
                    <select
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-700"
                      disabled={actionLoading}
                      onChange={(event) =>
                        void changePriority(
                          event.target.value as AssistancePriority,
                        )
                      }
                      value={selected.priority}
                    >
                      {assistancePriorities.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </article>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Status workflow
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Move the request through the regional handling process.
                </p>

                {nextAssistanceStatuses(selected.status).length ? (
                  <>
                    <label className="mt-5 block text-sm font-medium text-slate-800">
                      Optional message to chapter
                      <textarea
                        className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-700"
                        onChange={(event) =>
                          setStatusMessage(event.target.value)
                        }
                        value={statusMessage}
                      />
                    </label>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {nextAssistanceStatuses(selected.status).map(
                        (status) => (
                          <button
                            className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                            disabled={actionLoading}
                            key={status}
                            onClick={() => void changeStatus(status)}
                            type="button"
                          >
                            Move to {status}
                          </button>
                        ),
                      )}
                    </div>
                  </>
                ) : (
                  <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    This request is closed. No further status changes are
                    available.
                  </p>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-950">
                  Request history
                </h3>
                <div className="mt-5 space-y-4">
                  {selected.updates.length ? (
                    selected.updates.map((update) => (
                      <article
                        className={`rounded-lg border p-4 ${
                          update.isInternalNote
                            ? "border-amber-200 bg-amber-50"
                            : "border-slate-200 bg-white"
                        }`}
                        key={update.updateId}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-950">
                            {update.user.firstName}{" "}
                            {update.user.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatAssistanceDate(update.createdAt)}
                          </p>
                        </div>
                        {update.isInternalNote ? (
                          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-amber-700">
                            Internal note
                          </p>
                        ) : null}
                        {update.newStatus ? (
                          <p className="mt-2 text-xs font-medium text-teal-700">
                            Status changed to {update.newStatus}
                          </p>
                        ) : null}
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {update.message}
                        </p>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600">
                      No updates have been added yet.
                    </p>
                  )}
                </div>
              </section>

              <div className="grid gap-6 lg:grid-cols-2">
                <form
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                  onSubmit={(event) => void postUpdate(event, false)}
                >
                  <h3 className="text-lg font-semibold text-slate-950">
                    Reply to chapter
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    This update is visible to chapter officers.
                  </p>
                  <textarea
                    className="mt-4 min-h-32 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-teal-700"
                    onChange={(event) => setReply(event.target.value)}
                    required
                    value={reply}
                  />
                  <button
                    className="mt-3 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                    disabled={actionLoading}
                    type="submit"
                  >
                    Post update
                  </button>
                </form>

                <form
                  className="rounded-xl border border-amber-200 bg-amber-50 p-6"
                  onSubmit={(event) => void postUpdate(event, true)}
                >
                  <h3 className="text-lg font-semibold text-slate-950">
                    Internal note
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Internal notes are visible only to the regional team.
                  </p>
                  <textarea
                    className="mt-4 min-h-32 w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 outline-none focus:border-amber-600"
                    onChange={(event) =>
                      setInternalNote(event.target.value)
                    }
                    required
                    value={internalNote}
                  />
                  <button
                    className="mt-3 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                    disabled={actionLoading}
                    type="submit"
                  >
                    Add internal note
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="font-medium text-slate-900">
                Select an assistance request
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Choose a request from the list to review and manage it.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange(value: string): void;
}) {
  return (
    <label className="text-sm font-medium text-slate-800">
      {label}
      <select
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-700"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">All {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
