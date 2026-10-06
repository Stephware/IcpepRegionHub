import { ProtectedRoute } from "@/features/auth/protected-route";
import { CollaborationResponseManager } from "@/features/collaborations/collaboration-response-manager";

export default function CollaborationResponseManagementPage() {
  return (
    <ProtectedRoute allowedRoles={["ChapterOfficer"]}>
      <CollaborationResponseManager />
    </ProtectedRoute>
  );
}
