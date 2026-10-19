import { ProtectedRoute } from "@/features/auth/protected-route";
import { RoleDashboard } from "@/features/dashboard/role-dashboard";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-7xl px-6 py-10 sm:py-12">
        <RoleDashboard />
      </main>
    </ProtectedRoute>
  );
}
