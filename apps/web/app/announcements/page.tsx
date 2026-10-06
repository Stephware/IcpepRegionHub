import { AnnouncementList } from "@/features/announcements/announcement-list";

export default function AnnouncementsPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
        ICpEP Region 3 Hub
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">
        Announcements
      </h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        View official Region 3 updates, advisories, and important information.
        Signed-in members can also see member-only announcements.
      </p>
      <AnnouncementList />
    </main>
  );
}
