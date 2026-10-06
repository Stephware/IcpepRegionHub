import { ProtectedRoute } from "@/features/auth/protected-route";
import { AssistanceDashboard } from "@/features/assistance/assistance-dashboard";

export default function AssistancePage() {
  return (
    <ProtectedRoute allowedRoles={["ChapterOfficer"]}>
      <main className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
          ICpEP Region 3 Hub
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Request Assistance
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Submit chapter concerns to the regional team and monitor
          existing assistance tickets for your chapter.
        </p>
        <AssistanceDashboard />
      </main>
    </ProtectedRoute>
  );
}
