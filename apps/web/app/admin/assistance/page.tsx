import { RegionalAssistanceManager } from "@/features/assistance/regional-assistance-manager";

export default function AdminAssistancePage() {
  return (
    <main>
      <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
        Admin Portal
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">
        Assistance Management
      </h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        Review chapter requests, assign regional officers, post updates, add
        internal notes, and manage request status.
      </p>
      <RegionalAssistanceManager />
    </main>
  );
}
