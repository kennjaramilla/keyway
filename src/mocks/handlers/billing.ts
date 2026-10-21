import { http, HttpResponse } from "msw";
import {
  chargeStatus,
  paymentCreateSchema,
  type Account,
  type Payment,
} from "@/features/billing/schema";
import type { SessionUser } from "@/features/session/schema";
import { getDb, nextId, updateDb } from "../db";
import { consumeFailure } from "../demo-failures";
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

/** The resident's own unit: charges newest due first, payments newest first, server-side totals. */
function account(db: Db, user: SessionUser, now = Date.now()): Account {
  const charges = db.charges
    .filter((charge) => charge.unitId === user.unitId && charge.residentId === user.id)
    .sort((a, b) => b.dueAt.localeCompare(a.dueAt));
  const open = charges.filter((charge) => !charge.paidAt);
  const total = (list: typeof charges) => list.reduce((sum, charge) => sum + charge.amountCents, 0);
  return {
    charges,
    payments: db.payments
      .filter((payment) => payment.residentId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    balanceCents: total(open),
    overdueCents: total(open.filter((charge) => chargeStatus(charge, now) === "overdue")),
  };
}

export const billingHandlers = [
  // GET /api/billing: the signed-in resident's account.
  http.get(`${API}/billing`, ({ cookies }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const denied = deny(user, "billing:view", { unitId: user.unitId ?? undefined });
    if (denied) return denied;
    return HttpResponse.json(account(getDb(), user));
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
