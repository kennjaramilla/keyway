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
export const ROUTE_ACTIONS: readonly { prefix: string; action: Action }[] = [
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
