import { http, HttpResponse } from "msw";
import { statusSchema, type MaintenanceRequest } from "@/features/requests/schema";
import { can } from "@/lib/auth/permissions";
import { getDb } from "../db";
import { API, deny, notFound, sessionUser, unauthorized } from "./utils";

const SORTS = {
  newest: (a: MaintenanceRequest, b: MaintenanceRequest) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a: MaintenanceRequest, b: MaintenanceRequest) => a.createdAt.localeCompare(b.createdAt),
  updated: (a: MaintenanceRequest, b: MaintenanceRequest) => b.updatedAt.localeCompare(a.updatedAt),
} as const;

export const requestHandlers = [
  // GET /api/requests?buildingId&status&sort
  // Residents: own unit. Coordinators: buildingId must be the active building. Managers: any.
  http.get(`${API}/requests`, ({ request, cookies }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const url = new URL(request.url);
    const buildingId = url.searchParams.get("buildingId") ?? user.activeBuildingId;

    const denied = deny(user, "request:list", user.role === "resident" ? {} : { buildingId });
    if (denied) return denied;

    const status = statusSchema.safeParse(url.searchParams.get("status"));
    const sort =
      SORTS[(url.searchParams.get("sort") as keyof typeof SORTS) ?? "newest"] ?? SORTS.newest;

    const requests = getDb()
      .requests.filter((item) =>
        user.role === "resident" ? item.unitId === user.unitId : item.buildingId === buildingId,
      )
      .filter((item) => !status.success || item.status === status.data)
      .sort(sort);
    return HttpResponse.json(requests);
  }),

  http.get(`${API}/requests/:id`, ({ params, cookies }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const found = getDb().requests.find((item) => item.id === params.id);
    if (!found || !can(user, "request:view", found)) return notFound("Request");
    return HttpResponse.json(found);
  }),
];
