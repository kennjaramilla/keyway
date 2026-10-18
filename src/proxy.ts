import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decodeSession } from "./lib/auth/demo-users";
import { roleCan } from "./lib/auth/permissions";
import { FORBIDDEN_PATH, SIGN_IN_PATH, actionForPath, homePathFor } from "./lib/auth/routes";

/**
 * Optimistic route gating from the session cookie. Real authorization is
 * enforced again by the (mock) API on every request.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  const redirect = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if (pathname === SIGN_IN_PATH) {
    return session ? redirect(homePathFor(session.role)) : NextResponse.next();
  }
  if (pathname === "/") {
    return redirect(session ? homePathFor(session.role) : SIGN_IN_PATH);
  }

  const action = actionForPath(pathname);
  if (!action) return NextResponse.next();
  if (!session) {
    return redirect(`${SIGN_IN_PATH}?next=${encodeURIComponent(pathname + search)}`);
  }
  if (!roleCan(session.role, action)) {
    // Rewrite (not redirect) so the URL stays put and shows the no-access page.
    return NextResponse.rewrite(new URL(FORBIDDEN_PATH, request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Pages only: skip API routes, Next internals, the MSW worker and static files.
  matcher: [
    "/((?!api|_next/static|_next/image|mockServiceWorker\\.js|favicon\\.ico|.*\\.[a-z0-9]+$).*)",
  ],
};
