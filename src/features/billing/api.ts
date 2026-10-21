import { api } from "@/lib/api-client";
import { accountSchema, paymentSchema, type PaymentCreateInput } from "./schema";

export const billingKeys = {
  all: ["billing"] as const,
  account: () => [...billingKeys.all, "account"] as const,
};

export const fetchAccount = (signal?: AbortSignal) =>
  api.get("/billing", accountSchema, { signal });

export const createPayment = (input: PaymentCreateInput) =>
  api.post("/billing/payments", paymentSchema, input);
