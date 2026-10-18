"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardKeys, fetchDashboard } from "../api";

/** Portfolio metrics for the manager (GET /api/dashboard). */
export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: ({ signal }) => fetchDashboard(signal),
  });
}
