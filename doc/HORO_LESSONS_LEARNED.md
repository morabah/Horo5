# HORO Storefront — Cart & Checkout Lessons Learned

> **Date**: April 2026
> **Scope**: `web-next/src/storefront/cart/*`, `web-next/src/storefront/pages/Checkout.tsx`, `web-next/src/storefront/lib/checkout-cart-rebuild.ts`, `web-next/src/storefront/lib/medusa/client.ts`
> **Status**: Implemented, type-check clean, 217/217 unit tests passing

---

## 1. Server-Rendered Cart Must Seed the Client Context — Not Be Discarded

**Category**: React / SSR / Cart State • **Impact**: High (eliminates 1–2 round-trips per cold `/cart` load)

### Issue

`src/app/(main)/cart/page.tsx` fetched the cart server-side (RSC) and passed `initialLines` / `initialGiftWrapEgp` to the `<Cart>` page component. However, `CartProvider` ignored this data entirely. On mount it re-ran `getCart(medusaCartId)` from `localStorage`/`cookie` (`CartContext.tsx:379-388`), and the `<Cart>` page itself fired *another* `getCart` to resolve shipping options (`Cart.tsx:534-542`). A cold load of `/cart` therefore paid:

1. SSR fetch (server)
2. `getCart` from `CartProvider` mount (browser)
3. `getCart` for shipping quote (browser)
4. `listShippingOptions` (browser)

The server-rendered cart data was thrown away after hydration.

### Root Cause

`CartProvider` had no API to accept a server-rendered cart snapshot. It only knew how to load from browser storage (`localStorage` + cookie) and then auto-sync with Medusa. The `<Cart>` and `<Checkout>` page components received `initialCart` / `initialLines` props but had no mechanism to inject them into the context above them in the tree.

### Solution

Added `seedFromServerCart(cart: MedusaCart | null | undefined)` to the `CartContext` API:

- `seededRef` (`useRef`) prevents double-seeding.
- `skipNextAutoSyncRef` prevents the `medusaCartId` change effect from firing a redundant `getCart` right after seeding.
- The provider's on-mount storage-load effect checks `seededRef.current` and skips the `localStorage` round-trip entirely.
- Pages call `seedFromServerCart` in a child `useEffect` (child effects run before the parent provider's effect, guaranteeing the seed wins the race).

**Files**: `CartContext.tsx`, `Cart.tsx`, `Checkout.tsx`, `app/(main)/cart/page.tsx`

### Prevention Standards

- ✅ If a page fetches data server-side (RSC), the client context that owns that data must expose an explicit seed/hydration method.
- ✅ Use `useRef` flags (not state) for one-shot seeding to avoid extra re-renders.
- ✅ Child-page `useEffect` seeding is safe when the parent provider's mount effect is the competing path — React runs child effects before parent effects on the same commit.

---

## 2. Serialize Line-Item POSTs Against a Single Medusa Cart

**Category**: Medusa API / Race Conditions • **Impact**: High (correctness)

### Issue

`addCheckoutCartLinesInParallelBatches` fired up to 4 `POST /store/carts/:id/line-items` in parallel. Medusa V2 line-item handlers mutate the same cart aggregate (subtotal, total, line list). Concurrent POSTs race: the response of an in-flight POST observes the cart totals *at that moment*, so the "last response wins" pattern can silently drop earlier line additions and return a partial cart. This also produced occasional 409s on the payment collection later because the cart state was inconsistent.

### Root Cause

The batching logic assumed bounded concurrency was safe for independent resources. Medusa cart line-items are **not** independent — they all write the same parent cart row.

### Solution

Set `DEFAULT_CHECKOUT_LINE_ADD_CONCURRENCY = 1` and rewrote the loop to `await` each `addLineItem` sequentially. The cart returned by the final POST is guaranteed to be authoritative. The number of lines re-added during checkout is bounded by the user's bag (typically < 10), so throughput loss is negligible.

Kept the function name (`addCheckoutCartLinesInParallelBatches`) for call-site stability; removed the unused `_concurrency` parameter after verifying no production caller passed it.

**Files**: `checkout-cart-rebuild.ts`, `checkout-cart-rebuild.unit.spec.ts`

### Prevention Standards

- ✅ Any batch POSTs targeting the **same aggregate root** (same cart, same order, same account) must be serialized unless the API explicitly documents optimistic concurrency or ETag support.
- ✅ When changing concurrency for correctness, rewrite the unit test to assert `maxInFlight === 1` rather than just testing output equality.

---

## 3. Reuse the Cart Already Fetched by a Boot Helper

**Category**: Medusa API / Performance • **Impact**: Medium (1 round-trip saved per checkout cold load)

### Issue

`loadCheckout` in `Checkout.tsx` called `ensureCheckoutCartAvailableRef.current()`, which already fetched (or created) the cart and stored it in `resolvedCheckout`. The very next line then did `Promise.all([getCheckoutStatus, getCart])`, fetching the **same cart a second time**.

### Root Cause

Sequential coding without reviewing the return value of the previous async helper. `ensureCheckoutCartAvailable` returned `{ cartId, created }` but not the cart object itself.

### Solution

Extended `ensureCheckoutCartAvailable` to return the cart it fetched/created. `loadCheckout` now reuses that cart directly and only calls `getCheckoutStatus` separately.

**Files**: `Checkout.tsx`

### Prevention Standards

- ✅ When an async helper already performs a network round-trip, extend its return type to include the fetched payload rather than re-fetching downstream.
- ✅ Review `Promise.all` blocks for redundant calls; if two promises depend on the same id, the first one probably already has the data.

---

## 4. Cache In-Flight Promises for Non-Idempotent POSTs

**Category**: Medusa API / Race Conditions • **Impact**: Low–Medium (prevents orphaned payment collections)

### Issue

`ensurePaymentCollection(cart)` checked `cart.payment_collection?.id` from a passed-in snapshot, then immediately `POST`ed `/store/payment-collections`. If two callers raced (e.g., a prefetch effect + a provider click), both could see no collection and both would POST, creating orphaned collections that Medusa had to reconcile on `complete`.

### Root Cause

No in-flight deduplication. The check-then-act pattern is inherently racy when the "check" is against a stale snapshot and the "act" is a network POST.

### Solution

Added a module-level `Map<string, Promise<string>>` keyed by `cart.id`. `ensurePaymentCollection` now:

1. Returns early if `cart.payment_collection?.id` exists.
2. Returns the cached promise if one is already in flight for this `cart.id`.
3. Creates the POST promise, stores it, and removes it in `.finally()`.

**Files**: `lib/medusa/client.ts`

### Prevention Standards

- ✅ For non-idempotent POSTs that can be triggered by multiple UI paths (effects, clicks, prefetches), cache the in-flight promise per target resource id.
- ✅ This is the same pattern already used for `giftWrapOfferPromiseRef` in `CartContext` — apply it consistently.

---

## 5. Synchronously Wipe Browser Storage on 404 Recovery

**Category**: Cart State / Edge Cases • **Impact**: Low (correctness under race conditions)

### Issue

`clearStaleCartIf404` only called `setMedusaCartId(null)` (React state). The actual `localStorage` item and cookie were cleared by a separate `useEffect` that ran on the *next* render. Until that render committed, any concurrent `loadMedusaCartId()` call (another tab waking up, a rapid re-mount) would read the dead cart id and attempt to use it.

### Root Cause

Trusted React's async state batching to propagate the null to storage. Browser storage is synchronous; React state is not.

### Solution

Call `persistMedusaCartId(null)` and update `medusaCartIdRef.current = null` **synchronously** inside `clearStaleCartIf404`, in addition to the React state setter. The ref update also prevents any in-flight logic that reads `medusaCartIdRef` from seeing the stale id before React commits.

**Files**: `CartContext.tsx`

### Prevention Standards

- ✅ When recovering from a 404 or auth expiry, wipe the synchronous cache/storage **before** or **at the same time as** the React state update.
- ✅ `useRef` mirrors of state values are useful exactly for this: they allow synchronous reads without waiting for React's commit phase.

---

## 6. Deduplicate Storage Helpers — Single Source of Truth

**Category**: Code Hygiene / Maintainability • **Impact**: Medium

### Issue

`getStoredCartId` / `setStoredCartId` (with `localStorage` + cookie logic) were copy-pasted in both `CartContext.tsx` and `Checkout.tsx`. The Checkout copy didn't use the shared `MEDUSA_CART_ID_STORAGE_KEY` import path — drift was already happening.

### Root Cause

Convenience copy-paste instead of extracting a shared module. Both files needed the same dual-storage semantics (localStorage primary, cookie fallback for SSR cookie passthrough).

### Solution

Created `src/storefront/cart/cart-storage.ts` exporting `loadMedusaCartId` and `persistMedusaCartId`. Both `CartContext` and `Checkout.tsx` import from it. `Checkout.tsx` keeps `getStoredCartId` / `setStoredCartId` as thin readability aliases (`const getStoredCartId = loadMedusaCartId`).

Also removed the private `subtotalFromCartLines` from `Cart.tsx` and switched to the shared `merchandiseSubtotalFromCartLines` from `lib/medusa/cart-money.ts`, ensuring cart and checkout compute subtotals with identical logic.

**Files**: `cart/cart-storage.ts` (new), `CartContext.tsx`, `Checkout.tsx`, `Cart.tsx`

### Prevention Standards

- ✅ Any logic that touches `localStorage` / cookies from multiple files belongs in a single `*-storage.ts` module.
- ✅ Subtotal, tax, and shipping math should be defined once in a shared money module, not reimplemented per page.

---

## Remaining Observations (Not Yet Implemented)

The following were identified during the same review but deferred to future work:

| # | Observation | Priority | Reason Deferred |
|---|-------------|----------|-----------------|
| 4 | `Checkout.tsx` is 2,600 lines — split into focused modules (address parsing, payment methods, order snapshot) | Medium | Large refactor; bundle impact is acceptable until more payment providers are added |
| 5 | `useEffect` dep list includes `items.length` — re-fetches checkout aux data on every add/remove | Medium | Requires careful restructuring of the boot vs. refresh paths; `awaitPendingCartSync` already handles explicit refreshes |
| 8 | Mini-cart prefetch fires `getCart` even when shipping-options + payment-providers caches are fresh | Low | Would need a secondary `region_id`-by-`cartId` cache; gain is one small `getCart` round-trip |
| 9 | `Idempotency-Key` not propagated to `addLineItem` / `updateCart` / `addShippingMethod` | Low | User-driven actions; risk is highest only for the now-serialized checkout-cart rebuild |
| 10 | `OrderSummary` skeleton briefly shown even when `initialCart` was server-supplied | Cosmetic | Logic already correct — skeleton only shows when `initialState === 'unknown'`, which means the cookie pointed to an unfetchable cart |

---

## Related Documents

- `doc/Agent.md` §1.1 (bundle hygiene)
- `doc/LESSONS_LEARNED.md` (PosalPro / shared patterns)
- `AGENTS.md` (Horo5-specific SSR and hydration rules)
