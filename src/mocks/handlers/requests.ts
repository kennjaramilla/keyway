import { http, HttpResponse } from "msw";
import {
  assignSchema,
  makeRequestCreateSchema,
  makeScheduleSchema,
  nextStatus,
  resolveSchema,
  triageSchema,
  type MaintenanceRequest,
  type TimelineEvent,
  type TransitionAction,
} from "@/features/requests/schema";
import { localDate } from "@/features/requests/time";
import { can, type Action } from "@/lib/auth/permissions";
import { getDb, nextId, updateDb } from "../db";
import type { Db } from "../seed";
import {
  API,
  conflict,
  deny,
  notFound,
  problem,
  sessionUser,
  unauthorized,
  validationError,
} from "./utils";

const newestFirst = (a: MaintenanceRequest, b: MaintenanceRequest) =>
  b.createdAt.localeCompare(a.createdAt);

const WORKFLOW_ACTIONS = ["triage", "assign", "schedule", "start", "resolve"] as const;
type WorkflowAction = (typeof WORKFLOW_ACTIONS)[number];

function toListItem(db: Db, request: MaintenanceRequest) {
  return {
    ...request,
    unitLabel: db.units.find((unit) => unit.id === request.unitId)?.label ?? "",
    vendorName: db.vendors.find((vendor) => vendor.id === request.vendorId)?.name ?? null,
  };
}

function toDetail(db: Db, request: MaintenanceRequest) {
  const building = db.buildings.find((item) => item.id === request.buildingId);
  const vendor = db.vendors.find((item) => item.id === request.vendorId);
  return {
    ...toListItem(db, request),
    buildingName: building?.name ?? "",
    timeZone: building?.timezone ?? "UTC",
    vendor: vendor
      ? { id: vendor.id, name: vendor.name, trade: vendor.trade, phone: vendor.phone }
      : null,
    people: Object.fromEntries(
      [...db.users, ...db.vendors].map((person) => [person.id, person.name]),
    ),
  };
}

const invalidTransition = (request: MaintenanceRequest, verb: string) =>
  conflict("INVALID_TRANSITION", `${request.number} can't be ${verb} from its current status.`);

/** Apply a status change (or none) and append its timeline event. */
function record(
  request: MaintenanceRequest,
  event: Omit<TimelineEvent, "id" | "at" | "fromStatus" | "toStatus">,
  to: MaintenanceRequest["status"] = request.status,
  changes: Partial<MaintenanceRequest> = {},
) {
  const at = new Date().toISOString();
  // Read before writing: `request` may be the same object as the db row being updated.
  const fromStatus = request.status;
  return updateDb((db) => {
    const target = db.requests.find((item) => item.id === request.id)!;
    Object.assign(target, changes, { status: to, updatedAt: at });
    target.timeline.push({
      id: nextId("evt"),
      at,
      fromStatus,
      toStatus: to,
      ...event,
    });
    return toDetail(db, target);
  });
}

export const requestHandlers = [
  // GET /api/requests?buildingId, newest first. Filtering and sorting happen in the queue (queue.ts).
  // Residents: own unit. Coordinators: buildingId must be the active building. Managers: any.
  http.get(`${API}/requests`, ({ request, cookies }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const url = new URL(request.url);
    const buildingId = url.searchParams.get("buildingId") ?? user.activeBuildingId;

    const denied = deny(user, "request:list", user.role === "resident" ? {} : { buildingId });
    if (denied) return denied;

    const db = getDb();
    const requests = db.requests
      .filter((item) =>
        user.role === "resident" ? item.unitId === user.unitId : item.buildingId === buildingId,
      )
      .sort(newestFirst)
      .map((item) => toListItem(db, item));
    return HttpResponse.json(requests);
  }),

  // POST /api/requests: residents only; unit, building and people come from the session.
  http.post(`${API}/requests`, async ({ request, cookies }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const denied = deny(user, "request:create");
    if (denied) return denied;

    const db = getDb();
    const building = db.buildings.find((item) => item.id === user.activeBuildingId);
    if (!building || !user.unitId) return notFound("Unit");
    const today = localDate(new Date(), building.timezone);
    const parsed = makeRequestCreateSchema(today).safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);

    const now = new Date().toISOString();
    const highest = Math.max(1000, ...db.requests.map((item) => Number(item.number.slice(3))));
    const created: MaintenanceRequest = {
      ...parsed.data,
      id: nextId("req"),
      number: `KW-${highest + 1}`,
      buildingId: building.id,
      unitId: user.unitId,
      residentId: user.id,
      coordinatorId: building.coordinatorIds[0] ?? "",
      vendorId: null,
      status: "new",
      entryNotes: parsed.data.entryNotes || null,
      visitWindow: null,
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      timeline: [
        { id: nextId("evt"), type: "created", at: now, actorId: user.id, toStatus: "new" },
      ],
    };
    const detail = updateDb((current) => {
      current.requests.push(created);
      return toDetail(current, created);
    });
    return HttpResponse.json(detail, { status: 201 });
  }),

  http.get(`${API}/requests/:id`, ({ params, cookies }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const db = getDb();
    const found = db.requests.find((item) => item.id === params.id);
    if (!found || !can(user, "request:view", found)) return notFound("Request");
    return HttpResponse.json(toDetail(db, found));
  }),

  // POST /api/requests/:id/{triage|assign|schedule|start|resolve}
  http.post(`${API}/requests/:id/:action`, async ({ params, request, cookies }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const action = params.action as WorkflowAction;
    if (!WORKFLOW_ACTIONS.includes(action)) return notFound();

    const db = getDb();
    const found = db.requests.find((item) => item.id === params.id);
    if (!found || !can(user, "request:view", found)) return notFound("Request");
    const denied = deny(user, `request:${action}` as Action, found);
    if (denied) return denied;

    const body: unknown = await request.json().catch(() => ({}));
    const to = (transition: TransitionAction) => nextStatus(found.status, transition);

    switch (action) {
      case "triage": {
        const next = to("request:triage");
        if (!next) return invalidTransition(found, "triaged");
        const parsed = triageSchema.safeParse(body ?? {});
        if (!parsed.success) return validationError(parsed.error);
        const { note, category, urgency } = parsed.data;
        const changes = { ...(category && { category }), ...(urgency && { urgency }) };
        return HttpResponse.json(
          record(found, { type: "triaged", actorId: user.id, note: note || null }, next, changes),
        );
      }
      case "assign": {
        if (found.status !== "triaged" && found.status !== "scheduled") {
          return invalidTransition(found, "assigned");
        }
        const parsed = assignSchema.safeParse(body);
        if (!parsed.success) return validationError(parsed.error);
        const vendor = db.vendors.find(
          (item) => item.id === parsed.data.vendorId && item.buildingIds.includes(found.buildingId),
        );
        if (!vendor) {
          return problem(422, "Validation failed", "Some fields need attention.", {
            errors: { vendorId: ["Choose a vendor who serves this building."] },
          });
        }
        return HttpResponse.json(
          record(
            found,
            { type: "vendor_assigned", actorId: user.id, meta: { vendorId: vendor.id } },
            found.status,
            { vendorId: vendor.id },
          ),
        );
      }
      case "schedule": {
        const next = to("request:schedule");
        if (!next) return invalidTransition(found, "scheduled");
        if (!found.vendorId) return conflict("VENDOR_REQUIRED", "Assign a vendor first.");
        const timeZone = db.buildings.find((item) => item.id === found.buildingId)?.timezone;
        const parsed = makeScheduleSchema({
          now: new Date(),
          timeZone: timeZone ?? "UTC",
          urgency: found.urgency,
        }).safeParse(body);
        if (!parsed.success) return validationError(parsed.error);
        const type = found.status === "scheduled" ? "rescheduled" : "scheduled";
        return HttpResponse.json(
          record(found, { type, actorId: user.id, meta: { visitWindow: parsed.data } }, next, {
            visitWindow: parsed.data,
          }),
        );
      }
      case "start": {
        const next = to("request:start");
        if (!next) return invalidTransition(found, "started");
        return HttpResponse.json(record(found, { type: "started", actorId: user.id }, next));
      }
      case "resolve": {
        const next = to("request:resolve");
        if (!next) return invalidTransition(found, "resolved");
        const parsed = resolveSchema.safeParse(body);
        if (!parsed.success) return validationError(parsed.error);
        return HttpResponse.json(
          record(
            found,
            { type: "resolved", actorId: user.id, note: parsed.data.resolutionNote },
            next,
            { resolvedAt: new Date().toISOString() },
          ),
        );
      }
    }
  }),
];
