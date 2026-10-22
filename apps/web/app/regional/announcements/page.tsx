import { AnnouncementAdminManager } from "@/features/announcements/announcement-admin-manager";
import { ProtectedRoute } from "@/features/auth/protected-route";

export default function RegionalAnnouncementsPage() {
  return (
    <ProtectedRoute allowedRoles={["RegionalOfficer", "RegionalAdmin"]}>
      <main className="mx-auto max-w-[90rem] px-6 py-12">
        <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
          ICpEP Region 3 Hub
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Regional Announcements
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Create, edit, and publish your own regional announcements.
        </p>
        <AnnouncementAdminManager scope="regional" />
      </main>
    </ProtectedRoute>
  );
}
