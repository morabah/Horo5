This is the **HORO storefront on Next.js** (`web-next`). Product and checkout UI live in [`src/storefront/`](./src/storefront/) (import paths like `@/storefront/pages/...`). App Router pages in `src/app/` mount those components and handle data fetching.

### Route parity (legacy Vite app → Next)

| Legacy route | `web-next` |
|--------------|------------|
| `/`, `/about`, `/exchange`, `/privacy`, `/terms` | Same path, same page component |
| `/feelings`, `/feelings/:slug` | Same |
| `/occasions`, `/occasions/:slug` | Same |
| `/products/:slug` | Same |
| `/cart`, `/checkout`, `/checkout/success` | Same |
| `/search` | Same |
| `/vibes` → feelings | `redirect("/feelings")` |
| `/vibes/:slug` | `redirect` using `LEGACY_VIBE_SLUG_TO_FEELING_SLUG` from [`legacy-slugs.ts`](./src/storefront/data/legacy-slugs.ts) |
| `/artists` / `/artists/:slug` → feelings | `redirect("/feelings")` |
| `/products` (list) → search | `redirect("/search")` |
| `*` | [`not-found.tsx`](./src/app/not-found.tsx) |

### Medusa (`medusa-backend`)

1. Run API: `cd medusa-backend && npm run dev` (default `http://localhost:9000`).
2. Copy [`.env.example`](./.env.example) → `.env.local` and set **`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`**. From `web-next/`, **`npm run dev:local`** kills anything listening on **9000** (Medusa) and **3000** (Next dev) if present, then starts [`medusa-backend`](../medusa-backend) (`npm run dev`), waits until `http://127.0.0.1:9000/health` responds, then starts Next with `NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000`. **`npm run dev:railway`** starts only Next and points at [`.env.railway`](./.env.railway) (plus optional `.env.railway.local`). If Medusa is already running locally, use **`npm run dev`** instead of `dev:local` so you do not start a second backend.
3. On the Medusa service, **`STORE_CORS`** / **`AUTH_CORS`** must include your storefront origin (e.g. `http://localhost:3000`).
4. Catalog: [`AppProviders`](./src/storefront/AppProviders.tsx) calls **`hydrateRuntimeCatalog()`** on load; products merge into runtime data when the Store API is reachable ([`storefront/lib/medusa/catalog.ts`](./src/storefront/lib/medusa/catalog.ts)).

Storefront code reads **`process.env.NEXT_PUBLIC_*`** (see `.env.example`).

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
