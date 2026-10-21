import { http, HttpResponse } from "msw";
import {
  chargeStatus,
  DAMAGE_DUE_DAYS,
  damageChargeSchema,
  paymentCreateSchema,
  type Account,
  type Charge,
  type Payment,
  type UnitBalance,
} from "@/features/billing/schema";
import type { SessionUser } from "@/features/session/schema";
import { can } from "@/lib/auth/permissions";
import { getDb, nextId, updateDb } from "../db";
import { consumeFailure } from "../demo-failures";
import type { Db } from "../seed";
import {
  API,
  conflict,
  deny,
  forbidden,
  notFound,
  problem,
  sessionUser,
  unauthorized,
  validationError,
} from "./utils";

const DAY_MS = 86_400_000;
const sum = (charges: readonly Charge[]) =>
  charges.reduce((total, charge) => total + charge.amountCents, 0);
const overdue = (charges: readonly Charge[], now: number) =>
  charges.filter((charge) => chargeStatus(charge, now) === "overdue");

/** The resident's own unit: charges newest due first, payments newest first, server-side totals. */
function account(db: Db, user: SessionUser, now = Date.now()): Account {
  const charges = db.charges
    .filter((charge) => charge.unitId === user.unitId && charge.residentId === user.id)
    .sort((a, b) => b.dueAt.localeCompare(a.dueAt));
  const open = charges.filter((charge) => !charge.paidAt);
  return {
    charges,
    payments: db.payments
      .filter((payment) => payment.residentId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    balanceCents: sum(open),
    overdueCents: sum(overdue(open, now)),
  };
}

/** Staff view of a building: every resident's balance, most overdue first. */
function unitBalances(db: Db, buildingId: string, now = Date.now()): UnitBalance[] {
  return db.users
    .filter((person) => person.role === "resident" && person.buildingIds.includes(buildingId))
    .map((resident) => {
      const open = db.charges.filter(
        (charge) => charge.residentId === resident.id && !charge.paidAt,
      );
      const lastPaymentAt = db.payments
        .filter((payment) => payment.residentId === resident.id)
        .reduce<string | null>(
          (latest, payment) => (!latest || payment.createdAt > latest ? payment.createdAt : latest),
          null,
        );
      return {
        unitId: resident.unitId ?? "",
        unitLabel: db.units.find((unit) => unit.id === resident.unitId)?.label ?? "—",
        residentId: resident.id,
        residentName: resident.name,
        balanceCents: sum(open),
        overdueCents: sum(overdue(open, now)),
        openCount: open.length,
        lastPaymentAt,
      };
    })
    .sort((a, b) => b.overdueCents - a.overdueCents || a.unitLabel.localeCompare(b.unitLabel));
}

/** A request for a charge call, or null when it's missing or out of scope (404 before 403). */
function findRequest(user: SessionUser, id: unknown) {
  const request = getDb().requests.find((item) => item.id === id);
  return request && can(user, "request:view", request) ? request : null;
}

export const billingHandlers = [
  // GET /api/billing: the signed-in resident's account (staff use /billing/units).
  http.get(`${API}/billing`, ({ cookies }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    if (user.role !== "resident") return forbidden();
    const denied = deny(user, "billing:view", { unitId: user.unitId ?? undefined });
    if (denied) return denied;
    return HttpResponse.json(account(getDb(), user));
  }),

  // GET /api/billing/units?buildingId: staff, the active building only.
  http.get(`${API}/billing/units`, ({ request, cookies }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    if (user.role === "resident") return forbidden();
    const buildingId = new URL(request.url).searchParams.get("buildingId") ?? user.activeBuildingId;
    const denied = deny(user, "billing:view", { buildingId });
    if (denied) return denied;
    return HttpResponse.json(unitBalances(getDb(), buildingId));
  }),

  // GET /api/requests/:id/charges: damage charges billed for a request (staff in scope).
  http.get(`${API}/requests/:id/charges`, ({ params, cookies }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const found = findRequest(user, params.id);
    if (!found) return notFound("Request");
    if (user.role === "resident") return forbidden();
    return HttpResponse.json(getDb().charges.filter((charge) => charge.requestId === found.id));
  }),

  // POST /api/requests/:id/charges {amountCents, description}: once per resolved request.
  http.post(`${API}/requests/:id/charges`, async ({ params, cookies, request }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const found = findRequest(user, params.id);
    if (!found) return notFound("Request");
    const denied = deny(user, "charge:create", found);
    if (denied) return denied;
    const parsed = damageChargeSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);
    if (found.status !== "resolved") {
      return conflict("NOT_RESOLVED", "Only a resolved request can be charged for.");
    }
    if (getDb().charges.some((charge) => charge.requestId === found.id)) {
      return conflict("ALREADY_CHARGED", `${found.number} already has a damage charge.`);
    }

    const now = Date.now();
    const charge = updateDb((db) => {
      const created: Charge = {
        id: nextId("chg"),
        buildingId: found.buildingId,
        unitId: found.unitId,
        residentId: found.residentId,
        kind: "damage",
        description: parsed.data.description,
        amountCents: parsed.data.amountCents,
        dueAt: new Date(now + DAMAGE_DUE_DAYS * DAY_MS).toISOString(),
        createdAt: new Date(now).toISOString(),
        paidAt: null,
        paymentId: null,
        requestId: found.id,
      };
      db.charges.push(created);
      return created;
    });
    return HttpResponse.json(charge, { status: 201 });
  }),

  // POST /api/billing/payments {chargeIds, method}: pay open charges on the resident's unit.
  http.post(`${API}/billing/payments`, async ({ cookies, request }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const denied = deny(user, "billing:pay", { unitId: user.unitId ?? undefined });
    if (denied) return denied;
    const parsed = paymentCreateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);

    const db = getDb();
    const charges = parsed.data.chargeIds.map((id) =>
      db.charges.find((charge) => charge.id === id && charge.residentId === user.id),
    );
    // Someone else's charge is indistinguishable from a missing one.
    if (charges.some((charge) => !charge)) return notFound("Charge");
    if (charges.some((charge) => charge?.paidAt)) {
      return conflict("ALREADY_PAID", "One of these charges is already paid.");
    }
    if (consumeFailure("payments")) {
      return problem(502, "Payment declined", "The bank didn't approve this payment. Try again.");
    }

    const now = new Date().toISOString();
    const payment = updateDb((draft) => {
      const created: Payment = {
        id: nextId("pay"),
        reference: `PAY-${2000 + draft.payments.length + 1}`,
        buildingId: user.activeBuildingId,
        unitId: user.unitId ?? "",
        residentId: user.id,
        chargeIds: parsed.data.chargeIds,
        amountCents: charges.reduce((sum, charge) => sum + (charge?.amountCents ?? 0), 0),
        method: parsed.data.method,
        createdAt: now,
      };
      for (const charge of draft.charges) {
        if (created.chargeIds.includes(charge.id)) {
          charge.paidAt = now;
          charge.paymentId = created.id;
        }
      }
      draft.payments.push(created);
      return created;
    });
    return HttpResponse.json(payment, { status: 201 });
  }),
];
