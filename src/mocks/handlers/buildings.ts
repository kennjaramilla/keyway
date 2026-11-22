import { http, HttpResponse } from "msw";
import { reassignCoordinatorSchema, reassignmentConflict } from "@/features/buildings/schema";
import { isOpenStatus } from "@/features/requests/schema";
import { getDb, updateDb } from "../db";
import type { Db } from "../seed";
import { API, conflict, deny, notFound, sessionUser, unauthorized, validationError } from "./utils";

function coverage(db: Db) {
  return {
    buildings: db.buildings.map(({ id, name, coordinatorIds }) => ({ id, name, coordinatorIds })),
    coordinators: db.users
      .filter((user) => user.role === "coordinator")
      .map(({ id, name }) => ({ id, name })),
  };
}

export const buildingHandlers = [
  // GET /api/buildings/coverage: which coordinator covers which building. Manager only.
  http.get(`${API}/buildings/coverage`, ({ cookies }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const denied = deny(user, "building:assign-coordinator");
    if (denied) return denied;
    return HttpResponse.json(coverage(getDb()));
  }),

  // POST /api/buildings/:id/coordinator { fromId, toId }: hand a building to another coordinator.
  http.post(`${API}/buildings/:id/coordinator`, async ({ cookies, params, request }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const denied = deny(user, "building:assign-coordinator");
    if (denied) return denied;
    const parsed = reassignCoordinatorSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);

    const db = getDb();
    const building = db.buildings.find((item) => item.id === params.id);
    if (!building) return notFound("Building");
    const coordinator = (id: string) =>
      db.users.find((item) => item.id === id && item.role === "coordinator");
    const from = coordinator(parsed.data.fromId);
    const to = coordinator(parsed.data.toId);
    if (!from || !to) return notFound("Coordinator");
    const blocked = reassignmentConflict(building, from, to);
    if (blocked) return conflict(blocked.code, blocked.detail);

    const result = updateDb((draft) => {
      const target = draft.buildings.find((item) => item.id === building.id)!;
      target.coordinatorIds = target.coordinatorIds.map((id) => (id === from.id ? to.id : id));
      for (const person of draft.users) {
        if (person.id === from.id) {
          person.buildingIds = person.buildingIds.filter((id) => id !== building.id);
        }
        if (person.id === to.id) person.buildingIds = [...person.buildingIds, building.id];
      }
      // Open requests follow the building; closed ones keep who handled them.
      for (const item of draft.requests) {
        if (
          item.buildingId === building.id &&
          item.coordinatorId === from.id &&
          isOpenStatus(item.status)
        ) {
          item.coordinatorId = to.id;
        }
      }
      return coverage(draft);
    });
    return HttpResponse.json(result);
  }),
];
