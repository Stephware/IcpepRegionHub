import { ProtectedRoute } from "@/features/auth/protected-route";
import { RegionalAssistanceManager } from "@/features/assistance/regional-assistance-manager";

export default function RegionalAssistancePage() {
  return (
    <ProtectedRoute allowedRoles={["RegionalAdmin", "RegionalOfficer"]}>
      <main className="mx-auto max-w-[90rem] px-6 py-12">
        <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
          ICpEP Region 3 Hub
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Regional Assistance Management
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Review chapter concerns, coordinate regional responses, assign
          requests, and track each ticket through resolution.
        </p>
        <RegionalAssistanceManager />
      </main>
    </ProtectedRoute>
  );
}
