import { api } from "@/lib/api-client";
import { dashboardSchema, type DashboardRange } from "./schema";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  range: (days: DashboardRange) => ["dashboard", days] as const,
};

export const fetchDashboard = (days: DashboardRange, signal?: AbortSignal) =>
  api.get(`/dashboard?days=${days}`, dashboardSchema, { signal });
