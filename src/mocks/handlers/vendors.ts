import { http, HttpResponse } from "msw";
import { getDb } from "../db";
import { API, deny, sessionUser, unauthorized } from "./utils";

export const vendorHandlers = [
  // GET /api/vendors?buildingId: vendors serving the (active) building.
  http.get(`${API}/vendors`, ({ request, cookies }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const buildingId = new URL(request.url).searchParams.get("buildingId") ?? user.activeBuildingId;
    const denied = deny(user, "vendor:list", { buildingId });
    if (denied) return denied;
    return HttpResponse.json(
      getDb().vendors.filter((vendor) => vendor.buildingIds.includes(buildingId)),
    );
  }),
];
