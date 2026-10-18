// No path aliases here: Cypress imports this file directly.

export const ROLES = ["resident", "coordinator", "manager"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  resident: "Resident",
  coordinator: "Coordinator",
  manager: "Property Manager",
};

export const SESSION_COOKIE = "keyway_session";

/** The seeded user each role signs in as from the demo role picker. */
export const DEMO_USER_IDS: Record<Role, string> = {
  resident: "user-resident-1",
  coordinator: "user-coordinator-1",
  manager: "user-manager-1",
};

export type Session = { role: Role; userId: string };

/** Cookie value is `<role>.<userId>`: readable by proxy.ts, the client and the mock API. */
export function encodeSession(session: Session) {
  return `${session.role}.${session.userId}`;
}

export function decodeSession(value: string | undefined | null): Session | null {
  if (!value) return null;
  const [role, userId] = decodeURIComponent(value).split(".", 2);
  if (!userId || !ROLES.includes(role as Role)) return null;
  return { role: role as Role, userId };
}
