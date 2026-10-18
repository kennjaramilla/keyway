"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ThemeSync } from "@/components/theme/ThemeSync";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { makeQueryClient } from "@/lib/query-client";
import { MockApiProvider } from "@/mocks/MockApiProvider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
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
