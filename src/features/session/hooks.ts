"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { homePathFor, SIGN_IN_PATH } from "@/lib/auth/routes";
import {
  fetchDemoPeople,
  fetchSession,
  resetDemoData,
  sessionKeys,
  signIn,
  signOut,
  switchBuilding,
} from "./api";
import type { SessionPayload } from "./schema";

/** The current session (user, in-scope buildings, unit). 401 means signed out. */
export function useSession() {
  return useQuery({ queryKey: sessionKeys.current, queryFn: fetchSession, staleTime: Infinity });
}

export type CurrentSession = SessionPayload & {
  activeBuilding: SessionPayload["buildings"][number];
};

/** Provided by WorkspaceShell once the session has loaded. */
export const CurrentSessionContext = createContext<CurrentSession | null>(null);

/** The signed-in user, their buildings and the active building. Use inside the workspace shell. */
export function useCurrentSession(): CurrentSession {
  const session = use(CurrentSessionContext);
  if (!session) throw new Error("useCurrentSession must be used inside WorkspaceShell");
  return session;
}

export function toCurrentSession(data: SessionPayload): CurrentSession | null {
  const activeBuilding = data.buildings.find(
    (building) => building.id === data.user.activeBuildingId,
  );
  return activeBuilding ? { ...data, activeBuilding } : null;
}

export function useDemoPeople() {
  return useQuery({ queryKey: sessionKeys.people, queryFn: fetchDemoPeople });
}

export function useSignIn() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: signIn,
    onSuccess: (session) => {
      queryClient.clear();
      queryClient.setQueryData(sessionKeys.current, session);
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(
        next?.startsWith("/") && !next.startsWith("//") ? next : homePathFor(session.user.role),
      );
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      router.replace(SIGN_IN_PATH);
      queryClient.clear();
    },
  });
}

/** Switch the active building; every building-scoped query is refetched. */
export function useSwitchBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: switchBuilding,
    onSuccess: async (session) => {
      queryClient.setQueryData(sessionKeys.current, session);
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] !== "session",
      });
    },
    onError: () =>
      toast({
        title: "Couldn't switch building",
        description: "Please try again.",
        tone: "danger",
      }),
  });
}

export function useResetDemoData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetDemoData,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast({ title: "Demo data reset", tone: "success" });
    },
    onError: () => toast({ title: "Couldn't reset demo data", tone: "danger" }),
  });
}
