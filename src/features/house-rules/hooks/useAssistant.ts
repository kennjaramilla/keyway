"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { askHouseRules, assistantKeys, fetchAssistantMode, fetchRules, rulesKeys } from "../api";

/** "retrieval" or "claude", as configured on the server. */
export function useAssistantMode() {
  return useQuery({
    queryKey: assistantKeys.mode,
    queryFn: fetchAssistantMode,
    staleTime: Infinity,
  });
}

export function useAskHouseRules() {
  return useMutation({ mutationFn: askHouseRules });
}

export function useRules(buildingId: string) {
  return useQuery({
    queryKey: rulesKeys.document(buildingId),
    queryFn: ({ signal }) => fetchRules(buildingId, signal),
    staleTime: Infinity,
  });
}
