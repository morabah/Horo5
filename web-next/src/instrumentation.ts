/**
 * Runs once per server/runtime startup. Warns on common misconfiguration in production
 * without failing the process (aligns with CORE-style env sanity checks, Horo5-specific vars).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const backend =
    process.env.MEDUSA_BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.trim();
  if (!backend) {
    console.warn(
      "[web-next] Production build has no MEDUSA_BACKEND_URL or NEXT_PUBLIC_MEDUSA_BACKEND_URL — server Medusa fetches will fall back to http://localhost:9000.",
    );
  }

  const publishableKey =
    process.env.MEDUSA_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY?.trim();
  if (!publishableKey) {
    console.warn(
      "[web-next] Production build has no MEDUSA_PUBLISHABLE_KEY or NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY — storefront catalog/product requests will fail until set.",
    );
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!site) {
    console.warn(
      "[web-next] Production NEXT_PUBLIC_SITE_URL is unset — canonical URLs, Organization JSON-LD, and sitemap fallbacks may be wrong.",
    );
  } else if (!/^https?:\/\//i.test(site)) {
    console.warn("[web-next] NEXT_PUBLIC_SITE_URL should be an absolute http(s) URL.");
  }
}
