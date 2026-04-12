# Horo5 — agent and contributor guide

This repo is the **HORO** storefront and related services (`web/`, `web-next/`, `medusa-backend/`, `shopify-headless/`). It is **not** the PosalPro MVP2 app tree referenced inside some `doc/` files.

## Authoritative docs (repo root `doc/`)

| Document | Use in Horo5 |
|----------|----------------|
| [`doc/Agent.md`](doc/Agent.md) | **Apply** React / Next.js performance and correctness patterns (parallel fetch, bundle hygiene, hydration: defer `localStorage` / `navigator` until after mount). |
| [`doc/CORE_REQUIREMENTS.md`](doc/CORE_REQUIREMENTS.md) | **Selective**: treat quality ideas (TypeScript discipline, accessibility intent, validation at boundaries) as guidelines. **Ignore** PosalPro-only paths (`posalpro-app/`, Prisma/NextAuth templates, `npm run dev:smart`, `audit:duplicates`, internal services named in that doc). |
| [`doc/DEVELOPMENT_PHILOSOPHY.md`](doc/DEVELOPMENT_PHILOSOPHY.md) | **Selective**: prefer clear code, trace root causes, avoid ad-hoc client caches when a single pattern already exists. **Ignore** stack-specific mandates (Zustand + React Query layout, tenant middleware, `useApiClient`) unless that code exists here. |
| [`doc/LESSONS_LEARNED.md`](doc/LESSONS_LEARNED.md) | **Selective**: hydration, `useEffect` scope, worker-local singletons, and React Query cache pitfalls apply to any React/Next work. Ignore module paths and features that are not in this repo. |

## Horo5 quality gates

- **`web-next/`** (Next.js app): from this directory run `npm run type-check` and `npm run lint` before treating UI work as done.
- **`web/`** (Vite source consumed by `web-next`): keep `npx tsc --noEmit` clean when changing shared `web/src`.
- **`medusa-backend/`**: follow that package’s README and env templates. **Local is the source of truth** for Medusa: align Railway (code revision, migrations, seeded data, env keys, media URLs) with local using the parity table in [`medusa-backend/README.md`](medusa-backend/README.md) (section “Local is the source of truth”).

## SSR / hydration (required for `web-next`)

Client-only data (`localStorage`, `sessionStorage`, `navigator.share`, `window` layout flags) must not determine the **first** paint of client components unless it matches the server. Prefer: default state on the server and first client render, then **`useEffect`** to read browser APIs and update state. See `doc/Agent.md` §6.5–6.6 and `doc/LESSONS_LEARNED.md` (useEffect / hydration lessons).
