import { AccountAdminManager } from "@/features/admin/accounts/account-admin-manager";

export default function AdminAccountsPage() {
  return (
    <main>
      <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
        Admin Portal
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">
        Account Management
      </h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        Review registrations, approve or reject pending accounts, manage active
        status, and update account roles.
      </p>
      <AccountAdminManager />
    </main>
  );
}
