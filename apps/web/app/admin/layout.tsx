import { ProtectedRoute } from "@/features/auth/protected-route";
import { AdminSidebar } from "@/features/admin/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["RegionalAdmin"]}>
      <div className="mx-auto grid max-w-[90rem] gap-6 px-6 py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <AdminSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </ProtectedRoute>
  );
}
