# Horo5 Production Performance Audit

> **Target:** `https://horo5.vercel.app/` — `web-next/` (Next.js 16.2.3 + React 19, Vercel) + `medusa-backend/` (Medusa v2.14.1, Railway).
> **Date:** 2026-04-27 (UTC+03:00). Edge tested from `fra1` (Vercel).
> **Scope:** Code audit + small set of live HTTP probes. **No code changes made.** Each finding is tagged: **Measured / Strongly Inferred / Needs runtime profiling / Needs production data**.

---

## 1. Executive Technical Verdict

- **Current performance condition:** Solid foundations (App Router, ISR + stale-while-revalidate, tagged data cache, immutable static assets) **undone** by a mostly-client storefront ported from a Vite SPA, routed via a `react-router-dom` shim that disables `next/link` prefetching.
- **Biggest frontend bottleneck:** **No `next/link` and no `next/dynamic` anywhere.** Internal links are plain `<a>` from `@/Volumes/Rabah_SSD/enrpreneurship/Horo5/web-next/src/lib/react-router-dom-shim.tsx:48`, and ~11,200 lines of client-only TSX (`Checkout.tsx` 2,402 + `Search.tsx` 1,498 + `ProductDetail.tsx` 1,434 + `ShopAll.tsx` 902 + `Cart.tsx` 864 + …) all ship in the same graph. Result on home: ~660 KB JS uncompressed (~200 KB brotli), no hover/viewport prefetch, full HTML re-fetch on every nav. (**Measured**)
- **Biggest backend bottleneck:** **Medusa `/storefront/catalog` has no CDN layer** and the in-process server cache is **disabled in production** (`@/Volumes/Rabah_SSD/enrpreneurship/Horo5/medusa-backend/src/lib/storefront/catalog.ts:1774`). Three back-to-back probes returned `x-vercel-cache: MISS` / `x-cache: MISS` with TTFB 619–723 ms. Every Vercel ISR revalidation rebuilds the full DTO against Postgres. (**Measured**)
- **Biggest caching opportunity:** Move `(main)/layout.tsx` off fetching the **full** catalog. Today every public page (`/faq`, `/terms`, `/privacy`, `/exchange`, `/size-guide`, `/about`) pays the catalog cost because the layout calls `fetchStorefrontCatalogServer()` (`@/Volumes/Rabah_SSD/enrpreneurship/Horo5/web-next/src/app/(main)/layout.tsx:12`). And `AppProviders` re-fetches it client-side via `hydrateRuntimeCatalog()` if any sub-array is empty (`@/Volumes/Rabah_SSD/enrpreneurship/Horo5/web-next/src/storefront/AppProviders.tsx:63`). (**Measured**)
- **Biggest image issue:** **LCP image is a raw `<img>`**, not `next/image`, not preloaded — `@/Volumes/Rabah_SSD/enrpreneurship/Horo5/web-next/src/storefront/components/HomeHeroWearMean.tsx:54`. Plus assets in `public/` are served `cache-control: public, max-age=0, must-revalidate` (Vercel default), so repeat visits pay 304 round-trips. (**Measured**)
- **Biggest scalability risk:** Drop launches and Instagram-spike scenarios will hammer `/storefront/catalog` (60-second ISR window × per-region misses + organic client-side re-hydrations). Combined with disabled Medusa in-process cache, this becomes a Postgres + module-service rebuild storm. (**Strongly Inferred**)
- **Production readiness score:** **6 / 10**. Public-page rendering and cart/checkout correctness are solid; bundle weight, link prefetching, image LCP, and backend cache are not.
- **Estimated risk under 1k-visitor spike:** **Medium-High.** Prerendered HTML scales fine via Vercel CDN. The risk is `/storefront/catalog` calls when ISR expires region-by-region.
- **First fix to do:** (1) Add `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` on Medusa `/storefront/*` responses **AND** re-enable `STOREFRONT_CATALOG_SERVER_CACHE_MS=60000` on Railway, AND (2) start migrating internal links to `next/link` (begin with `Nav.tsx` + `MerchProductCard.tsx`).

---

## 2. Stack and Architecture Findings

| Aspect | Finding | Source |
|---|---|---|
| Framework | **Next.js 16.2.3** (Cache Components OFF — fetch-based revalidate model) | `web-next/package.json:22` |
| React | 19.2.4 | `web-next/package.json:23-24` |
| Routing | **App Router**, route groups `(main)/`, `(checkout)/`, `internal/`. 25 `page.tsx` files. **No `loading.tsx` anywhere.** | `web-next/src/app/` |
| Bundler | **Webpack** (build forces `--webpack`; Next 16 supports Turbopack stable but it's not used) | `web-next/package.json:11` |
| Hosting | Vercel; build symlinked from monorepo root | `vercel.json:5`, `package.json:6` |
| Backend | **Medusa v2.14.1** + Postgres on Railway via root `Dockerfile`; `@medusajs/caching-redis` and `@medusajs/locking-redis` installed | `medusa-backend/package.json:71-86`, `Dockerfile`, `railway.toml` |
| Server fetcher | `web-next/src/lib/storefront-server.ts` — `fetch().next.revalidate` 60/300 s + tags. React `cache()` for per-request dedupe. | `web-next/src/lib/storefront-server.ts:71-78` |
| Client Medusa client | `src/storefront/lib/medusa/client.ts` (cart, payments, orders) — `credentials: "include"` | `web-next/src/storefront/lib/medusa/client.ts:32-49` |
| Storefront UI | `src/storefront/` (~182 files, 11,200 lines of pages alone). **`react-router-dom` via shim** returns plain `<a>` (no prefetch). | `web-next/src/lib/react-router-dom-shim.tsx:48-58` |
| Middleware | Only `/internal/horo-ops/*` — does **not** run on storefront | `web-next/src/middleware.ts:6-21` |
| Image handling | `next.config.ts` declares `remotePatterns` for Railway. **`next/image` only used in `TeeImage.tsx` and `PageHero.tsx`.** Home hero raw `<img>`. | `web-next/next.config.ts:60-62`, `TeeImage.tsx:67-78` |
| Fonts | **`next/font` not used.** Custom fonts via global CSS / Tailwind classes. | grep `next/font` → 0 |
| CSS | Tailwind v4 + `@tailwindcss/postcss`. Single output **186 KB raw** (compressed by Vercel). | live HEAD on `/_next/static/css/...` |
| Caching | (a) Next data cache via `fetch().next`; (b) Vercel CDN with `x-nextjs-stale-time: 300`; (c) React `cache()`; (d) sessionStorage "grace cache"; (e) immutable static assets. **NOT used:** Cache Components / `use cache`, CDN cache for `/storefront/*` (probe MISS), Medusa in-process cache (disabled in prod). | `web-next/src/lib/storefront-server.ts:73-77`, `medusa-backend/src/lib/storefront/catalog.ts:1774` |
| Webhook revalidation | `POST /api/revalidate/storefront` with `x-revalidate-secret`. Default tags `["catalog","taxonomy"]`. | `web-next/src/app/api/revalidate/storefront/route.ts` |
| 3rd-party | **PostHog only** (autocapture + pageleave on). No GTM/pixel/chat. | `web-next/src/lib/posthog-client.ts:33-40` |
| HTTP headers | HTML `cache-control: public, max-age=0, must-revalidate` (Vercel CDN serves SWR), video `max-age=31536000, immutable` ✅, **CSP overly permissive**: `script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http:;` | `web-next/next.config.ts:68-88` |
| Env sanity | `instrumentation.ts` warns at boot if `MEDUSA_BACKEND_URL`, `MEDUSA_PUBLISHABLE_KEY`, or `NEXT_PUBLIC_SITE_URL` missing. | `web-next/src/instrumentation.ts:5-39` |

**Uncertainties:** Real Lighthouse mobile from Egypt; production Postgres query times; production cache HIT-rate; full per-route bundle (would need `next build` + bundle analyzer); INP impact of PostHog autocapture in the wild.

---

## 3. Performance Scorecard

| Area | Score /10 | Evidence | Risk | Priority |
|---|---|---|---|---|
| Core Web Vitals readiness | 5 | Hero `<img>` not preloaded; no `next/font`; ~660 KB raw JS (Measured) | Mobile LCP/CLS likely above target | P0 |
| Rendering strategy | 7 | All `(main)` pages prerendered (`x-nextjs-prerender: 1` Measured); checkout opts out of catalog (✅) | Static framing solid; client UI is the cost | P1 |
| Caching (frontend / Next data) | 7 | Tagged fetches, webhook revalidation, SWR via `x-vercel-cache: STALE` (Measured) | Default revalidation tags too coarse | P1 |
| Caching (backend / Medusa) | 3 | In-process cache **disabled in prod** (`catalog.ts:1774`), no CDN in front of `/storefront/*` (Measured `MISS`) | Hot-path under traffic; rebuild storm | **P0** |
| Image optimization | 4 | LCP raw `<img>` (Measured); `public/images/*` `max-age=0, must-revalidate` (Measured); 5×361 KB hero SVGs duplicated | Repeat-visit bandwidth + LCP | P0 |
| JavaScript bundle | 4 | Top 3 chunks 49+51+47 KB brotli; no `next/dynamic`; 11,200 lines of client TSX | Mobile TBT/INP | P0 |
| Hydration cost | 4 | `'use client'` wraps every page leaf; whole storefront tree hydrates per nav (Strongly Inferred) | INP under interactions | P0 |
| API efficiency | 5 | PDP consolidated (✅) but cross-sell loop is 1 SQL/handle (`catalog.ts:1527`) | N+1 on PDP cold | P1 |
| Database / I/O | 5 | Catalog DTO walks tree + product query + module reads each call; no CDN | Postgres pressure under spike | P1 |
| Third-party scripts | 8 | PostHog only with autocapture | Click-time INP cost | P2 |
| Mobile performance | 4 | Large CSS (186 KB raw) + JS + raw `<img>` LCP + no preconnect to Medusa | Egypt 4G first-load painful | P0 |
| Checkout performance | 7 | Checkout HTML **16 KB** (Measured); `(checkout)/layout` skips catalog | Server checkout depends on Railway latency | P2 |
| Scalability | 5 | Static HTML scales; `/storefront/*` does not (Measured) | Drop / campaign spikes | P1 |
| Monitoring | 4 | `web-vitals` installed but **no reporter wired**; no Vercel Analytics | Blind to regressions | P1 |
| Production safety | 6 | Cart/order client-only ✅; CSP overly permissive | Hardening gap | P2 |

---

## 4. Route-by-Route Performance Audit

Live measurements (Vercel `fra1`, no compression negotiated in HEAD):

| Route | Rendering | Server data | Cache | Main bottleneck | Recommended | Priority |
|---|---|---|---|---|---|---|
| `/` (`(main)/page.tsx`) | Prerender + ISR; HTML 191 KB / ~20 KB gz; TTFB 227 ms (Measured) | catalog + settings + homepage (parallel) — layout already pulls catalog+settings; `cache()` dedupes ✅ | `revalidate: 60/300`, tagged | Raw `<img>` LCP; no preconnect to Railway; whole tree client | Preload hero + use `next/image priority`; mark Home top sections as Server Components; preconnect Medusa | P0 |
| `/products` (PLP) | Prerender; HTML **194 KB**; TTFB 391 ms (Measured) | catalog | Tag `catalog` | `ShopAll.tsx` 902 lines client | Server-render product cards; client only for filters/quick-add | P1 |
| `/feelings` | Prerender; HTML **214 KB** (Measured) | catalog | Tag `catalog` | Same — full payload + client tree | Server-render grid | P1 |
| `/feelings/[slug]` | Prerender; HTML **197 KB**; TTFB 446 ms (Measured) | catalog | Tag `catalog,taxonomy` | `FeelingCollection.tsx` 723 lines client | Server-render list, isolate filter UI | P1 |
| `/feelings/[slug]/[subfeelingSlug]` | Same | catalog | Same | Same | Move filters to URL state | P1 |
| `/occasions`, `/occasions/[slug]` | Prerender | catalog | Same | `OccasionCollection.tsx` 717 lines client | Same as feelings | P1 |
| `/products/[slug]` (PDP) | Prerender; uses **single `/storefront/pdp` API** ✅; JSON-LD inlined; tags include `product:<slug>` | pdp consolidated; `cache()` dedupes | `revalidate: 60`, product tag | `ProductDetail.tsx` 1,434 lines client; backend cross-sell N+1 (`catalog.ts:1527`) | `next/dynamic` for size-table / share / quickview / sticky-CTA; batch cross-sell | P0 |
| `/cart` | **Prerender** (HTML 192 KB) — cart hydrates from localStorage then syncs Medusa | none | Page HTML cacheable; cart data is client-only | `Cart.tsx` 864 lines | Code-split Cart; drop helmet | P1 |
| `/checkout` | Prerender; HTML **only 16 KB** ✅; only `settings` server-side | settings | `revalidate: 300` | `Checkout.tsx` **2,402 lines client** — biggest hydration target | `next/dynamic` per checkout step | P1 |
| `/checkout/success` | Dynamic (reads order from query) | n/a | Must not cache | OK | Keep dynamic; no PII in cache | P2 |
| `/search` | Prerender; HTML **334 KB** (largest) (Measured) | catalog | Tag `catalog` | `Search.tsx` 1,498 lines client; suggestions per keystroke from inlined catalog | Server-driven query/filter; debounce client suggestions | P1 |
| `/about`, `/faq`, `/exchange`, `/privacy`, `/terms`, `/size-guide` | Prerender. **All still pull full catalog via `(main)/layout.tsx`.** | catalog + settings | Tag `catalog,settings` | Layout fetches data the page does not need | New `(shop)/` group for catalog-bearing pages; policy/info pages skip catalog | P1 |
| `/artists`, `/artists/[slug]` | Prerender | catalog | Tag `catalog` | Same | Same scoping | P2 |
| `/gifts` | Prerender | catalog (filtered) | Tag `catalog` | Same | Same | P2 |
| `/api/revalidate/storefront` | Dynamic POST | n/a | Never | Default tags `["catalog","taxonomy"]` are too broad | Always honor caller tags; reject empty body; log timing | P1 |
| `/api/horo-ops/*` | All `force-dynamic` ✅ | Medusa admin | Never | OK | Keep | — |
| `/internal/horo-ops` | `force-dynamic` ✅ | cookie session | Never | OK | Keep | — |
| `/storefront/*` (Vercel rewrite → Railway) | **Pass-through, MISS on every probe** (Measured) | n/a | **No CDN cache** | TTFB 619–723 ms cold | Set `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` on Medusa public endpoints | **P0** |

---

## 5. Caching Map

`L1` = browser, `L2` = Vercel edge, `L3` = Next data cache, `L4` = Medusa in-process, `L5` = Postgres. Risk: 🟢 safe / 🟡 needs care / 🔴 must-not-cache.

| Data type | Current | Should cache? | Layer | TTL / revalidation | Invalidation | Risk | Recommendation |
|---|---|---|---|---|---|---|---|
| Homepage HTML | Prerender + Vercel SWR | ✅ | L2 + L3 | `revalidate: 60` (catalog), SWR 300 s | `revalidateTag('catalog')` from Medusa subscriber | 🟢 | Keep. Add `revalidateTag('homepage')` for homepage-only edits |
| `/storefront/catalog` | L3 only; Vercel `MISS`; L4 disabled in prod | ✅ | **+ L2 + L4** | L2 `s-maxage=60, swr=300`; L4 60 s | Webhook → `revalidateTag('catalog')` | 🟡 stock lag ≤60 s; cart math is the source of truth | Set `Cache-Control` on Medusa response; set `STOREFRONT_CATALOG_SERVER_CACHE_MS=60000` |
| `/storefront/pdp/[handle]` | L3 only | ✅ | L2 + L4 | `s-maxage=60, swr=300`; tag `product:<slug>` | `product.updated`, `inventory_level.updated` | 🟡 price lag ≤60 s | Add Cache-Control |
| `/storefront/settings` | L3, `revalidate: 300` | ✅ | L2 + L4 | `s-maxage=300, swr=900` | `store.updated` | 🟢 | Add Cache-Control |
| `/storefront/homepage` | L3, `revalidate: 300` | ✅ | L2 + L4 | `s-maxage=300, swr=900` | `homepage_section.updated` | 🟢 | Add Cache-Control |
| `/storefront/incentives` | L3 | ✅ | L2 + L4 | `s-maxage=300, swr=900` | `promotion.updated` | 🟢 | Add Cache-Control |
| Collection / category data | Bundled in catalog | ✅ | Same as catalog | Same | `taxonomy:*` tags exist (`storefront-server.ts:328`) | 🟢 | Keep |
| Navigation | In settings | ✅ | Same | Same | Same | 🟢 | Keep |
| Artist pages | Catalog-derived | ✅ | L2 + L3 | `s-maxage=300, swr=900` | `taxonomy:artists` | 🟢 | Keep |
| Policy / FAQ / about / terms / privacy / size-guide | Currently pulls catalog by accident (layout-level fetch) | ✅ | L2 + L3 | `s-maxage=86400, swr=604800` | manual / weekly | 🟢 | **Move out of `(main)` catalog-bearing layout** |
| Stock (variant inventory) | In catalog/PDP DTO | 🟡 brief | L4 short TTL | 30–60 s | `inventory_level.updated` | 🟡 | Catalog 60 s already gates this. Document the lag |
| Price (variant calculated_amount) | Same as stock | 🟡 brief | L4 + L3 | 60 s | promotion / price-list updates | 🟡 | Cart math always live (Medusa Promotions auto-apply). ≤60 s display lag OK |
| Active promotions | `/storefront/incentives` | ✅ | L2 + L3 | 300 s | `promotion.updated` | 🟢 | Keep |
| Cart `/store/carts/:id` | per-user, `credentials: include` | ❌ **No** | Never | n/a | n/a | 🔴 must-not-cache | Already correct |
| Checkout state | per-user incl. payment session | ❌ **No** | Never | n/a | n/a | 🔴 | Already correct |
| Order data | per-user | ❌ **No** | Never | n/a | n/a | 🔴 | Already correct |
| User account (future) | not yet | ❌ **No** | Never | n/a | n/a | 🔴 | When added, dynamic + `Cache-Control: private, no-store` |

---

## 6. Backend / API Load Audit

### Custom Medusa endpoints (`medusa-backend/src/api/storefront/`)

| Endpoint | Issue | Cacheable | Optimization | Severity |
|---|---|---|---|---|
| `GET /storefront/catalog` | (a) **No CDN cache header** (probe MISS x3); (b) `STOREFRONT_CATALOG_SERVER_CACHE_MS` defaults 0 in prod (`catalog.ts:1774`); (c) full DTO rebuild per tick | ✅ | Set `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`; set `STOREFRONT_CATALOG_SERVER_CACHE_MS=60000`; ensure `revalidate.ts` subscriber posts to `/api/revalidate/storefront` with proper tags | **P0** |
| `GET /storefront/pdp/:handle` | Cross-sell loop = 1 query per handle (`catalog.ts:1527`); settings sequential (`catalog.ts:1547-1558`) | ✅ | (a) Single batched query `handle: { $in: [...] }`; (b) `Promise.all` cross-sell + settings; (c) add Cache-Control | P1 |
| `GET /storefront/products/:handle` | Used by metadata fetch when PDP is not the entry point | ✅ | Add Cache-Control | P2 |
| `GET /storefront/feelings`, `/feelings/:slug`, `/subfeelings/:slug` | Each call walks `FEELINGS_ROOT_HANDLE` again (`catalog.ts:1641,1683`) | ✅ | Per-request scope memoize + Cache-Control | P2 |
| `GET /storefront/occasions`, `/occasions/:slug` | Reads occasion module each call (`catalog.ts:1703-1718`) | ✅ | Add Cache-Control; reuse from catalog cache | P2 |
| `GET /storefront/settings` / `/homepage` / `/incentives` | None major beyond CDN | ✅ | Add Cache-Control | P2 |
| `GET /storefront/search`, `/facets` | Variable cost by query | 🟡 | Cache top synonyms only; keep dynamic for arbitrary queries | P2 |
| `GET /storefront/events` | Drop events list | ✅ | Add Cache-Control | P3 |

**Acceptance:** `x-vercel-cache: HIT` on warm; warm TTFB <100 ms p50.

### Next.js route handlers (`web-next/src/app/api/`)

| Endpoint | Status | Note |
|---|---|---|
| `POST /api/revalidate/storefront` | ✅ never cached | Default tag list too broad (`route.ts:4`); always honor caller's `tags`; add timing log |
| `GET/POST /api/horo-ops/*` (dashboard, lookup, inventory-signals, order/*) | ✅ `force-dynamic` | Cookie-gated; verify rate-limit at Medusa side |
| `POST /api/horo-ops/session` | ✅ never cached | Verify constant-time password compare (`horo-ops-session.ts`) |

### Direct Medusa Store API (called by client)
- All cart/order endpoints in `web-next/src/storefront/lib/medusa/client.ts` are correctly client-only with explicit `fields=` allowlists for cart/order reads (`client.ts:110-131,242-258`). ✅
- `GET /store/products?limit=100` (`client.ts:86`) is used by `listProducts`; not in critical path but a generic listing. Verify call sites; prefer per-handle reads with `fields=` allowlist.

---

## 7. Database and I/O Audit

Strongly inferred from code structure (no live Postgres metrics).

| Issue | Evidence | Impact | Fix | Effort | Priority |
|---|---|---|---|---|---|
| **Catalog DTO rebuilt per Vercel revalidation tick (no in-process cache in prod)** | `medusa-backend/src/lib/storefront/catalog.ts:1774` `process.env.NODE_ENV === "production" ? 0 : DEFAULT_SERVER_CACHE_MS` — fallback is **0 in prod** | Every revalidation: full `queryStorefrontProducts` + feelings tree walk + 4 module reads (Measured: MISS x3, ~650 ms TTFB) | Set `STOREFRONT_CATALOG_SERVER_CACHE_MS=60000` env on Railway | XS | **P0** |
| **PDP cross-sell N+1** | `catalog.ts:1527` — `await Promise.all(unique.map((handle) => queryStorefrontProducts(scope, { handle }, 1)))` — parallel but each is its own query | 3-6 PDP cross-sell queries become 4-7 queries cold | Single query `handle: { $in: unique }` | S | P1 |
| **PDP sequential `await` for settings** | `catalog.ts:1547-1558` — product → cross-sell → settings sequentially | +1 RTT per cold PDP | `Promise.all` cross-sell + settings after product resolves | XS | P1 |
| **Repeated category walks in feelings/subfeeling endpoints** | `catalog.ts:1641,1683` — `fetchProductCategoryByHandle('feelings-root')` re-runs per endpoint | Small (mostly absorbed by catalog cache) | Memoize per request scope or via Redis | S | P2 |
| **`@medusajs/caching-redis` configured but storefront DTO uses an in-memory `catalogServerCache`** (`catalog.ts:1762`) | `medusa-backend/package.json:73` (module installed) | At multi-instance Railway scale-up, each Medusa pod has its own cache | Use `cacheService` (Redis) for cross-instance coherence | M | P2 |
| **No connection pool tuning visible for Postgres** | `medusa-backend/src/lib/storefront/pg-pool.ts` (659 B, brief) | Default `pg` pool may be undersized at spike | Set `PGPOOL_MAX` to ~10-20 | S | P2 |
| **External API calls in render path: zero detected** | grep `fetch(` in server components only hits `storefront-server.ts` | ✅ no third-party API in critical render | — | — | — |
| **S3/object storage** | `rewrite:store-media-urls` script exists; product images come from `horo5-production.up.railway.app` and pass through `next/image` optimizer | Vercel optimizer handles AVIF/WebP, srcset, lazy ✅ | Verify Medusa origin sends `Cache-Control: public, max-age=31536000, immutable` so optimizer can intermediately cache | Low cost, high payoff | P2 |
| **Synchronous heavy work** | `catalog.ts` does in-memory sort/join | CPU rises with catalog size | Acceptable until ~1k products | — | P3 |
| **Cold-start risk** | Medusa long-lived on Railway; Vercel functions short-lived but pages here are static. Webhook revalidation may cold-start a Vercel function. | Low | None | — | — |

---

## 8. Frontend Bundle and Hydration Audit

### Measured chunk weights (homepage)

| Chunk | Raw | gzip | brotli | Likely contents (Strongly Inferred) |
|---|---|---|---|---|
| `chunks/2977-…js` | **221 KB** | **60 KB** | **49 KB** | Storefront page tree (Home/Cart/PDP/Search shared) |
| `chunks/9da6db1e-…js` | **180 KB** | **59 KB** | **51 KB** | Vendor bundle (likely posthog-js + react-helmet + utilities) |
| `chunks/e37c2aa4-…js` | **175 KB** | **55 KB** | **47 KB** | Framework / React + Next runtime + react-router |
| `chunks/8211-…js` | 52 KB | 16 KB | 14 KB | Shared utilities |
| `chunks/2434-…js` | 35 KB | 12 KB | 10 KB | Page-specific |
| 8 smaller chunks | ~80 KB | ~25 KB | ~22 KB | App shell / page entries |
| `polyfills-…js` | 113 KB | 35 KB | n/a | `noModule` — modern browsers skip ✅ |
| **Total modern brotli** | — | — | **~200 KB** | Acceptable upper bound, but every nav re-loads chunks NOT in the prefetch set since `next/link` isn't used |

### Heavy / removable dependencies

| Dependency | Source | Status | Action |
|---|---|---|---|
| `react-router` ^7.13.1 | `web-next/package.json:25` | Only used for `matchPath` re-export inside the shim (`react-router-dom-shim.tsx:9`) | Drop entirely after migrating internal links to `next/link` |
| `react-router-dom-shim.tsx` | `web-next/src/lib/react-router-dom-shim.tsx` | All "Link" components return plain `<a>` (no prefetch) | Migrate to `next/link` route by route |
| `react-helmet-async-shim.tsx` | `web-next/src/lib/react-helmet-async-shim.tsx` | Replaced by App Router `metadata` already used on PDP / collection / policy pages | Remove `<HelmetProvider>` and `SeoHead` usage |
| `posthog-js` | `web-next/package.json:26` | Loaded on every route in `RootProviders` with `autocapture: true`, `capture_pageleave: true` | Defer init until first user interaction; consider `autocapture: false` and explicit events |
| `web-vitals` | `web-next/package.json:27` | Installed but **no reporter wired** (`reportWebVitals`/`useReportWebVitals` not present) | Wire to PostHog `$performance` capture or `/api/vitals` |

### Unnecessary Client Components / hydration boundaries

- `src/components/home-page.tsx`, `feeling-collection-page.tsx`, `occasion-collection-page.tsx`, `product-detail-page.tsx`, etc. — every wrapper is `'use client'` even when only a child needs interactivity. The wrapper just forwards to the storefront page; it could be a Server Component that imports a smaller client child.
- `Nav.tsx` (760 lines) is a client component (acceptable — has search, drawer) but the **header shell**, **footer**, **policy banner** could be Server Components.
- `MiniCartDrawer` mounted globally in `AppProviders`; it's gated by state but ships JS on every page.
- `RouterContextProvider` (`src/lib/router-context.tsx`) wraps every page wrapper.

### Above-the-fold JS expense per route

- **Home:** hero + 5 sections (`HOME_DEFAULT_SECTIONS` in `Home.tsx:42`) all run immediately. `useScrollReveal()` adds an IntersectionObserver pass.
- **PDP:** `ProductDetail.tsx` (1,434 lines) inc. `PdpSizeFlatDiagram`, `PdpShareStrip`, `StickyAddToCart`, `CrossSellWidget`, `RecentlyViewedStrip`, `ProductQuickView` — all hydrate eagerly.
- **Cart:** `Cart.tsx` 864 lines + `MiniCartDrawer` mounted globally.
- **Checkout:** **2,402 lines of single-file client component**. Largest single hydration target on the site.

### Recommended changes (high-level)

| Change | Files | Expected impact |
|---|---|---|
| Replace `react-router-dom` shim links with `next/link` | `Nav.tsx`, `MerchProductCard.tsx`, all `pages/*.tsx` (149 imports across 15 files) | Hover/viewport prefetch → near-instant subsequent nav. Remove `react-router*` (~25-40 KB raw) |
| `next/dynamic` heavy below-the-fold pieces | `ProductDetail.tsx` (size table, share, quickview, sticky CTA); `Checkout.tsx` per step; `Search.tsx` results panel | First-load JS ↓ 30-50% on Checkout / PDP / Search |
| Move home top-fold sections to Server Components | `HomeHeroWearMean`, `HomeTrustRibbon`, `HomeStartHere` (initial products only) | Lower TTI; smaller hydration; fewer `useEffect` runs |
| Drop `react-helmet-async` shim usage in pages with App Router metadata | All policy / SEO pages | Smaller client bundle |
| Switch off PostHog `autocapture` or defer init | `posthog-client.ts:33-40` | Lower INP (autocapture intercepts every click) |
| Wire `web-vitals` reporter | `app/layout.tsx` (or root client provider) | Production CWV visibility |

---

## 9. Image and Media Optimization Plan

Verified live cache headers:
- `/_next/static/css/...` → `public, max-age=31536000, immutable` ✅
- `/_next/static/chunks/*.js` → `public, max-age=31536000, immutable` ✅
- `/videos/home-hero-shirt-design.mp4` → `public, max-age=31536000, immutable` ✅ (set in `next.config.ts:71-73`)
- **`/images/heroes/home-hero.png` → `public, max-age=0, must-revalidate`** ❌ (Vercel default for `public/`)

| Category | Current | Issue | Best implementation | Expected impact | Acceptance |
|---|---|---|---|---|---|
| **Hero (home LCP)** | Raw `<img src="/images/heroes/home-hero.png" fetchPriority="high" loading="eager">` (`HomeHeroWearMean.tsx:54`); 63 KB PNG; not preloaded | No AVIF/WebP, no responsive `srcset`, no preload. Cache `max-age=0` (revalidate every visit) | `<Image src="/images/heroes/home-hero.png" alt={…} fill priority sizes="100vw" placeholder="blur">` + `<link rel="preload" as="image">` in `(main)/layout.tsx`. Add custom `headers()` rule for `/images/(.*)` → `public, max-age=31536000, immutable` (after content-hashing filenames) | LCP -300-700 ms on cold Egypt 4G | LCP <2.5 s on home mobile |
| **PDP gallery** | `TeeImage` with `next/image` ✅; `priority={eager}` for first frame, lazy for rest | Good. Verify `sizes` covers all breakpoints | Confirm `sizes="(min-width: 1024px) 50vw, 100vw"` for hero frame | LCP stable | LCP <2.5 s |
| **PDP cross-sell + grid cards** | `TeeImageFrame` → `<Image fill sizes="(min-width: 1024px) 33vw, 100vw">` ✅ | Good | Keep | — | — |
| **Collection cards** | `TeeImageFrame` ✅ | Good | Keep | — | — |
| **Hero SVGs (5×361 KB) under `public/images/heroes/`** | `cache-control: public, max-age=0, must-revalidate` | 361 KB for an SVG is large; even ~80-120 KB transferred, repeated revalidation hurts | (a) Inline-SVG candidates if used as background; (b) immutable cache header rule once filenames content-hashed; (c) SVGO + remove duplicates | Repeat-visit bandwidth ↓ | Browser cache `max-age` ≥1 day |
| **Home hero video (1.7 MB)** | `cache-control: public, max-age=31536000, immutable` ✅ | Good | Verify `<video preload="metadata" poster="/images/hero/home-hero-video-poster.png">`; `playsinline muted autoplay` use-case | Bandwidth ↓ for non-engaged users | Network tab shows video starts only on view/play |
| **Product images on Medusa origin** | Through `next/image` (`next.config.ts:9` `remotePatterns`) → Vercel optimizer | ✅ AVIF/WebP, srcset, lazy | Make sure Medusa origin sends `Cache-Control: public, max-age=31536000, immutable` so Vercel optimizer can intermediately cache | Lower optimizer cost | n/a |
| **Logos / icons** | SVGs / `BrandLogo` component | Inlined where appropriate | Keep | — | — |

---

## 10. Third-Party Script Audit

| Script | Purpose | Loading behavior | Risk | Recommendation |
|---|---|---|---|---|
| **PostHog (`posthog-js`)** | Product analytics | Loaded in `RootProviders` (every route incl. `/checkout`); `autocapture: true`, `capture_pageleave: true` (`posthog-client.ts:33-40`); `/decide` request fires on every page load | INP cost on click (autocapture intercepts every click), TBT cost on init, ~50 KB JS shipped per route | (a) Set `autocapture: false` and emit explicit `track*` events from existing `analytics/events.ts`; (b) defer init via `requestIdleCallback`/`afterInteractive`; (c) sample `/decide` (e.g., `bootstrap` with cached flags); (d) consider self-hosted PostHog reverse-proxy through `/ph` route to bypass adblock and reduce cross-origin RTT |
| **No GTM / Meta Pixel / TikTok Pixel / Google Analytics / live chat / hotjar** | — | — | — | Surprisingly clean. When marketing pixels are added, gate behind consent and load via Partytown or `next/script strategy="lazyOnload"` |

---

## 11. Production Monitoring Recommendations

What to track and where it likely lives.

| Metric | Owner | Tool / signal | Alert threshold |
|---|---|---|---|
| Core Web Vitals (LCP / INP / CLS) per route | Frontend | Wire `web-vitals` (already installed) → `useReportWebVitals` → POST to PostHog (`$performance` event) or `/api/vitals` | LCP p75 mobile >2.5 s; INP p75 >200 ms; CLS p75 >0.1 |
| Server timing for storefront RSC | Frontend | `Server-Timing` header from Vercel function logs; Vercel Speed Insights | TTFB p75 >500 ms |
| `x-vercel-cache` HIT rate | Infra | Vercel logs / "Insights" → cache HIT vs MISS by path | HIT < 80% on `/`, `/products`, `/feelings`, `/products/[slug]` |
| `/storefront/*` Railway response time | Backend | Railway logs + Medusa-side request logger; add `[storefront/profile]` time markers from `STOREFRONT_PROFILE_CATALOG=1` | Catalog warm p75 >100 ms; PDP warm p75 >150 ms |
| Postgres query time (top N) | Backend | Railway DB metrics; `pg_stat_statements` if available | Any single query p95 >50 ms |
| Webhook revalidation lag | Backend → Frontend | Add `console.info` with timing in `revalidate.ts`; capture `received_at` vs `propagated_at` | Lag p95 >10 s |
| Cart create/complete error rate | Backend | Medusa error logs; PostHog `cart_complete_failed` events | >0.5% over 1 h |
| 4xx/5xx by path | Vercel | Vercel logs filter | >0.5% over 5 min |
| Bundle size regression | Frontend | `next build` JSON output + CI check (`@next/bundle-analyzer` or `npx next build --json`) | >5% growth on first-load JS for `/`, `/products/[slug]`, `/checkout` |
| Image optimizer usage | Frontend | Vercel Image Optimizer dashboard | Sudden growth = unrecognised image domain or bypass |
| Drop-launch readiness | Both | Manual k6 / autocannon against `/` and `/storefront/catalog` warmed; verify `STORE_CORS` includes the exact origin | TTFB p95 <600 ms under 100 RPS |

---

## 12. Implementation Backlog

Effort: XS (≤30 min) · S (≤2 h) · M (≤1 day) · L (1-3 days) · XL (>3 days). Each item: change, files, expected impact, risk, acceptance.

### Quick Wins (XS / S, low risk, big payoff)

1. **Re-enable Medusa in-process catalog cache in production** ⭐
   - Change: set Railway env `STOREFRONT_CATALOG_SERVER_CACHE_MS=60000`. Optionally lower the in-code fallback at `medusa-backend/src/lib/storefront/catalog.ts:1774`.
   - Impact: catalog warm TTFB drops from ~650 ms to <50 ms; coalesces concurrent rebuilds onto one promise (already implemented at line 1789).
   - Risk: ≤60 s lag on stock display. Cart math is always live (Medusa Promotions auto-apply), so no overselling.
   - Effort: XS.
   - Acceptance: warm `/storefront/catalog` p50 <50 ms.

2. **Add CDN cache headers on Medusa public storefront endpoints** ⭐
   - Change: in each `medusa-backend/src/api/storefront/{catalog,pdp/[handle],settings,homepage,incentives}/route.ts`, set `res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')` (or 300/900 for settings/homepage/incentives).
   - Impact: `/storefront/*` becomes Vercel-cacheable per region; HIT rate climbs over warm-up minutes.
   - Risk: same ≤60 s lag. Webhook `revalidateTag` already covers `Next` data cache; add a Vercel `purge` if stricter needed.
   - Effort: S.
   - Acceptance: live probe shows `x-vercel-cache: HIT` on warm.

3. **Move policy/info pages out of `(main)/layout.tsx` catalog fetch**
   - Change: introduce a smaller layout group for `/about`, `/faq`, `/exchange`, `/privacy`, `/terms`, `/size-guide` that does not call `fetchStorefrontCatalogServer()`. Keep settings only.
   - Impact: 6+ pages no longer pay catalog cost; nav still works (uses `settings.navigation`).
   - Risk: nav rendering relies on catalog only for badge counts (verify); none for static policy chrome.
   - Effort: S.
   - Acceptance: those pages no longer appear in catalog tag invalidations; HTML payload drops.

4. **Stop client-side re-hydration of catalog when SSR provided one**
   - Change: in `web-next/src/storefront/AppProviders.tsx`, only call `hydrateRuntimeCatalog()` when there is no SSR catalog AT ALL, not when "any sub-array is empty". Empty arrays are valid (e.g., no events).
   - Impact: removes ~600 ms cold client-side fetch on initial page loads where SSR worked.
   - Risk: low; guard is over-eager today.
   - Effort: XS.
   - Acceptance: Network tab on first load shows zero client-side `/storefront/catalog` request when SSR succeeded.

5. **Use `next/image` for the home hero (LCP)**
   - Change: `web-next/src/storefront/components/HomeHeroWearMean.tsx:54` — replace `<img>` with `<Image fill priority sizes="100vw" placeholder="blur" blurDataURL=…>`. Add `<link rel="preload">` in `(main)/layout.tsx` head if not enough.
   - Impact: AVIF/WebP, responsive srcset; LCP -300 ms p75 mobile.
   - Risk: confirm hero variant for `mantra-grid` layout still positions correctly.
   - Effort: S.
   - Acceptance: Lighthouse mobile LCP <2.5 s on `/`.

6. **Add `<link rel="preconnect">` for Medusa origin in `RootLayout`**
   - Change: in `web-next/src/app/layout.tsx`, add `<link rel="preconnect" href={MEDUSA_ORIGIN} crossOrigin="">` so cart/order calls do not pay TLS handshake on first interaction.
   - Impact: -100-250 ms on first cart action on cold connections.
   - Risk: none.
   - Effort: XS.
   - Acceptance: Network tab shows preconnect entry.

7. **Wire `web-vitals` reporter**
   - Change: add a small `WebVitalsReporter` client component using `useReportWebVitals` (App Router) → POST to PostHog or new `/api/vitals` route.
   - Impact: ongoing CWV visibility per route + per device class.
   - Risk: none if reports are sampled (e.g., 10%) and gracefully fail.
   - Effort: S.
   - Acceptance: PostHog dashboards show LCP/INP/CLS by route.

8. **Add `force-static` annotations where appropriate**
   - Change: for fully static pages (`/about`, `/faq`, `/privacy`, `/terms`, `/size-guide`, `/exchange`), add `export const revalidate = 86400`.
   - Impact: longer Vercel SWR window for content that rarely changes.
   - Risk: 1-day lag if the marketing copy changes; acceptable.
   - Effort: XS.
   - Acceptance: `x-nextjs-stale-time: 86400` on those pages.

9. **PostHog `autocapture: false`**
   - Change: `web-next/src/lib/posthog-client.ts:33-40` — set `autocapture: false`. Existing explicit events in `src/storefront/analytics/events.ts` continue to work.
   - Impact: lower INP on every click; smaller per-page wire cost.
   - Risk: lose generic click heatmap data. If the team wants heatmaps, consider toolbar-only.
   - Effort: XS.
   - Acceptance: no pageleave/click events fire automatically; manual events still flow.

10. **Add `Cache-Control` rule for `/images/(.*)` once filenames are content-hashed**
    - Change: in `web-next/next.config.ts` `headers()`, add a route-pattern for image assets with stable filenames → `public, max-age=31536000, immutable`. Hash filenames first if any are non-versioned.
    - Impact: repeat-visit bandwidth ↓ (especially the 5×361 KB hero SVGs).
    - Risk: do **not** apply this until filenames are content-hashed; otherwise stale images forever.
    - Effort: S.
    - Acceptance: HEAD on hero PNG returns immutable cache.

### Medium Wins (M, moderate risk)

11. **Migrate internal links to `next/link`** ⭐⭐
    - Change: replace shim's `Link`/`NavLink` with `next/link` Link, starting with `Nav.tsx` + `MerchProductCard.tsx` + collection page link cards. Roll out file-by-file, run E2E (`npm run test:e2e`) after each batch.
    - Impact: hover/viewport prefetch makes subsequent navigation near-instant; can drop `react-router-dom` (~25-40 KB raw) once shim is empty.
    - Risk: medium — `useNavigate`, `useSearchParams`, `useLocation` patterns inside pages need to be converted to `next/navigation` equivalents (already in shim).
    - Effort: M (incremental).
    - Acceptance: Lighthouse "speed index" + manual back-button test; no regressions in E2E.

12. **Code-split heavy storefront pages with `next/dynamic`**
    - Change: in `ProductDetail.tsx`, lazy-load `PdpSizeFlatDiagram`, `PdpShareStrip`, `StickyAddToCart`, `CrossSellWidget`, `RecentlyViewedStrip`, `ProductQuickView` via `next/dynamic({ ssr: false })` where below-the-fold. Same for `Search.tsx` results panel and `Checkout.tsx` per-step.
    - Impact: first-load JS ↓ ~30% on PDP, ~40-50% on Checkout.
    - Risk: low if Suspense fallbacks are simple skeletons.
    - Effort: M.
    - Acceptance: Bundle analyzer shows separate chunks for split components.

13. **Move home top-fold sections to Server Components**
    - Change: `HomeHeroWearMean`, `HomeTrustRibbon`, `HomeStartHere` (with `initialProducts` prop) become server components. Hydrate only the interactive parts (locale toggle, video playback) as small client islands.
    - Impact: less JS for above-the-fold; better TTI; clearer SSR-first UX.
    - Risk: medium — many small dependencies (`useUiLocale`) currently used in these files.
    - Effort: M.
    - Acceptance: `'use client'` removed from those file headers; build passes.

14. **Batch PDP cross-sell into a single Postgres round-trip**
    - Change: `medusa-backend/src/lib/storefront/catalog.ts:1527` — replace map+`Promise.all(query per handle)` with one `queryStorefrontProducts(scope, { handle: { $in: unique } }, unique.length)`.
    - Impact: 3-6 N+1 queries collapse into 1; cold PDP ~50-100 ms faster.
    - Risk: ensure ordering is preserved on the consumer side (preserve `unique` order).
    - Effort: S-M.
    - Acceptance: Single SQL trace per cold PDP cross-sell; warm unaffected.

15. **Drop `HelmetProvider` and `SeoHead` shim**
    - Change: rely on App Router `metadata` exports already present (`(main)/feelings/page.tsx:8-19` etc.). Remove `HelmetProvider` from `Providers` and the shim file.
    - Impact: smaller client bundle; fewer hydration warnings.
    - Risk: low if all routes already export `metadata`.
    - Effort: M.
    - Acceptance: build green; head tags identical to today.

16. **Granular cache invalidation tags**
    - Change: `web-next/src/app/api/revalidate/storefront/route.ts:18` — always honor caller-provided tags; in `medusa-backend/src/lib/storefront/revalidate.ts`, emit `product:<handle>`, `taxonomy:<slug>`, `homepage`, `settings`, `incentives` from the relevant subscribers.
    - Impact: a single product edit invalidates only its product tag, not the whole catalog; warm CDN survives.
    - Risk: low.
    - Effort: M.
    - Acceptance: a product edit shows a single `revalidateTag` call with `["product:<handle>"]`.

17. **Wire `next/font`**
    - Change: replace runtime CSS `@font-face` declarations with `next/font/local` or `next/font/google` in `app/layout.tsx`; reuse the resulting CSS variables in Tailwind config.
    - Impact: font preloaded with `font-display: optional`; -150-400 ms LCP delta on font-heavy pages.
    - Risk: medium — needs care to keep Arabic/Latin pairing intact.
    - Effort: M.
    - Acceptance: 0 layout-shift due to fonts; preloads in `<head>`.

### Major Wins (L / XL, structural)

18. **Convert `(main)` page wrappers from client to server components**
    - Change: components like `home-page.tsx`, `feeling-collection-page.tsx`, `product-detail-page.tsx` each just forward props to a storefront page; they don't need `'use client'`. Make them server components and only mark the storefront pages themselves as client. Then progressively split the storefront pages into server-rendered shells with small client islands.
    - Impact: dramatically lower hydration cost; smaller client bundle per route.
    - Risk: high — long migration path; storefront pages have many `useEffect` / `useState` patterns.
    - Effort: XL.
    - Acceptance: Per-route `next build` reports First Load JS reductions of ≥30%.

19. **Re-shape `/storefront/catalog` payload (split heavy data)**
    - Change: split into `/storefront/taxonomy` (artists/feelings/subfeelings/occasions/events; ~rare changes, longer TTL) and `/storefront/products` (with pagination, `?after=&limit=`). Pages hydrate the slice they actually need.
    - Impact: smaller payload per route; longer cache TTL for taxonomy.
    - Risk: high — many storefront pages currently use the unified `RuntimeCatalog`.
    - Effort: XL.
    - Acceptance: Homepage RSC payload size ↓ ≥30%; PLP unchanged.

20. **Cross-instance cache via `@medusajs/caching-redis`**
    - Change: replace the in-memory `catalogServerCache` (`catalog.ts:1762`) with the Medusa cache service (Redis), keyed by `'storefront:catalog'` with same TTL.
    - Impact: at >1 Railway pod, all instances hit the same cache; rebuild storms damped.
    - Risk: medium.
    - Effort: M-L.
    - Acceptance: Catalog rebuilds happen at most once per `STOREFRONT_CATALOG_SERVER_CACHE_MS` window across pods.

21. **Stricter CSP**
    - Change: replace permissive CSP in `next.config.ts:79` with a nonce/strict-dynamic policy. Out of perf scope but worth pairing with the bundle simplification work.
    - Impact: hardening (XSS).
    - Risk: medium (PostHog needs `connect-src` for `eu.i.posthog.com`).
    - Effort: M.
    - Acceptance: CSP report-only run for 1 week shows no false positives.

22. **Turbopack production build**
    - Change: drop `--webpack` from the build script; verify all custom webpack config is removed (`next.config.ts` has none, ✅).
    - Impact: shorter CI builds; potentially smaller chunks.
    - Risk: medium — Turbopack production mode is recent in Next 16; keep webpack as a fallback toggle until validated in canary.
    - Effort: S-M.
    - Acceptance: Same or smaller route-level First Load JS; CI build time ↓.

---

## 13. Safe Code Implementation Plan (proposed only — not executed)

This is the **proposed order of execution if/when implementation is approved**. **No code is changed in this audit task.**

For each step: **(a)** make the change, **(b)** run quality gates, **(c)** verify on a preview deploy, **(d)** commit with a tight message.

### Pre-flight (every step)
```bash
cd web-next
npm run type-check
npm run lint
npm run test:unit
# integration & e2e run later in Phase 2/3 only
```
And, where the change touches Medusa:
```bash
cd medusa-backend
npm run test:integration:http
```

### Phase 1 — Quick Wins (1–2 days, very low risk)
1. **Re-enable Medusa catalog cache.** Edit Railway env: `STOREFRONT_CATALOG_SERVER_CACHE_MS=60000`. (Or change the fallback in `catalog.ts:1774` to `60000` regardless of NODE_ENV.) `cd medusa-backend && npm run test:integration:http`. Deploy. Verify `x-vercel-cache: HIT` on warm `/storefront/catalog`.
2. **Add CDN cache headers** in each `medusa-backend/src/api/storefront/*/route.ts`. Run `cd medusa-backend && npm run test:integration:http && cd .. && cd web-next && npm run smoke:medusa`. Deploy backend, verify HEAD response.
3. **Trim the AppProviders re-hydration guard** in `web-next/src/storefront/AppProviders.tsx`. Run `cd web-next && npm run type-check && npm run lint && npm run test:unit`. Deploy, verify Network tab on `/`.
4. **Move policy pages to a non-catalog layout group** (e.g. create `web-next/src/app/(info)/`, copy `about|faq|privacy|terms|exchange|size-guide` into it with a thin layout that fetches only `settings`). Re-run quality gates + Playwright smoke.
5. **Use `next/image` for home hero** in `HomeHeroWearMean.tsx`. Re-run `npm run test:e2e -- --grep="home hero"` and verify Lighthouse LCP locally.
6. **Add `<link rel="preconnect">`** for Medusa origin in `RootLayout`.
7. **Wire `web-vitals`** reporter as a small `WebVitalsReporter` client component in `RootProviders`.
8. **`force-static` for policy/info pages** → `export const revalidate = 86400`.
9. **PostHog `autocapture: false`** in `posthog-client.ts:33-40`.

Each step is independently shippable; rollback = revert single commit.

### Phase 2 — Medium Wins (3–7 days, moderate risk)
10. **Migrate `Nav.tsx` and `MerchProductCard.tsx` to `next/link`.** This is the keystone change. Run full `npm run test:e2e` after each file batch (mobile drawer, dropdown, search). Track first-load JS in `next build`.
11. **Code-split PDP, Checkout, Search heavy children with `next/dynamic`.** Verify CLS does not regress (Suspense fallbacks need fixed-height skeletons).
12. **Granular cache invalidation tags** in `revalidate.ts` and `api/revalidate/storefront/route.ts`.
13. **Drop `HelmetProvider`** once all routes export `metadata`.
14. **`next/font` migration** in `app/layout.tsx`.
15. **Batch PDP cross-sell** in `medusa-backend/src/lib/storefront/catalog.ts:1527`.

### Phase 3 — Major Wins (1–2 weeks, structural)
16. Convert `(main)` page wrappers to Server Components, then progressively split storefront pages into server shells + client islands.
17. Re-shape `/storefront/catalog` payload (split taxonomy + products).
18. Move in-memory cache to Redis (`@medusajs/caching-redis`).
19. Stricter CSP.
20. Turbopack production build canary.

### Step-level safety guardrails
- **No DB schema changes** without a Medusa migration + parity check (`npm run parity:check` in `medusa-backend/`).
- **No payment-flow code changes** (`web-next/src/storefront/pages/Checkout.tsx`) without full `npm run test:e2e` checkout journey passing locally with Medusa up.
- **CDN cache header rollouts** must include a webhook-revalidation smoke (edit a product in Admin → assert `x-vercel-cache: STALE` on next request, then HIT after cycle).
- **`react-router-dom` migration** keeps the shim in place until the last consumer is gone, so the build never breaks mid-migration.
- **Public route changes** keep the `(main)` shape so URLs do not change; the `(info)` group is added via a route group, not a path change.

---

## 14. Performance Testing Checklist

Copy-paste commands the user can run.

### Static analysis & build
```bash
# From web-next/:
npm run type-check
npm run lint
npm run test:unit
npx next build         # full prod build, not --webpack-only — see if Turbopack is healthy
npx next build --no-lint --json > /tmp/next-build.json
# Inspect First Load JS by route from /tmp/next-build.json (look for "pageStats")
```

### Bundle analysis
```bash
# Install once:
npm i -D @next/bundle-analyzer
# Wrap next.config.ts with withBundleAnalyzer (PR-only); then:
ANALYZE=true npx next build
# Look for: react-router*, react-helmet-async, posthog-js, large pages bundles
```

### Edge / cache verification (against prod)
```bash
# Page HTML cache state:
for path in / /products /feelings /products/heartbreak /cart /checkout; do
  echo "$path:"; curl -sI -A perf https://horo5.vercel.app$path | grep -iE 'cache|prerender|stale|age'
done

# Medusa storefront endpoints — verify HIT after rolling Cache-Control:
for path in /storefront/catalog /storefront/settings /storefront/homepage /storefront/incentives; do
  echo "$path:"; curl -sI -A perf https://horo5.vercel.app$path | grep -iE 'cache|age'
done

# Static assets immutability:
curl -sI -A perf 'https://horo5.vercel.app/_next/static/chunks/...' | grep -i cache-control
curl -sI -A perf 'https://horo5.vercel.app/images/heroes/home-hero.png' | grep -i cache-control
```

### Web Vitals (manual)
```bash
# Lighthouse mobile (Chrome DevTools → Lighthouse → Mobile, "Performance"):
# Run on / , /products, /products/<slug>, /search, /cart, /checkout
# Target: LCP <2.5s, INP <200ms, CLS <0.1, TBT <200ms
```

### Load test (light)
```bash
# Install k6 (brew install k6) then run:
cat > /tmp/horo.k6.js <<'EOF'
import http from 'k6/http'; import { sleep } from 'k6';
export const options = { vus: 50, duration: '1m' };
export default function () {
  http.get('https://horo5.vercel.app/');
  http.get('https://horo5.vercel.app/products');
  http.get('https://horo5.vercel.app/storefront/catalog');
  sleep(1);
}
EOF
k6 run /tmp/horo.k6.js
# Watch: HIT rate, p95 TTFB, error rate
```

### Project tests
```bash
# E2E:
cd web-next
npm run test:e2e:install   # once
npm run test:e2e           # Playwright on Next port 3005
# Catalog DTO contract:
npm run integration:catalog
# Medusa smoke (with Medusa running):
npm run smoke:medusa
# Medusa HTTP integration:
cd ../medusa-backend && npm run test:integration:http
# Catalog parity (DB):
npm run parity:snapshot:local
npx @railway/cli run npm run parity:snapshot:remote
npm run parity:check
```

### Pass/fail thresholds for "production-ready" sign-off
- LCP p75 mobile <2.5 s on `/`, `/products/[slug]`, `/feelings/[slug]`
- INP p75 <200 ms on `/`, `/products/[slug]`, `/cart`
- CLS p75 <0.1 on all routes
- TBT <200 ms desktop / <500 ms mobile mid-tier
- TTFB p75 <500 ms HTML; <100 ms warm `/storefront/catalog`
- `x-vercel-cache: HIT` rate >85% on the public hot paths
- 0 production console errors during smoke + checkout journey
- Bundle: First Load JS for `/checkout` <250 KB brotli; for `/products/[slug]` <220 KB brotli; for `/` <200 KB brotli

---

## 15. Final Priority Recommendation

**The single highest-leverage fix** is the pair: **(1) enable Medusa-side caching for `/storefront/*`** (Cache-Control header + `STOREFRONT_CATALOG_SERVER_CACHE_MS=60000`), and **(2) start migrating internal links to `next/link`** beginning with `Nav.tsx` and `MerchProductCard.tsx`.

Together they neutralise the worst frontend bottleneck (no prefetch, full HTML round-trip per nav) and the worst backend bottleneck (uncached, full DTO rebuild per ISR tick) without architectural rewrites. Both are reversible and can be shipped behind one PR each.

**Where to start, file:**

> `medusa-backend/src/lib/storefront/catalog.ts:1774` — change the fallback from `0` (in production) to `60_000`, OR set `STOREFRONT_CATALOG_SERVER_CACHE_MS=60000` on Railway. Verify with the curl loops in §14.

Then:

> `web-next/src/app/(main)/layout.tsx` head — preconnect to the Medusa origin, then progressively swap `import { Link } from 'react-router-dom'` for `import Link from 'next/link'` route-by-route (start with `Nav.tsx` and `MerchProductCard.tsx`).

Everything else follows. Items 1–9 in §12 are a 1–2 day sprint that should move Lighthouse mobile scores meaningfully without touching the storefront page architecture.
