"use client";

import { useSyncExternalStore } from "react";

/** Live result of a CSS media query; false on the server and where matchMedia is missing. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => (typeof window.matchMedia === "function" ? window.matchMedia(query).matches : false),
    () => false,
  );
}

/** Below Tailwind's md breakpoint. */
export const PHONE_QUERY = "(max-width: 767px)";
