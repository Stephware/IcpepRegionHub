import { EventAdminManager } from "@/features/events/event-admin-manager";

export default function AdminEventsPage() {
  return (
    <main>
      <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
        Admin Portal
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">
        Event Management
      </h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        Maintain Region 3 and chapter event schedules, publication status,
        registration information, and cancellations.
      </p>
      <EventAdminManager />
    </main>
  );
}
