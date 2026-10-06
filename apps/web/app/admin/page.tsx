import { AdminOverview } from "@/features/admin/admin-overview";

export default function AdminPage() {
  return (
    <main>
      <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
        ICpEP Region 3 Hub
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">
        Admin Portal
      </h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        Manage Region 3 accounts, chapters, announcements, events, assistance,
        and collaboration activity from one place.
      </p>
      <AdminOverview />
    </main>
  );
}
