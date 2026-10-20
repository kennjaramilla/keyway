"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentSession } from "@/features/session/hooks";
import { roleCan } from "@/lib/auth/permissions";
import { fetchThreads, messageKeys } from "../api";

/** Conversations in scope (residents: their own; coordinators: the active building). */
export function useThreads(enabled = true) {
  const { user } = useCurrentSession();
  return useQuery({
    queryKey: messageKeys.threads(user.activeBuildingId),
    queryFn: ({ signal }) => fetchThreads(user.activeBuildingId, signal),
    refetchInterval: 15_000,
    enabled,
  });
}

/** Unread messages across the conversations in scope, for the nav badge (0 without an inbox). */
export function useUnreadTotal() {
  const { user } = useCurrentSession();
  const threads = useThreads(roleCan(user.role, "thread:view"));
  return threads.data?.reduce((sum, thread) => sum + thread.unreadCount, 0) ?? 0;
}
