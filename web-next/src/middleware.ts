import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { HORO_OPS_SESSION_COOKIE } from "@/lib/horo-ops-constants";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/internal/horo-ops/login")) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/internal/horo-ops")) {
    if (!request.cookies.has(HORO_OPS_SESSION_COOKIE)) {
      return NextResponse.redirect(new URL("/internal/horo-ops/login", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/internal/horo-ops/:path*"],
};
