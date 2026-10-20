"use client";

import { AlertCircle, RotateCw } from "lucide-react";
import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { errorDigest, reportError } from "@/lib/report-error";
import type { ErrorBoundaryProps } from "./RouteError";

/** Full-page fallback when there's no workspace shell to keep (sign-in, or the root layout itself). */
export function ErrorScreen({
  error,
  retry,
  boundary,
}: ErrorBoundaryProps & { boundary: "root" | "global" }) {
  useEffect(() => reportError(error, { boundary }), [error, boundary]);
  const digest = errorDigest(error);
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <title>Something went wrong · Keyway</title>
      <AlertCircle aria-hidden className="size-10 text-danger" />
      <h1 className="text-2xl font-semibold text-fg">Something went wrong</h1>
      <p role="alert" className="text-fg-muted">
        Keyway hit an unexpected problem. Try again, or go back to your home page.
      </p>
      {digest && <p className="text-xs text-fg-muted">Reference: {digest}</p>}
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button onClick={retry}>
          <RotateCw aria-hidden />
          Try again
        </Button>
        <Link href="/" className={buttonVariants({ variant: "secondary" })}>
          Go to your home page
        </Link>
      </div>
    </main>
  );
}
