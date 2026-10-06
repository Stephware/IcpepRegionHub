import Link from "next/link";
import { AnnouncementAdminManager } from "@/features/announcements/announcement-admin-manager";
import { ProtectedRoute } from "@/features/auth/protected-route";

export default function AdminAnnouncementsPage() {
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
          Announcement Management
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Create, edit, publish, pin, and manage the visibility of official
          Region 3 announcements.
        </p>
        <AnnouncementAdminManager />
      </main>
    </ProtectedRoute>
  );
}
