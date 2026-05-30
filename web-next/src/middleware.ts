import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { HORO_OPS_SESSION_COOKIE } from "@/lib/horo-ops-constants";

const TEASE_ALLOWED_PREFIXES = [
  "/",
  "/waitlist",
  "/api/",
  "/_next/",
  "/images/",
  "/brand/",
  "/videos/",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Ops dashboard auth (existing)
  if (pathname.startsWith("/internal/horo-ops/login")) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/internal/horo-ops")) {
    if (!request.cookies.has(HORO_OPS_SESSION_COOKIE)) {
      return NextResponse.redirect(new URL("/internal/horo-ops/login", request.url));
    }
  }

  // 2. Tease mode: block all non-essential routes
  const phase = process.env.NEXT_PUBLIC_PRELAUNCH_PHASE;
  if (phase === "tease") {
    const isAllowed = TEASE_ALLOWED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
    );
    if (!isAllowed) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  const response = NextResponse.next();
  const uiLocale = request.nextUrl.searchParams.get("uiLocale");
  if (uiLocale === "en" || uiLocale === "ar") {
    response.cookies.set("horo-ui-locale", uiLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  matcher: ["/internal/horo-ops/:path*", "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
