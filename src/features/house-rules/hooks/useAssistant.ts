"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { askHouseRules, assistantKeys, fetchAssistantMode } from "../api";

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
