import { NextRequest, NextResponse } from "next/server"

import { verifyCartRecoverToken } from "@/lib/cart-recover-token"
import { MEDUSA_CART_ID_COOKIE } from "@/storefront/cart/types"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim()
  if (!token) {
    return NextResponse.redirect(new URL("/cart", request.url), 302)
  }

  const payload = verifyCartRecoverToken(token)
  if (!payload) {
    return NextResponse.redirect(new URL("/cart?recover=invalid", request.url), 302)
  }

  const response = NextResponse.redirect(new URL("/cart?recovered=1", request.url), 302)
  response.cookies.set(MEDUSA_CART_ID_COOKIE, payload.cart_id, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 14,
    httpOnly: false,
  })
  return response
}
