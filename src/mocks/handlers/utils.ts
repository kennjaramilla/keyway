import { HttpResponse } from "msw";
import type { z } from "zod";
import type { SessionUser } from "@/features/session/schema";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth/demo-users";
import { authorize, type Action, type Resource } from "@/lib/auth/permissions";
import { readSessionCookie } from "@/lib/auth/session-cookie";
import { getDb } from "../db";

/** Base path for mock endpoints; mirrors api-client's default base URL. */
export const API = "*/api";

export function problem(
  status: number,
  title: string,
  detail?: string,
  extra?: Record<string, unknown>,
) {
  return HttpResponse.json({ title, status, detail, ...extra }, { status });
}

export const unauthorized = () => problem(401, "Not signed in", "Sign in to continue.");
export const forbidden = () => problem(403, "Forbidden", "You don't have permission to do that.");
export const notFound = (what = "Resource") => problem(404, "Not found", `${what} not found.`);
export const conflict = (code: string, detail: string) =>
  problem(409, "Conflict", detail, { code });

export function validationError(error: z.ZodError) {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (errors[key] ??= []).push(issue.message);
  }
  return problem(422, "Validation failed", "Some fields need attention.", { errors });
}

/**
 * Resolve the signed-in user from the session cookie against the db. The
 * role and active building are re-validated, so a hand-edited cookie can't
 * widen scope. Falls back to document.cookie for Node test environments.
 */
export function sessionUser(cookies: Record<string, string>): SessionUser | null {
  const session = decodeSession(cookies[SESSION_COOKIE]) ?? readSessionCookie();
  if (!session) return null;
  const user = getDb().users.find((candidate) => candidate.id === session.userId);
  if (!user || user.role !== session.role) return null;
  const activeBuildingId = user.buildingIds.includes(session.activeBuildingId)
    ? session.activeBuildingId
    : user.buildingIds[0];
  return activeBuildingId ? { ...user, activeBuildingId } : null;
}

/** 403/404 response for a denied action, or null when allowed. */
export function deny(user: SessionUser, action: Action, resource?: Resource) {
  const decision = authorize(user, action, resource);
  if (decision === "not_found") return notFound();
  if (decision === "forbidden") return forbidden();
  return null;
}
