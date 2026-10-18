"use client";

import { useEffect, useState, type ReactNode } from "react";

const mockingEnabled = process.env.NEXT_PUBLIC_API_MOCKING !== "off";

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
    (async () => {
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
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div
        role="status"
        className="flex min-h-screen items-center justify-center text-sm text-fg-muted"
      >
        Loading Keyway…
      </div>
    );
  }
  return children;
}
