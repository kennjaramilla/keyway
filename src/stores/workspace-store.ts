import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemePreference = "light" | "dark" | "system";

type WorkspaceState = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
};

/** Persisted key; ThemeScript reads it before paint to avoid a theme flash. */
export const WORKSPACE_STORAGE_KEY = "keyway:workspace";

/**
 * Client-only UI preferences. Server state (session, active building,
 * requests...) belongs in TanStack Query, not here.
 */
export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),
    }),
    { name: WORKSPACE_STORAGE_KEY, storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);
