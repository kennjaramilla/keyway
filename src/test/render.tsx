import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { makeTestQueryClient } from "@/lib/query-client";

type Options = Omit<RenderOptions, "wrapper"> & { queryClient?: QueryClient };

/** Render with the same providers the app uses, plus a user-event instance. */
export function renderWithProviders(ui: ReactElement, { queryClient, ...options }: Options = {}) {
  const client = queryClient ?? makeTestQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return {
    user: userEvent.setup(),
    queryClient: client,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

export * from "@testing-library/react";
