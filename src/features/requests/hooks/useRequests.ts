"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentSession } from "@/features/session/hooks";
import { fetchRequests, requestKeys, type RequestFilters } from "../api";

/** Requests in the active building (residents: their own unit; the API scopes it). */
export function useRequests(filters: Omit<RequestFilters, "buildingId"> = {}) {
  const { user } = useCurrentSession();
  const key = { ...filters, buildingId: user.activeBuildingId };
  return useQuery({
    queryKey: requestKeys.list(key),
    queryFn: ({ signal }) => fetchRequests(key, signal),
  });
}
