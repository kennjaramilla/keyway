"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { dashboardKeys, fetchDashboard } from "../api";
import { dashboardQuerySchema, type DashboardRange } from "../schema";

/** Portfolio metrics for the manager (GET /api/dashboard?days=). */
export function useDashboard(days: DashboardRange = 7) {
  return useQuery({
    queryKey: dashboardKeys.range(days),
    queryFn: ({ signal }) => fetchDashboard(days, signal),
    // Keep the current numbers on screen while another range loads.
    placeholderData: keepPreviousData,
  });
}

/** The date range lives in the URL (`?days=14`) so a dashboard view can be shared. */
export function useDashboardRange() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const parsed = dashboardQuerySchema.safeParse({ days: searchParams.get("days") ?? undefined });
  const days: DashboardRange = parsed.success ? parsed.data.days : 7;
  const setDays = (next: DashboardRange) =>
    router.replace(next === 7 ? "/dashboard" : `/dashboard?days=${next}`, { scroll: false });
  return [days, setDays] as const;
}
