import { SESSION_COOKIE, decodeSession, encodeSession, type Session } from "./demo-users";

/**
 * document.cookie access for the session. Only the mock API writes it (as a
 * real backend would with Set-Cookie); proxy.ts reads it on navigation.
 */

export function readSessionCookie(): Session | null {
  if (typeof document === "undefined") return null;
  const entry = document.cookie.split("; ").find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return decodeSession(entry?.slice(SESSION_COOKIE.length + 1));
}

export function writeSessionCookie(session: Session) {
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(encodeSession(session))}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`;
}

export function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
}
