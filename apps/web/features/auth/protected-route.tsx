"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { canAccessRole } from "./permissions";
import type { UserRole } from "./types";
import { useAuth } from "./auth-context";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
};

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center px-6">
        <p className="text-sm text-slate-600">Checking your account...</p>
      </main>
    );
  }

  if (!canAccessRole(user.role, allowedRoles)) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-4xl flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold text-slate-950">Access denied</h1>
        <p className="mt-3 text-slate-600">
          Your account does not have permission to open this page.
        </p>
      </main>
    );
  }

  return children;
}
