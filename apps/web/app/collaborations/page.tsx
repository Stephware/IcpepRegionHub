import { ProtectedRoute } from "@/features/auth/protected-route";
import { CollaborationBoard } from "@/features/collaborations/collaboration-board";

export default function CollaborationsPage() {
  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
          ICpEP Region 3 Hub
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Collaboration Board
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Discover opportunities from Region 3 chapters and coordinate joint
          activities, resource sharing, partnerships, and other chapter
          initiatives.
        </p>
        <CollaborationBoard />
      </main>
    </ProtectedRoute>
  );
}
