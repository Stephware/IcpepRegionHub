import Link from "next/link";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { CollaborationBoard } from "@/features/collaborations/collaboration-board";

export default function CreateCollaborationPage() {
  return (
    <ProtectedRoute allowedRoles={["ChapterOfficer"]}>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <Link
          className="text-sm font-medium text-blue-700"
          href="/collaborations"
        >
          ← Back to collaborations
        </Link>
        <h1 className="mt-6 text-3xl font-semibold text-slate-950">
          Create collaboration
        </h1>
        <CollaborationBoard createOnly />
      </main>
    </ProtectedRoute>
  );
}
