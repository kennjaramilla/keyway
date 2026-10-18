import { DEMO_USER_IDS, type Role } from "@/lib/auth/demo-users";
import { writeSessionCookie } from "@/lib/auth/session-cookie";
import { getDb } from "@/mocks/db";

/**
 * Sign in for a unit test by writing the session cookie the mock API reads.
 * Pass a role for the default persona (Amara, Grace, Helena) or a seeded userId.
 */
export function signInAs(roleOrUserId: Role | string, activeBuildingId?: string) {
  const userId = DEMO_USER_IDS[roleOrUserId as Role] ?? roleOrUserId;
  const user = getDb().users.find((candidate) => candidate.id === userId);
  if (!user) throw new Error(`No seeded user ${userId}`);
  const buildingId = activeBuildingId ?? user.buildingIds[0];
  if (!buildingId) throw new Error(`${userId} has no buildings`);
  writeSessionCookie({ role: user.role, userId: user.id, activeBuildingId: buildingId });
  return user;
}
