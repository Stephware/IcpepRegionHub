import { EventDirectory } from "@/features/events/event-directory";

export default function EventsPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
        ICpEP Region 3 Hub
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">
        Calendar & Events
      </h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Browse official Region 3 schedules and published chapter events using
        either the event list or monthly calendar.
      </p>
      <EventDirectory />
    </main>
  );
}
