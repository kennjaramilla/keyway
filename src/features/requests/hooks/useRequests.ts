"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentSession } from "@/features/session/hooks";
import { fetchRequests, requestKeys } from "../api";

/** Requests in the active building (residents: their own unit; the API scopes it). */
export function useRequests() {
  const { user } = useCurrentSession();
  const key = { buildingId: user.activeBuildingId };
  return useQuery({
    queryKey: requestKeys.list(key),
    queryFn: ({ signal }) => fetchRequests(key, signal),
  });
}
