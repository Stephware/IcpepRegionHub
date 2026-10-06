import { AssistanceDetails } from "@/features/assistance/assistance-details";
import { ProtectedRoute } from "@/features/auth/protected-route";

export default function AssistanceDetailsPage() {
  return (
    <ProtectedRoute allowedRoles={["ChapterOfficer"]}>
      <AssistanceDetails />
    </ProtectedRoute>
  );
}
