"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { markFirstRenderDone } from "@/components/shell/route-focus";
import { ThemeSync } from "@/components/theme/ThemeSync";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { makeQueryClient } from "@/lib/query-client";
import { MockApiProvider } from "@/mocks/MockApiProvider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  useEffect(markFirstRenderDone, []);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <ThemeSync />
        <MockApiProvider>{children}</MockApiProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
