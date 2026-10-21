"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { setPassthroughRecovery } from "@/lib/api-client";

const mockingEnabled = process.env.NEXT_PUBLIC_API_MOCKING !== "off";

let starting: Promise<void> | null = null;
let reattaching: Promise<boolean> | null = null;

/**
 * Chrome stops idle service workers (e.g. in a background tab) and the restarted
 * worker forgets this tab, so requests pass through to the server. Re-register it.
 */
function reattachWorker() {
  const controller = navigator.serviceWorker?.controller;
  if (!controller) return Promise.resolve(false);
  reattaching ??= new Promise<boolean>((resolve) => {
    const done = (ok: boolean) => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
      clearTimeout(timer);
      reattaching = null;
      resolve(ok);
    };
    const onMessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === "MOCKING_ENABLED") done(true);
    };
    const timer = setTimeout(() => done(false), 3000);
    navigator.serviceWorker.addEventListener("message", onMessage);
    controller.postMessage("MOCK_ACTIVATE");
  });
  return reattaching;
}

/** Starts the worker once per page load (Strict Mode runs effects twice in dev). */
function startMockApi() {
  starting ??= (async () => {
    const url = new URL(window.location.href);
    const { armFailuresFromUrl } = await import("./demo-failures");
    armFailuresFromUrl(url);
    if (url.searchParams.has("reset")) {
      const { resetDb } = await import("./db");
      resetDb();
      url.searchParams.delete("reset");
      window.history.replaceState(null, "", url);
    }
    const { worker } = await import("./browser");
    await worker.start({
      serviceWorker: { url: "/mockServiceWorker.js" },
      onUnhandledFrame: "bypass",
      quiet: process.env.NODE_ENV === "production",
    });
    setPassthroughRecovery(reattachWorker);
  })();
  return starting;
}

/**
 * Starts the MSW worker (the demo's only "backend", see ADR 0001) and holds
 * rendering until it is ready, so no request escapes before it is intercepted.
 * `?reset` on any URL re-seeds the mock db first; `?fail=messages` arms a demo failure.
 */
export function MockApiProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!mockingEnabled);

  useEffect(() => {
    if (!mockingEnabled) return;
    let cancelled = false;
    startMockApi().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return loading;
  // Real API: nothing to wait for, but pages still need a boundary to prerender around.
  return mockingEnabled ? children : <Suspense fallback={loading}>{children}</Suspense>;
}

const loading = (
  <div
    role="status"
    className="flex min-h-screen items-center justify-center text-sm text-fg-muted"
  >
    Loading Keyway…
  </div>
);
