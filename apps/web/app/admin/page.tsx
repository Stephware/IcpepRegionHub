import Link from "next/link";
import { ProtectedRoute } from "@/features/auth/protected-route";

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["RegionalAdmin"]}>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
          ICpEP Region 3 Hub
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Admin Portal
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Manage regional accounts, chapters, and upcoming administrative
          modules from one place.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Link
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-300"
            href="/admin/chapters"
          >
            <h2 className="font-semibold text-slate-950">Chapter Directory</h2>
            <p className="mt-2 text-sm text-slate-600">
              Create and update chapters, change chapter status, and manage
              officer records.
            </p>
          </Link>

          <Link
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-300"
            href="/admin/announcements"
          >
            <h2 className="font-semibold text-slate-950">Announcements</h2>
            <p className="mt-2 text-sm text-slate-600">
              Create drafts, publish regional announcements, control visibility,
              and pin important updates.
            </p>
          </Link>

          <Link
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-300"
            href="/admin/events"
          >
            <h2 className="font-semibold text-slate-950">Calendar & Events</h2>
            <p className="mt-2 text-sm text-slate-600">
              Create regional or chapter events, publish schedules, and manage
              registration details and cancellations.
            </p>
          </Link>
        </div>
      </main>
    </ProtectedRoute>
  );
}
