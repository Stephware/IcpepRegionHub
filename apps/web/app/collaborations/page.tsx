import { PagePlaceholder } from "@/components/common/page-placeholder";
import { ProtectedRoute } from "@/features/auth/protected-route";

export default function CollaborationsPage() {
  return (
    <ProtectedRoute>
      <PagePlaceholder
        title="Collaboration Board"
        description="Collaboration posts and coordination tools will be added in a later feature group."
      />
    </ProtectedRoute>
  );
}
