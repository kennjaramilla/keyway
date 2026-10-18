import { api } from "@/lib/api-client";
import { dashboardSchema } from "./schema";

export const dashboardKeys = { all: ["dashboard"] as const };

export const fetchDashboard = (signal?: AbortSignal) =>
  api.get("/dashboard", dashboardSchema, { signal });
