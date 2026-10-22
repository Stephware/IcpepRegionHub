import { apiFetch } from "@/lib/api/client";
import type { PagedResponse } from "@/lib/paged-response";
import type { AdminAccountFilter } from "./helpers";
import type { FacultyDesignation, UserRole } from "@/features/auth/types";
import type { AdminAccount } from "./types";

export function listAdminAccounts() {
  return apiFetch<AdminAccount[]>("/admin/accounts");
}

export function listAdminAccountsPaged(options: { filter?: AdminAccountFilter; search?: string; page?: number; pageSize?: number }) {
  const params = new URLSearchParams();
  if (options.filter && options.filter !== "All") params.set("filter", options.filter);
  if (options.search?.trim()) params.set("search", options.search.trim());
  if (options.page) params.set("page", String(options.page));
  if (options.pageSize) params.set("pageSize", String(options.pageSize));
  return apiFetch<PagedResponse<AdminAccount>>(`/admin/accounts/paged?${params.toString()}`);
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
