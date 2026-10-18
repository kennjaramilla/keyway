"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrentSessionContext, toCurrentSession, useSession } from "@/features/session/hooks";
import { ApiError } from "@/lib/api-client";
import { ROLE_LABELS } from "@/lib/auth/demo-users";
import { SIGN_IN_PATH } from "@/lib/auth/routes";
import { BrandMark } from "./BrandMark";
import { BuildingSwitcher } from "./BuildingSwitcher";
import { SideNav } from "./SideNav";
import { useFocusOnNavigate } from "./route-focus";
import { UserMenu } from "./UserMenu";

/** Authenticated layout: skip link, sidebar nav (bottom tabs on phones), header and main. */
export function WorkspaceShell({ children }: { children: ReactNode }) {
  const session = useSession();
  const router = useRouter();
  useFocusOnNavigate();
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
      <div className="min-h-screen md:flex">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-fg focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to main content
        </a>
        {/* Sidebar on desktop; on phones only its nav shows, as a bottom tab bar. */}
        <div className="contents md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:bg-sidebar">
          <Link
            href="/"
            className="mx-3 mt-4 mb-6 hidden rounded-md p-2 focus-visible:outline-sidebar-fg md:block"
          >
            <BrandMark onDark subtitle={`${ROLE_LABELS[current.user.role]} portal`} />
          </Link>
          <SideNav />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
            <div className="flex h-16 min-w-0 items-center gap-3 px-4 sm:px-6 lg:px-8">
              <Link href="/" className="shrink-0 rounded-md md:hidden" aria-label="Keyway home">
                <BrandMark />
              </Link>
              <span aria-hidden className="h-6 w-px bg-border md:hidden" />
              <BuildingSwitcher />
              <div className="ml-auto shrink-0">
                <UserMenu />
              </div>
            </div>
          </header>
          <main
            id="main"
            tabIndex={-1}
            className="min-w-0 flex-1 px-4 pt-6 pb-28 outline-none sm:px-6 md:pb-10 lg:px-8"
          >
            {children}
          </main>
        </div>
      </div>
    </CurrentSessionContext>
  );
}
