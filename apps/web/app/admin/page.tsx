import { PagePlaceholder } from "@/components/common/page-placeholder";
import { ProtectedRoute } from "@/features/auth/protected-route";

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["RegionalAdmin"]}>
      <PagePlaceholder
        title="Admin Portal"
        description="Regional administration tools will be connected here as the remaining modules are implemented."
      />
    </ProtectedRoute>
  );
}
