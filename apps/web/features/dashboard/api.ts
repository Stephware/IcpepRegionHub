import { apiFetch } from "@/lib/api/client";
import type { DashboardData } from "./types";

export function loadDashboard() {
  return apiFetch<DashboardData>("/dashboard");
}
