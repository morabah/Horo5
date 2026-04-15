# Horo5 — agent and contributor guide

This repo is the **HORO** storefront and related services (`web-next/`, `medusa-backend/`, `shopify-headless/`). Storefront UI and client logic live under `web-next/src/storefront/`. It is **not** the PosalPro MVP2 app tree referenced inside some `doc/` files.

## Authoritative docs (repo root `doc/`)

| Document | Use in Horo5 |
|----------|----------------|
| [`doc/Agent.md`](doc/Agent.md) | **Apply** React / Next.js performance and correctness patterns (parallel fetch, bundle hygiene, hydration: defer `localStorage` / `navigator` until after mount). |
| [`doc/CORE_REQUIREMENTS.md`](doc/CORE_REQUIREMENTS.md) | **Selective**: treat quality ideas (TypeScript discipline, accessibility intent, validation at boundaries) as guidelines. **Ignore** PosalPro-only paths (`posalpro-app/`, Prisma/NextAuth templates, `npm run dev:smart`, `audit:duplicates`, internal services named in that doc). |
| [`doc/DEVELOPMENT_PHILOSOPHY.md`](doc/DEVELOPMENT_PHILOSOPHY.md) | **Selective**: prefer clear code, trace root causes, avoid ad-hoc client caches when a single pattern already exists. **Ignore** stack-specific mandates (Zustand + React Query layout, tenant middleware, `useApiClient`) unless that code exists here. |
| [`doc/LESSONS_LEARNED.md`](doc/LESSONS_LEARNED.md) | **Selective**: hydration, `useEffect` scope, worker-local singletons, and React Query cache pitfalls apply to any React/Next work. Ignore module paths and features that are not in this repo. |

## Horo5 quality gates

- **`web-next/`** (Next.js app + storefront under `src/storefront/`): from this directory run `npm run type-check`, `npm run lint`, and `npm run test:unit` (Jest, `**/__tests__/**/*.unit.spec.ts`) before treating UI work as done. With Medusa running locally and keys in env, `npm run integration:catalog` asserts `GET /storefront/catalog` matches storefront DTO expectations (see `web-next/scripts/integration-catalog-contract.mjs`; `npm run smoke:medusa` covers health + store + catalog + CORS). Headless UI checks: `npm run test:e2e` (Playwright, `e2e/*.spec.ts`; install browsers once with `npm run test:e2e:install`).
- **`medusa-backend/`**: follow that package’s README and env templates. **Local is the source of truth** for Medusa: align Railway (code revision, migrations, seeded data, env keys, media URLs) with local using the parity table in [`medusa-backend/README.md`](medusa-backend/README.md) (section “Local is the source of truth”). Verify DB catalog parity with `npm run parity:snapshot:local`, `npx @railway/cli run npm run parity:snapshot:remote`, and `npm run parity:check` from `medusa-backend/`.

## SSR / hydration (required for `web-next`)

Client-only data (`localStorage`, `sessionStorage`, `navigator.share`, `window` layout flags) must not determine the **first** paint of client components unless it matches the server. Prefer: default state on the server and first client render, then **`useEffect`** to read browser APIs and update state. See `doc/Agent.md` §6.5–6.6 and `doc/LESSONS_LEARNED.md` (useEffect / hydration lessons).

**Hydration baseline:** Cart, locale, compact PDP flags, catalog grace cache, analytics, and PDP client-only affordances read browser APIs in `useEffect` or event handlers so the first client render matches SSR defaults. Re-check whenever you add storefront components that touch `window` / storage.

## RSC data loading (`web-next`)

- When two **independent** server fetches are needed in the same component, prefer **`Promise.all`** (see `web-next/src/app/(main)/products/[slug]/page.tsx`).
- `generateMetadata` and the page often need the same Medusa payload: `fetchStorefrontCatalogServer`, `fetchStorefrontProductServer`, and `fetchStorefrontOccasionServer` in `web-next/src/lib/storefront-server.ts` are wrapped in React **`cache()`** so a single request does not pay duplicate round-trips when metadata and the page both await the same key.

## Horo5 pre-flight checklist (portable ideas from `doc/`)

Use this instead of PosalPro-only scripts named in `doc/CORE_REQUIREMENTS.md`.

| Step | Command / action |
|------|-------------------|
| TypeScript | From `web-next/`: `npm run type-check` |
| Lint | From `web-next/`: `npm run lint` |
| Storefront unit tests | From `web-next/`: `npm run test:unit` |
| Store API contract (Medusa up) | From `web-next/`: `npm run integration:catalog` (or `npm run smoke:medusa` for broader checks) |
| Headless E2E (Playwright) | From `web-next/`: `npm run test:e2e:install` once, then `npm run test:e2e` (starts Next on port **3005** by default, headless Chromium; set `PLAYWRIGHT_SKIP_WEBSERVER=1` if the app is already running, and `PLAYWRIGHT_BASE_URL` to match). Checkout journey needs Medusa **STORE_CORS** (and **AUTH_CORS**) to include the exact storefront origin (e.g. `http://127.0.0.1:3005` vs `http://localhost:3005` are different); see `web-next/.env.example` and `medusa-backend/.env.template`. |
| Medusa HTTP integration | From `medusa-backend/`: `npm run test:integration:http` (Jest + `@medusajs/test-utils`, e.g. `integration-tests/http/health.spec.ts`) |
| Shared `web/src` | If you changed it: `npx tsc --noEmit` from `web/` (or the package that owns the path) |
| Medusa catalog / DB parity | From `medusa-backend/`: `npm run parity:snapshot:local`, `npx @railway/cli run npm run parity:snapshot:remote`, `npm run parity:check` (see `medusa-backend/README.md`) |
| Hydration / client-only APIs | Re-read `doc/Agent.md` §6.5–6.6 before merging features that touch `localStorage`, `sessionStorage`, or `window` on the storefront |
| Accessibility | PDP, cart, checkout, search: ~44px touch targets, visible focus, meaningful labels / `aria-*` on icon-only controls |
| Security headers | `web-next/next.config.ts` `headers()` — keep CSP aligned with third-party scripts the storefront loads |
| Production env | Set `MEDUSA_BACKEND_URL`, `MEDUSA_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_*` equivalents), and `NEXT_PUBLIC_SITE_URL` on the host; `web-next/src/instrumentation.ts` logs **warnings** in production when Medusa keys or backend URL are missing |

## `web-next` security & env

- **Headers:** Global response headers live in `web-next/next.config.ts` (frame options, MIME sniffing, referrer policy, permissions policy, CSP).
- **Env:** Prefer mirroring `medusa-backend/.env.template` semantics for anything the storefront calls server-side. Client-exposed vars stay `NEXT_PUBLIC_*`.
