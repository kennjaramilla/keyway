import { http, HttpResponse } from "msw";
import {
  signInSchema,
  switchBuildingSchema,
  type DemoPerson,
  type SessionUser,
} from "@/features/session/schema";
import { clearSessionCookie, writeSessionCookie } from "@/lib/auth/session-cookie";
import { getDb, resetDb } from "../db";
import { API, deny, notFound, sessionUser, unauthorized, validationError } from "./utils";

function sessionPayload(user: SessionUser) {
  const db = getDb();
  return {
    user,
    buildings: db.buildings.filter((building) => user.buildingIds.includes(building.id)),
    unit: db.units.find((unit) => unit.id === user.unitId) ?? null,
  };
}

export const sessionHandlers = [
  // Public: who can be signed in as on the demo sign-in page.
  http.get(`${API}/demo/people`, () => {
    const { users, buildings, units } = getDb();
    const buildingName = (id: string) => buildings.find((b) => b.id === id)?.name ?? id;
    const people: DemoPerson[] = users.map((user) => {
      const unit = units.find((u) => u.id === user.unitId);
      return {
        id: user.id,
        name: user.name,
        role: user.role,
        context: unit
          ? `${buildingName(unit.buildingId)} · ${unit.label}`
          : user.role === "manager"
            ? "All buildings"
            : user.buildingIds.map(buildingName).join(", "),
      };
    });
    return HttpResponse.json(people);
  }),

  http.get(`${API}/session`, ({ cookies }) => {
    const user = sessionUser(cookies);
    return user ? HttpResponse.json(sessionPayload(user)) : unauthorized();
  }),

  http.post(`${API}/session`, async ({ request }) => {
    const parsed = signInSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);
    const user = getDb().users.find((candidate) => candidate.id === parsed.data.userId);
    if (!user) return notFound("Person");
    const activeBuildingId = user.buildingIds[0];
    if (!activeBuildingId) return notFound("Building");
    writeSessionCookie({ role: user.role, userId: user.id, activeBuildingId });
    return HttpResponse.json(sessionPayload({ ...user, activeBuildingId }));
  }),

  http.delete(`${API}/session`, () => {
    clearSessionCookie();
    return new HttpResponse(null, { status: 204 });
  }),

  http.put(`${API}/session/building`, async ({ request, cookies }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const parsed = switchBuildingSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);
    const { buildingId } = parsed.data;
    const denied = deny(user, "building:switch", { buildingId });
    if (denied) return denied;
    writeSessionCookie({ role: user.role, userId: user.id, activeBuildingId: buildingId });
    return HttpResponse.json(sessionPayload({ ...user, activeBuildingId: buildingId }));
  }),

  http.post(`${API}/demo/reset`, () => {
    resetDb();
    return new HttpResponse(null, { status: 204 });
  }),
];
