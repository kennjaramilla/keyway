import { z } from "zod";
import { api } from "@/lib/api-client";
import {
  accountSchema,
  chargeSchema,
  paymentSchema,
  unitBalanceListSchema,
  type DamageChargeInput,
  type PaymentCreateInput,
} from "./schema";

/** Unit balances are building-scoped, so their key includes the buildingId. */
export const billingKeys = {
  all: ["billing"] as const,
  account: () => [...billingKeys.all, "account"] as const,
  units: (buildingId: string) => [...billingKeys.all, "units", buildingId] as const,
  requestCharges: (requestId: string) => [...billingKeys.all, "request", requestId] as const,
};

export const fetchAccount = (signal?: AbortSignal) =>
  api.get("/billing", accountSchema, { signal });

export const createPayment = (input: PaymentCreateInput) =>
  api.post("/billing/payments", paymentSchema, input);

export const fetchUnitBalances = (buildingId: string, signal?: AbortSignal) =>
  api.get("/billing/units", unitBalanceListSchema, { query: { buildingId }, signal });

const chargesPath = (requestId: string) => `/requests/${encodeURIComponent(requestId)}/charges`;

export const fetchRequestCharges = (requestId: string, signal?: AbortSignal) =>
  api.get(chargesPath(requestId), z.array(chargeSchema), { signal });

export const createDamageCharge = (requestId: string, input: DamageChargeInput) =>
  api.post(chargesPath(requestId), chargeSchema, input);
