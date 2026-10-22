import { ProtectedRoute } from "@/features/auth/protected-route";
import { EventAdminManager } from "@/features/events/event-admin-manager";

export default function ManageEventsPage() {
  return (
    <ProtectedRoute
      allowedRoles={[
        "ChapterOfficer",
        "FacultyRepresentative",
        "RegionalOfficer",
        "RegionalAdmin",
      ]}
    >
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-3xl font-semibold text-slate-950">Manage events</h1>
        <p className="mt-3 text-slate-600">
          Save drafts and publish events within your account’s authorized scope.
        </p>
        <EventAdminManager contributor />
      </main>
    </ProtectedRoute>
  );
}
