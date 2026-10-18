"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentSession } from "@/features/session/hooks";
import { fetchThreads, messageKeys } from "../api";

/** Conversations in scope (residents: their own; coordinators: the active building). */
export function useThreads() {
  const { user } = useCurrentSession();
  return useQuery({
    queryKey: messageKeys.threads(user.activeBuildingId),
    queryFn: ({ signal }) => fetchThreads(user.activeBuildingId, signal),
    refetchInterval: 15_000,
  });
}
