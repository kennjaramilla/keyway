import { z } from "zod";
import {
  accountSchema,
  chargeSchema,
  paymentSchema,
  unitBalanceListSchema,
} from "@/features/billing/schema";
import { api } from "@/lib/api-client";
import { getDb } from "@/mocks/db";
import { armFailuresFromUrl } from "@/mocks/demo-failures";
import { signInAs } from "@/test/session";

const status = (promise: Promise<unknown>) =>
  promise.then(
    () => 200,
    (error: { status: number }) => error.status,
  );
const account = () => api.get("/billing", accountSchema);
const units = (buildingId?: string) =>
  api.get("/billing/units", unitBalanceListSchema, { query: { buildingId } });
const charges = (requestId: string) =>
  api.get(`/requests/${requestId}/charges`, z.array(chargeSchema));
const charge = (requestId: string, body: unknown) =>
  api.post(`/requests/${requestId}/charges`, chargeSchema, body);
const pay = (body: unknown) => api.post("/billing/payments", paymentSchema, body);

describe("billing endpoints", () => {
  it("returns the resident's own charges and payments with totals", async () => {
    signInAs("resident");
    const { charges, payments, balanceCents, overdueCents } = await account();
    expect(charges.every((charge) => charge.residentId === "usr_res_amara")).toBe(true);
    expect(payments.every((payment) => payment.residentId === "usr_res_amara")).toBe(true);
    // November rent plus September water.
    expect(balanceCents).toBe(245000 + 8640);
    expect(overdueCents).toBe(0);
    expect(charges.map((charge) => charge.dueAt)).toEqual(
      charges
        .map((charge) => charge.dueAt)
        .sort()
        .reverse(),
    );
  });

  it("counts unpaid charges past their due date as overdue", async () => {
    signInAs("usr_res_diego");
    const { overdueCents, balanceCents } = await account();
    expect(overdueCents).toBe(280000);
    expect(balanceCents).toBe(280000 * 2 + 7500);
  });

  it("is resident-only (403) and needs a session (401)", async () => {
    expect(await status(account())).toBe(401);
    signInAs("coordinator");
    expect(await status(account())).toBe(403);
    expect(await status(pay({ chargeIds: ["chg_001"], method: "card" }))).toBe(403);
    signInAs("resident");
    expect(await status(units())).toBe(403);
    signInAs("manager");
    expect(await status(account())).toBe(403);
  });

  it("pays open charges and records one payment", async () => {
    signInAs("resident");
    const open = (await account()).charges.filter((charge) => !charge.paidAt);
    const payment = await pay({ chargeIds: open.map((charge) => charge.id), method: "bank" });
    expect(payment).toMatchObject({
      amountCents: 253640,
      method: "bank",
      residentId: "usr_res_amara",
    });
    expect(payment.reference).toMatch(/^PAY-\d+$/);
    const after = await account();
    expect(after.balanceCents).toBe(0);
    expect(after.payments[0]?.id).toBe(payment.id);
    expect(after.charges.filter((charge) => charge.paymentId === payment.id)).toHaveLength(2);
  });

  it("rejects paid (409), foreign (404) and invalid (422) charges", async () => {
    signInAs("resident");
    const paid = (await account()).charges.find((charge) => charge.paidAt);
    expect(await status(pay({ chargeIds: [paid?.id], method: "card" }))).toBe(409);
    const diegos = getDb().charges.find((charge) => charge.residentId === "usr_res_diego");
    expect(await status(pay({ chargeIds: [diegos?.id], method: "card" }))).toBe(404);
    expect(await status(pay({ chargeIds: [], method: "card" }))).toBe(422);
    expect(await status(pay({ chargeIds: ["chg_001", "chg_001"], method: "card" }))).toBe(422);
    expect(await status(pay({ chargeIds: ["chg_001"], method: "crypto" }))).toBe(422);
  });

  it("declines once when the demo failure is armed, changing nothing", async () => {
    signInAs("resident");
    const open = (await account()).charges.find((charge) => !charge.paidAt);
    armFailuresFromUrl(new URL("http://localhost/billing?fail=payments"));
    expect(await status(pay({ chargeIds: [open?.id], method: "card" }))).toBe(502);
    expect(getDb().charges.find((charge) => charge.id === open?.id)?.paidAt).toBeNull();
    expect(await status(pay({ chargeIds: [open?.id], method: "card" }))).toBe(200);
  });
});

describe("staff billing endpoints", () => {
  const damage = { amountCents: 12500, description: "Replace bent closet track" };

  it("lists the active building's unit balances, most overdue first", async () => {
    signInAs("coordinator");
    const rows = await units("bld_harbor");
    expect(rows.map((row) => row.unitLabel)).toEqual(["7A", "4B"]);
    expect(rows[0]).toMatchObject({ residentName: "Diego Santillán", overdueCents: 280000 });
    expect(rows[1]).toMatchObject({ balanceCents: 253640, overdueCents: 0, openCount: 2 });
    // Covered but not active, and not covered: both 404.
    expect(await status(units("bld_maple"))).toBe(404);
    signInAs("usr_coord_theo");
    expect(await status(units("bld_harbor"))).toBe(404);
    signInAs("manager", "bld_linden");
    expect((await units("bld_linden")).map((row) => row.unitLabel)).toEqual(["5D", "12F"]);
  });

  it("lets a coordinator charge a resolved request once", async () => {
    signInAs("coordinator");
    const created = await charge("req_004", damage);
    expect(created).toMatchObject({
      kind: "damage",
      requestId: "req_004",
      residentId: "usr_res_amara",
      amountCents: 12500,
      paidAt: null,
    });
    expect((await charges("req_004")).map((item) => item.id)).toEqual([created.id]);
    expect(await status(charge("req_004", damage))).toBe(409);

    signInAs("resident");
    const mine = await account();
    expect(mine.charges.some((item) => item.id === created.id)).toBe(true);
    expect(mine.balanceCents).toBe(253640 + 12500);
  });

  it("guards damage charges by status, role, scope and input", async () => {
    signInAs("coordinator");
    expect(await status(charge("req_023", damage))).toBe(409); // not resolved
    expect(await status(charge("req_004", { ...damage, amountCents: 50 }))).toBe(422);
    expect(await status(charge("req_004", { ...damage, amountCents: 500001 }))).toBe(422);
    expect(await status(charge("req_004", { ...damage, description: "x" }))).toBe(422);
    signInAs("usr_coord_theo");
    expect(await status(charge("req_004", damage))).toBe(404);
    expect(await status(charges("req_004"))).toBe(404);
    signInAs("manager");
    expect(await status(charge("req_004", damage))).toBe(403);
    expect(await charges("req_004")).toEqual([]);
    signInAs("resident");
    expect(await status(charge("req_004", damage))).toBe(403);
    expect(await status(charges("req_004"))).toBe(403);
    signInAs("usr_res_diego");
    expect(await status(charges("req_004"))).toBe(404);
  });
});
