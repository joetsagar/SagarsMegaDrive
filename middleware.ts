import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// This is an optimistic check (cookie presence only, not validated) so it can
// run on the edge without pulling in Prisma. It exists to bounce obviously
// logged-out/logged-in requests early; the real authorization boundary is
// auth.api.getSession() in app/(dashboard)/layout.tsx.
export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === "/login";

  if (!sessionCookie && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
