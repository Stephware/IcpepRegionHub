import { PagePlaceholder } from "@/components/common/page-placeholder";
import { ProtectedRoute } from "@/features/auth/protected-route";

export default function AssistancePage() {
  return (
    <ProtectedRoute>
      <PagePlaceholder
        title="Request Assistance"
        description="Assistance request workflows will be added in a later feature group."
      />
    </ProtectedRoute>
  );
}
