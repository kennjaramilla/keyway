"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { ErrorState } from "@/components/ui/error-state";
import { errorDigest, reportError } from "@/lib/report-error";

export type ErrorBoundaryProps = { error: unknown; retry: () => void };

/** Fallback for a crashed workspace page: the shell stays, so the user can still navigate away. */
export function RouteError({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => reportError(error, { boundary: "workspace" }), [error]);
  const digest = errorDigest(error);
  return (
    <>
      <PageHeader title="Something went wrong" />
      <ErrorState
        title="We couldn't show this page"
        description={
          <>
            Try again. If it keeps happening, choose &ldquo;Reset demo data&rdquo; in your menu.
            {digest && <span className="mt-2 block text-xs">Reference: {digest}</span>}
          </>
        }
        onRetry={retry}
      />
    </>
  );
}
