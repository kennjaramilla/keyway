import { z } from "zod";

export const CHARGE_KINDS = ["rent", "utilities", "fee", "damage"] as const;
export const chargeKindSchema = z.enum(CHARGE_KINDS);
export type ChargeKind = z.infer<typeof chargeKindSchema>;

export const CHARGE_KIND_LABELS: Record<ChargeKind, string> = {
  rent: "Rent",
  utilities: "Utilities",
  fee: "Fee",
  damage: "Damage repair",
};

/** Saved demo payment methods. There's no card entry: the demo never handles card numbers. */
export const PAYMENT_METHODS = {
  card: "Visa ending 4242",
  bank: "Checking ending 6789",
} as const;
export const paymentMethodSchema = z.enum(["card", "bank"]);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

/** Money is whole cents, never floats. */
const cents = z.number().int().positive();

export const chargeSchema = z.object({
  id: z.string(),
  buildingId: z.string(),
  unitId: z.string(),
  residentId: z.string(),
  kind: chargeKindSchema,
  description: z.string(),
  amountCents: cents,
  dueAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  paidAt: z.iso.datetime().nullable(),
  paymentId: z.string().nullable(),
  /** The maintenance request a damage charge is for. */
  requestId: z.string().nullable(),
});
export type Charge = z.infer<typeof chargeSchema>;

export const paymentSchema = z.object({
  id: z.string(),
  reference: z.string(),
  buildingId: z.string(),
  unitId: z.string(),
  residentId: z.string(),
  chargeIds: z.array(z.string()).min(1),
  amountCents: cents,
  method: paymentMethodSchema,
  createdAt: z.iso.datetime(),
});
export type Payment = z.infer<typeof paymentSchema>;

/** POST /api/billing/payments */
export const paymentCreateSchema = z.object({
  chargeIds: z
    .array(z.string())
    .min(1, "Choose at least one charge to pay.")
    .refine((ids) => new Set(ids).size === ids.length, "Each charge can be paid once."),
  method: paymentMethodSchema,
});
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;

export type ChargeStatus = "paid" | "overdue" | "due";

export function chargeStatus(charge: Pick<Charge, "paidAt" | "dueAt">, now = Date.now()) {
  if (charge.paidAt) return "paid" satisfies ChargeStatus;
  return Date.parse(charge.dueAt) < now ? "overdue" : "due";
}

/** GET /api/billing: the resident's account. Totals are computed by the server. */
export const accountSchema = z.object({
  charges: z.array(chargeSchema),
  payments: z.array(paymentSchema),
  balanceCents: z.number().int().nonnegative(),
  overdueCents: z.number().int().nonnegative(),
});
export type Account = z.infer<typeof accountSchema>;

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
/** "$2,450.00" */
export const formatMoney = (amountCents: number) => usd.format(amountCents / 100);
