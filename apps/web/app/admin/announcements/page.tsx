import { AnnouncementAdminManager } from "@/features/announcements/announcement-admin-manager";

export default function AdminAnnouncementsPage() {
  return (
    <main>
      <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
        Admin Portal
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">
        Announcement Management
      </h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        Create, edit, publish, pin, and manage the visibility of official
        Region 3 announcements.
      </p>
      <AnnouncementAdminManager />
    </main>
  );
}
