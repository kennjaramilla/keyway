import type { Action } from "./permissions";

export type NavItem = { href: string; label: string; action: Action };

/** Sidebar order. Filtered per user with roleCan(). */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", action: "dashboard:view" },
  { href: "/requests", label: "Requests", action: "request:list" },
  { href: "/messages", label: "Messages", action: "thread:view" },
  { href: "/house-rules", label: "House rules", action: "rules:ask" },
];

/** Route prefix → action required to open it (most specific first). Used by proxy.ts. */
const ROUTE_ACTIONS: readonly { prefix: string; action: Action }[] = [
  { prefix: "/requests/new", action: "request:create" },
  ...NAV_ITEMS.map(({ href, action }) => ({ prefix: href, action })),
];

export function actionForPath(pathname: string): Action | null {
  const match = ROUTE_ACTIONS.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return match?.action ?? null;
}

export const SIGN_IN_PATH = "/sign-in";
export const FORBIDDEN_PATH = "/forbidden";

export function homePathFor(role: string) {
  return role === "manager" ? "/dashboard" : "/requests";
}

/** The same-origin path from a ?next value, or null if it would leave the site. */
export function safeNextPath(next: string | null, origin: string): string | null {
  if (!next) return null;
  try {
    const url = new URL(next, origin);
    return url.origin === origin ? url.pathname + url.search + url.hash : null;
  } catch {
    return null;
  }
}

/** Where to go after switching building: a record page of the old building becomes its list. */
export function pathAfterBuildingSwitch(pathname: string): string | null {
  const match = /^\/(requests|messages)\/([^/]+)$/.exec(pathname);
  if (!match || pathname === "/requests/new") return null;
  return `/${match[1]}`;
}

/** Pages that span every building, so the building switcher doesn't apply. */
export function isPortfolioPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}
