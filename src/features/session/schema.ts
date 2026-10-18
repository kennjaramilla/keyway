import { z } from "zod";
import { buildingSchema, unitSchema } from "@/features/buildings/schema";
import { ROLES } from "@/lib/auth/demo-users";

export const roleSchema = z.enum(ROLES);

export const userSchema = z.object({
  id: z.string(),
  role: roleSchema,
  name: z.string(),
  email: z.string(),
  unitId: z.string().nullable(),
  buildingIds: z.array(z.string()),
});
export type User = z.infer<typeof userSchema>;

/** The signed-in user as `can()` sees it: the user plus the active building. */
export const sessionUserSchema = userSchema.extend({ activeBuildingId: z.string() });
export type SessionUser = z.infer<typeof sessionUserSchema>;

/** GET /api/session: who is signed in and the buildings they may see. */
export const sessionSchema = z.object({
  user: sessionUserSchema,
  buildings: z.array(buildingSchema),
  unit: unitSchema.nullable(),
});
export type SessionPayload = z.infer<typeof sessionSchema>;

/** GET /api/demo/people: the seeded people shown on the demo sign-in page. */
export const demoPersonSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: roleSchema,
  /** "Harbor View Lofts · 4B" for residents, covered buildings otherwise. */
  context: z.string(),
});
export const demoPeopleSchema = z.array(demoPersonSchema);
export type DemoPerson = z.infer<typeof demoPersonSchema>;

export const signInSchema = z.object({ userId: z.string().min(1) });
export const switchBuildingSchema = z.object({ buildingId: z.string().min(1) });
