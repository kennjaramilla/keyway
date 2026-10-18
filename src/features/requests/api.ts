import { api } from "@/lib/api-client";
import { requestListSchema, requestSchema, type Status } from "./schema";

export type RequestFilters = {
  buildingId: string;
  status?: Status;
  sort?: "newest" | "oldest" | "updated";
};

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

export const fetchRequests = ({ buildingId, status, sort }: RequestFilters, signal?: AbortSignal) =>
  api.get("/requests", requestListSchema, { query: { buildingId, status, sort }, signal });

export const fetchRequest = (id: string, signal?: AbortSignal) =>
  api.get(`/requests/${encodeURIComponent(id)}`, requestSchema, { signal });
