import { ProtectedRoute } from "@/features/auth/protected-route";
import { RoleDashboard } from "@/features/dashboard/role-dashboard";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-2xl bg-[#073fbd] px-6 py-8 text-white shadow-sm sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-100">
            ICpEP Region 3 Hub
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-blue-50">
            Your most relevant updates, actions, and regional information in one
            place.
          </p>
        </div>
        <RoleDashboard />
      </main>
    </ProtectedRoute>
  );
}
