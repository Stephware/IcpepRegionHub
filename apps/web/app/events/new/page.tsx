import Link from "next/link";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { EventAdminManager } from "@/features/events/event-admin-manager";

export default function CreateEventPage() {
  return (
    <ProtectedRoute
      allowedRoles={[
        "ChapterOfficer",
        "FacultyRepresentative",
        "RegionalOfficer",
        "RegionalAdmin",
      ]}
    >
      <main className="mx-auto max-w-4xl px-6 py-12">
        <Link className="text-sm font-medium text-blue-700" href="/events">
          ← Back to events
        </Link>
        <h1 className="mt-6 text-3xl font-semibold text-slate-950">
          Create event
        </h1>
        <p className="mt-3 text-slate-600">
          Save a draft, then publish within your account’s authorized scope.
        </p>
        <EventAdminManager contributor createOnly />
      </main>
    </ProtectedRoute>
  );
}
