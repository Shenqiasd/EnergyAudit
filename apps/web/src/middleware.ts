import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api", "/_next", "/favicon.ico"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow the root page (dev mode role selector)
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Check for auth token in cookies or authorization header
  const token =
    request.cookies.get("energy_audit_token")?.value ??
    request.headers.get("authorization")?.replace("Bearer ", "");

  // If no token, we still allow access since auth state is managed client-side
  // The client-side auth provider will handle redirects
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
