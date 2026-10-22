import { apiFetch } from "@/lib/api/client";
import type { FacultyDesignation, UserRole } from "@/features/auth/types";
import type { AdminAccount } from "./types";

export function listAdminAccounts() {
  return apiFetch<AdminAccount[]>("/admin/accounts");
}

export function listPendingAdminAccounts() {
  return apiFetch<AdminAccount[]>("/admin/accounts/pending");
}

export function approveAdminAccount(userId: string) {
  return apiFetch<{ message: string; user: AdminAccount }>(
    `/admin/accounts/${userId}/approve`,
    { method: "PATCH" },
  );
}

export function rejectAdminAccount(userId: string) {
  return apiFetch<{ message: string; user: AdminAccount }>(
    `/admin/accounts/${userId}/reject`,
    { method: "PATCH" },
  );
}

export function setAdminAccountActive(userId: string, isActive: boolean) {
  return apiFetch<{ message: string; user: AdminAccount }>(
    `/admin/accounts/${userId}/active`,
    {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    },
  );
}

export function changeAdminAccountRole(
  userId: string,
  role: UserRole,
  chapterId?: string,
  facultyDesignation?: FacultyDesignation,
) {
  return apiFetch<{ message: string; user: AdminAccount }>(
    `/admin/accounts/${userId}/role`,
    {
      method: "PATCH",
      body: JSON.stringify({
        role,
        chapterId:
          role === "ChapterOfficer" || role === "FacultyRepresentative"
            ? chapterId
            : undefined,
        facultyDesignation:
          role === "FacultyRepresentative" ? facultyDesignation : undefined,
      }),
    },
  );
}
