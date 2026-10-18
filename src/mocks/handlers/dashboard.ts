import { http, HttpResponse } from "msw";
import { computeDashboard } from "@/features/dashboard/metrics";
import { getDb } from "../db";
import { API, deny, sessionUser, unauthorized } from "./utils";

export const dashboardHandlers = [
  // GET /api/dashboard: managers only, across the whole portfolio.
  http.get(`${API}/dashboard`, ({ cookies }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const denied = deny(user, "dashboard:view");
    if (denied) return denied;
    const db = getDb();
    const coordinators = db.users.filter((item) => item.role === "coordinator");
    return HttpResponse.json(
      computeDashboard(db.requests, db.buildings, coordinators, new Date(), db.vendors),
    );
  }),
];
