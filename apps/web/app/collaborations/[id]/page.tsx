import { ProtectedRoute } from "@/features/auth/protected-route";
import { CollaborationDetails } from "@/features/collaborations/collaboration-details";

export default function CollaborationDetailsPage() {
  return (
    <ProtectedRoute>
      <CollaborationDetails />
    </ProtectedRoute>
  );
}
