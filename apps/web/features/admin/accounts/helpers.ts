import type { AdminAccount } from "./types";

export type AdminAccountFilter =
  | "All"
  | "Pending"
  | "Active"
  | "Inactive"
  | "Rejected";

export function accountState(account: AdminAccount) {
  if (!account.isApproved && !account.isActive) {
    return "Rejected";
  }

  if (!account.isApproved) {
    return "Pending";
  }

  return account.isActive ? "Active" : "Inactive";
}

export function accountStateClass(state: string) {
  switch (state) {
    case "Active":
      return "bg-emerald-50 text-emerald-700";
    case "Pending":
      return "bg-amber-50 text-amber-700";
    case "Rejected":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function filterAdminAccounts(
  accounts: AdminAccount[],
  filter: AdminAccountFilter,
) {
  return filter === "All"
    ? accounts
    : accounts.filter((account) => accountState(account) === filter);
}
