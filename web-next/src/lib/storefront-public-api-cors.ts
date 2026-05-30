import type { NextRequest } from "next/server";

function parseAllowedOrigins(): string[] {
  const raw =
    process.env.STOREFRONT_PUBLIC_API_CORS_ORIGINS?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "";
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function storefrontPublicApiCorsHeaders(request: NextRequest): HeadersInit {
  const origin = request.headers.get("origin");
  if (!origin) return {};

  const allowed = parseAllowedOrigins();
  if (!allowed.includes(origin)) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, x-horo-wishlist-client",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function withStorefrontPublicApiCors(
  request: NextRequest,
  response: Response,
): Response {
  const cors = storefrontPublicApiCorsHeaders(request);
  for (const [key, value] of Object.entries(cors)) {
    response.headers.set(key, value);
  }
  return response;
}
