import { ProtectedRoute } from "@/features/auth/protected-route";
import { RoleDashboard } from "@/features/dashboard/role-dashboard";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
          ICpEP Region 3 Hub
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Dashboard
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Your dashboard highlights the Region 3 information and actions most
          relevant to your account.
        </p>
        <RoleDashboard />
      </main>
    </ProtectedRoute>
  );
}
