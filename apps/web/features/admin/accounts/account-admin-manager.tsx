"use client";

import { useEffect, useMemo, useState } from "react";
import { ChapterSelect } from "@/features/chapters/chapter-select";
import type { UserRole } from "@/features/auth/types";
import { Alert, EmptyState, LoadingState } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form-controls";
import { TableContainer } from "@/components/ui/table";
import {
  approveAdminAccount,
  changeAdminAccountRole,
  listAdminAccounts,
  rejectAdminAccount,
  setAdminAccountActive,
} from "./api";
import {
  accountState,
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

function stateVariant(state: string) {
  switch (state) {
    case "Active":
      return "success" as const;
    case "Pending":
      return "warning" as const;
    case "Rejected":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

export function AccountAdminManager() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [filter, setFilter] = useState<AdminAccountFilter>("All");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [roleEdit, setRoleEdit] = useState<{
    userId: string;
    role: UserRole;
    chapterId: string;
  } | null>(null);

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
      setRoleEdit(null);
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
    return (
      <div className="mt-8">
        <LoadingState label="Loading accounts..." />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Account filters"
      >
        {filters.map((item) => (
          <Button
            key={item}
            onClick={() => setFilter(item)}
            size="sm"
            variant={filter === item ? "primary" : "secondary"}
          >
            {item}
          </Button>
        ))}
      </div>

      <p className="text-sm text-slate-600">
        Role and access changes take effect on the next API request. The
        affected user should refresh their page to update navigation and their
        dashboard.
      </p>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {visibleAccounts.length ? (
        <TableContainer>
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
              {visibleAccounts.map((account) => {
                const state = accountState(account);
                const busy = actionId === account.userId;

                return (
                  <tr
                    className="align-top hover:bg-slate-50/70"
                    key={account.userId}
                  >
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
                        ? (account.chapter.acronym ??
                          account.chapter.chapterName)
                        : "Regional"}
                    </td>
                    <td className="px-4 py-4">
                      <Select
                        className="mt-0 min-w-44 py-2"
                        disabled={
                          busy || state === "Pending" || state === "Rejected"
                        }
                        aria-label={`Role for ${account.firstName} ${account.lastName}`}
                        onChange={(event) =>
                          setRoleEdit({
                            userId: account.userId,
                            role: event.target.value as UserRole,
                            chapterId: account.chapterId ?? "",
                          })
                        }
                        value={
                          roleEdit?.userId === account.userId
                            ? roleEdit.role
                            : account.role
                        }
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </Select>
                      {roleEdit?.userId === account.userId ? (
                        <div className="mt-3 space-y-3">
                          {roleEdit.role === "ChapterOfficer" ? (
                            <label
                              className="block text-xs font-medium text-slate-600"
                              htmlFor="chapterId"
                            >
                              Active chapter
                              <ChapterSelect
                                onChange={(chapterId) =>
                                  setRoleEdit({ ...roleEdit, chapterId })
                                }
                                required
                                value={roleEdit.chapterId}
                              />
                            </label>
                          ) : null}
                          <div className="flex gap-2">
                            <Button
                              disabled={
                                busy ||
                                (roleEdit.role === "ChapterOfficer" &&
                                  !roleEdit.chapterId)
                              }
                              onClick={() =>
                                void runAction(account, () =>
                                  changeAdminAccountRole(
                                    account.userId,
                                    roleEdit.role,
                                    roleEdit.chapterId,
                                  ),
                                )
                              }
                              size="sm"
                            >
                              Save role
                            </Button>
                            <Button
                              disabled={busy}
                              onClick={() => setRoleEdit(null)}
                              size="sm"
                              variant="secondary"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={stateVariant(state)}>{state}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {state === "Pending" ? (
                          <>
                            <Button
                              disabled={busy}
                              onClick={() =>
                                void runAction(account, () =>
                                  approveAdminAccount(account.userId),
                                )
                              }
                              size="sm"
                            >
                              Approve
                            </Button>
                            <Button
                              disabled={busy}
                              onClick={() =>
                                void runAction(account, () =>
                                  rejectAdminAccount(account.userId),
                                )
                              }
                              size="sm"
                              variant="danger"
                            >
                              Reject
                            </Button>
                          </>
                        ) : state === "Active" ? (
                          <Button
                            disabled={busy}
                            onClick={() =>
                              void runAction(account, () =>
                                setAdminAccountActive(account.userId, false),
                              )
                            }
                            size="sm"
                            variant="secondary"
                          >
                            Deactivate
                          </Button>
                        ) : state === "Inactive" ? (
                          <Button
                            disabled={busy}
                            onClick={() =>
                              void runAction(account, () =>
                                setAdminAccountActive(account.userId, true),
                              )
                            }
                            size="sm"
                            variant="secondary"
                          >
                            Activate
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableContainer>
      ) : (
        <EmptyState
          description="Try another account-state filter."
          title="No accounts match this filter."
        />
      )}
    </div>
  );
}
