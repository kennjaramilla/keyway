"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrentSessionContext, toCurrentSession, useSession } from "@/features/session/hooks";
import { ApiError } from "@/lib/api-client";
import { SIGN_IN_PATH } from "@/lib/auth/routes";
import { BuildingSwitcher } from "./BuildingSwitcher";
import { SideNav } from "./SideNav";
import { UserMenu } from "./UserMenu";

/** Authenticated layout: skip link, header (building + user menu), nav and main. */
export function WorkspaceShell({ children }: { children: ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const signedOut = session.error instanceof ApiError && session.error.status === 401;
  const current = useMemo(
    () => (session.data ? toCurrentSession(session.data) : null),
    [session.data],
  );

  useEffect(() => {
    if (signedOut) router.replace(SIGN_IN_PATH);
  }, [signedOut, router]);

  if (!current && (session.isPending || signedOut)) {
    return (
      <div
        role="status"
        aria-label="Loading workspace"
        className="flex min-h-screen flex-col gap-4 p-6"
      >
        <title>Keyway</title>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!current) {
    return (
      <main id="main" className="mx-auto max-w-lg p-6">
        <ErrorState onRetry={() => session.refetch()} retrying={session.isRefetching} />
      </main>
    );
  }

  return (
    <CurrentSessionContext value={current}>
      <div className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-fg focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to main content
        </a>
        <header className="sticky top-0 z-30 border-b border-border bg-surface">
          <div className="flex h-14 items-center gap-3 px-4">
            <Link href="/" className="flex items-center gap-2 rounded-sm font-semibold text-fg">
              <Building2 aria-hidden className="size-5 text-primary" />
              Keyway
            </Link>
            <span aria-hidden className="h-6 w-px bg-border" />
            <BuildingSwitcher />
            <div className="ml-auto">
              <UserMenu />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col md:flex-row">
          <SideNav />
          <main
            id="main"
            tabIndex={-1}
            className="min-w-0 flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8"
          >
            {children}
          </main>
        </div>
      </div>
    </CurrentSessionContext>
  );
}
