import { z } from "zod";
import { vendorSchema } from "@/features/vendors/schema";
import { api } from "@/lib/api-client";
import {
  requestDetailSchema,
  requestListItemsSchema,
  type RequestCreate,
  type VisitWindow,
} from "./schema";

export type RequestFilters = { buildingId: string };

/**
 * Query keys. Building-scoped keys include the buildingId so switching
 * buildings can never show another building's cached data.
 */
export const requestKeys = {
  all: ["requests"] as const,
  lists: () => [...requestKeys.all, "list"] as const,
  list: (filters: RequestFilters) => [...requestKeys.lists(), filters] as const,
  detail: (id: string) => [...requestKeys.all, "detail", id] as const,
};

export const vendorKeys = {
  list: (buildingId: string) => ["vendors", { buildingId }] as const,
};

export const fetchRequests = ({ buildingId }: RequestFilters, signal?: AbortSignal) =>
  api.get("/requests", requestListItemsSchema, { query: { buildingId }, signal });

export const fetchRequest = (id: string, signal?: AbortSignal) =>
  api.get(`/requests/${encodeURIComponent(id)}`, requestDetailSchema, { signal });

export const createRequest = (input: RequestCreate) =>
  api.post("/requests", requestDetailSchema, input);

export const fetchVendors = (buildingId: string, signal?: AbortSignal) =>
  api.get("/vendors", z.array(vendorSchema), { query: { buildingId }, signal });

/** Body for each workflow action (POST /requests/:id/<action>). */
export type WorkflowInput =
  | { action: "triage"; body: { category?: string; urgency?: string; note?: string } }
  | { action: "assign"; body: { vendorId: string } }
  | { action: "schedule"; body: VisitWindow }
  | { action: "start"; body?: undefined }
  | { action: "resolve"; body: { resolutionNote: string } }
  | { action: "cancel"; body: { reason?: string } }
  | { action: "reopen"; body: { reason: string } };

export const runWorkflowAction = (id: string, { action, body }: WorkflowInput) =>
  api.post(`/requests/${encodeURIComponent(id)}/${action}`, requestDetailSchema, body ?? {});
