import Link from "next/link";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { EventAdminManager } from "@/features/events/event-admin-manager";

export default function AdminEventsPage() {
  return (
    <ProtectedRoute allowedRoles={["RegionalAdmin"]}>
      <main className="mx-auto max-w-7xl px-6 py-12">
        <Link className="text-sm font-medium text-teal-700" href="/admin">
          ← Back to admin
        </Link>
        <p className="mt-6 text-sm font-medium uppercase tracking-wide text-teal-700">
          Admin Portal
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Event Management
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Maintain Region 3 and chapter event schedules, publication status,
          registration information, and cancellations.
        </p>
        <EventAdminManager />
      </main>
    </ProtectedRoute>
  );
}
