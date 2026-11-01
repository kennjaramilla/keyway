import { http, HttpResponse } from "msw";
import { computeDashboard } from "@/features/dashboard/metrics";
import { dashboardQuerySchema } from "@/features/dashboard/schema";
import { getDb } from "../db";
import { API, deny, sessionUser, unauthorized, validationError } from "./utils";

export const dashboardHandlers = [
  // GET /api/dashboard?days=7|14|30: managers only, across the whole portfolio.
  http.get(`${API}/dashboard`, ({ cookies, request }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const denied = deny(user, "dashboard:view");
    if (denied) return denied;
    const days = new URL(request.url).searchParams.get("days") ?? undefined;
    const query = dashboardQuerySchema.safeParse({ days });
    if (!query.success) return validationError(query.error);
    const db = getDb();
    const coordinators = db.users.filter((item) => item.role === "coordinator");
    return HttpResponse.json(
      computeDashboard(
        db.requests,
        db.buildings,
        coordinators,
        new Date(),
        db.vendors,
        query.data.days,
      ),
    );
  }),
];
