"use client";

import { useEffect, useMemo, useState } from "react";
import type { UserRole } from "@/features/auth/types";
import {
  approveAdminAccount,
  changeAdminAccountRole,
  listAdminAccounts,
  rejectAdminAccount,
  setAdminAccountActive,
} from "./api";
import {
  accountState,
  accountStateClass,
  filterAdminAccounts,
  type AdminAccountFilter,
} from "./helpers";
import type { AdminAccount } from "./types";

const filters: AdminAccountFilter[] = [
  "All",
  "Pending",
  "Active",
  "Inactive",
  "Rejected",
];

const roles: UserRole[] = [
  "ChapterOfficer",
  "RegionalOfficer",
  "RegionalAdmin",
];

export function AccountAdminManager() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [filter, setFilter] = useState<AdminAccountFilter>("All");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    listAdminAccounts()
      .then((items) => {
        if (!cancelled) {
          setAccounts(items);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load accounts.",
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

  const visibleAccounts = useMemo(
    () => filterAdminAccounts(accounts, filter),
    [accounts, filter],
  );

  async function refresh() {
    setAccounts(await listAdminAccounts());
  }

  async function runAction(
    account: AdminAccount,
    action: () => Promise<{ message: string }>,
  ) {
    setActionId(account.userId);
    setError("");
    setNotice("");

    try {
      const result = await action();
      setNotice(result.message);
      await refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update account.",
      );
    } finally {
      setActionId(null);
    }
  }

  if (loading) {
    return <p className="mt-8 text-sm text-slate-600">Loading accounts...</p>;
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              filter === item
                ? "bg-teal-700 text-white"
                : "border border-slate-300 bg-white text-slate-700"
            }`}
            key={item}
            onClick={() => setFilter(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

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

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Chapter</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleAccounts.length ? (
              visibleAccounts.map((account) => {
                const state = accountState(account);
                const busy = actionId === account.userId;

                return (
                  <tr key={account.userId}>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-950">
                        {account.firstName} {account.lastName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {account.email}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {account.chapter
                        ? account.chapter.acronym ??
                          account.chapter.chapterName
                        : "Regional"}
                    </td>
                    <td className="px-4 py-4">
                      <select
                        className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                        disabled={busy || state === "Pending" || state === "Rejected"}
                        onChange={(event) =>
                          void runAction(account, () =>
                            changeAdminAccountRole(
                              account.userId,
                              event.target.value as UserRole,
                            ),
                          )
                        }
                        value={account.role}
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${accountStateClass(
                          state,
                        )}`}
                      >
                        {state}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {state === "Pending" ? (
                          <>
                            <button
                              className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
                              disabled={busy}
                              onClick={() =>
                                void runAction(account, () =>
                                  approveAdminAccount(account.userId),
                                )
                              }
                              type="button"
                            >
                              Approve
                            </button>
                            <button
                              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 disabled:opacity-60"
                              disabled={busy}
                              onClick={() =>
                                void runAction(account, () =>
                                  rejectAdminAccount(account.userId),
                                )
                              }
                              type="button"
                            >
                              Reject
                            </button>
                          </>
                        ) : state === "Active" ? (
                          <button
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-60"
                            disabled={busy}
                            onClick={() =>
                              void runAction(account, () =>
                                setAdminAccountActive(account.userId, false),
                              )
                            }
                            type="button"
                          >
                            Deactivate
                          </button>
                        ) : state === "Inactive" ? (
                          <button
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-60"
                            disabled={busy}
                            onClick={() =>
                              void runAction(account, () =>
                                setAdminAccountActive(account.userId, true),
                              )
                            }
                            type="button"
                          >
                            Activate
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                  No accounts match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
