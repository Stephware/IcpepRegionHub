import { CollaborationAdminManager } from "@/features/admin/collaborations/collaboration-admin-manager";

export default function AdminCollaborationsPage() {
  return (
    <main>
      <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
        Admin Portal
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">
        Collaboration Moderation
      </h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        Review collaboration posts and response activity, then close, reopen,
        or remove posts when moderation is needed.
      </p>
      <CollaborationAdminManager />
    </main>
  );
}
