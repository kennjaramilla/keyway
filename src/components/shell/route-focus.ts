"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// False until the first page has rendered, so a fresh load keeps focus at the top (skip link first).
let navigatedClientSide = false;

/** Call once from the root providers, after the first render. */
export function markFirstRenderDone() {
  navigatedClientSide = true;
}

/**
 * After a client-side navigation, move focus to the visible page heading (or main),
 * so screen reader and keyboard users start at the new page instead of the old link.
 */
export function useFocusOnNavigate() {
  const pathname = usePathname();
  useEffect(() => {
    if (!navigatedClientSide) return;
    const frame = requestAnimationFrame(() => {
      const main = document.getElementById("main");
      // Cache Components keeps visited pages mounted but hidden, so pick the visible h1.
      const heading = [...(main?.querySelectorAll<HTMLElement>("h1") ?? [])].find(
        (element) => !element.closest('[style*="display: none"]'),
      );
      (heading ?? main)?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);
}
