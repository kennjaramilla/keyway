import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { WorkspaceShell } from "@/components/shell/WorkspaceShell";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Role } from "@/lib/auth/demo-users";
import { makeTestQueryClient } from "@/lib/query-client";
import { signInAs } from "./session";

type Options = Omit<RenderOptions, "wrapper"> & {
  queryClient?: QueryClient;
  /** Mount a Toaster (default true). Off for stories that render their own. */
  toaster?: boolean;
};

/** Render with the app's providers (query client, tooltips, toasts) plus a user-event instance. */
export function renderWithProviders(
  ui: ReactElement,
  { queryClient, toaster = true, ...options }: Options = {},
) {
  const client = queryClient ?? makeTestQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <TooltipProvider delayDuration={0}>
          {children}
          {toaster && <Toaster />}
        </TooltipProvider>
      </QueryClientProvider>
    );
  }
  return {
    user: userEvent.setup(),
    queryClient: client,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

/**
 * Sign in (role or seeded userId) and render inside the real workspace shell,
 * which loads the session from the mock API. Await a heading before asserting.
 */
export function renderInWorkspace(
  ui: ReactElement,
  {
    as = "resident",
    buildingId,
    ...options
  }: Options & { as?: Role | string; buildingId?: string } = {},
) {
  const user = signInAs(as, buildingId);
  return {
    signedInAs: user,
    ...renderWithProviders(<WorkspaceShell>{ui}</WorkspaceShell>, options),
  };
}

export * from "@testing-library/react";
