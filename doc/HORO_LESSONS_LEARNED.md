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

## 7. Skip `getCart` in Mini-Cart Prefetch When Ancillary Caches Are Warm

**Category**: Medusa API / Performance • **Impact**: Low (eliminates 1 `getCart` round-trip per mini-cart reopen inside the 45 s window)

### Issue

`prefetchCheckoutAuxForCart` always called `getCart` to learn `region_id` before deciding whether to fetch shipping options and payment providers. If both the shipping-options cache and the payment-providers cache were still fresh, the `getCart` was entirely wasted — its only purpose was to feed `region_id` into `listShippingOptions` / `listPaymentProviders`.

### Root Cause

No secondary cache tracked `region_id` per `cartId`. The prefetch helper could not short-circuit because it did not know whether the `region_id` it needed was already available from a prior boot or refresh.

### Solution

Added a `regionIdByCartId` cache alongside the existing shipping-options and payment-providers caches in `checkout-aux-cache.ts`:

- `getCachedRegionIdForCart(cartId)` / `setCachedRegionIdForCart(cartId, regionId)`
- `prefetchCheckoutAuxForCart` now early-returns when **both** ancillary caches are fresh **and** we already know the region for the cart.
- The cache is populated organically by every existing `setShippingOptionsCache(cartId, ...)` call in `Checkout.tsx` (boot, `refreshCartState`, `persistInformationAndShipping`).
- `invalidateCheckoutAuxCacheForCart` now drops both shipping and region entries together, keeping invalidation atomic.
- Three new unit tests cover freshness gating, blank-id rejection, and invalidation (`checkout-aux-cache.unit.spec.ts`).

**Files**: `checkout-aux-cache.ts`, `checkout-aux-cache.unit.spec.ts`, `Checkout.tsx`

### Prevention Standards

- ✅ Any prefetch that needs a stable foreign key (`region_id`, `customer_id`) to query aux data should cache that key per resource id so the prefetch can short-circuit when the dependent caches are warm.
- ✅ Invalidate caches atomically: if two caches are derived from the same cart state, they should be cleared by a single helper.

---

## 8. Propagate `Idempotency-Key` to All Cart Mutations

**Category**: Medusa API / Correctness • **Impact**: Low–Medium (prevents duplicate line items on transient network blips during checkout-cart rebuild)

### Issue

The retry safety net (`completeCart`) already used an `Idempotency-Key`, but `addLineItem`, `updateLineItem`, `updateCart`, `addShippingMethod`, and `completeCart` did not. A transient network glitch during the serialized `addLineItem` rebuild could produce duplicates if the request reached Medusa but the response was lost.

### Root Cause

`request()` in `client.ts` did not accept or forward an `idempotencyKey`. Only the checkout completion path had ad-hoc idempotency logic.

### Solution

- Extended `request()` in `client.ts` to accept `idempotencyKey?: string` and forward it as the `Idempotency-Key` header. Medusa routes that do not recognize the header ignore it safely.
- Updated `addLineItem`, `updateLineItem`, `updateCart`, `addShippingMethod`, and `completeCart` to accept an optional `{ idempotencyKey }` option and pass it through.
- Added `checkoutCartRebuildLineIdempotencyKey` helper (`checkout-cart-rebuild.ts`) that generates a deterministic key per `(cartId, variantId, lineIndex)` so a transient blip during the rebuild → resume path cannot double-add the same line.
- `recreateGuestCartFromCart` and the checkout cart rebuild now pass these deterministic keys.
- Unit test asserts each rebuild POST carries the expected key (`checkout-cart-rebuild.unit.spec.ts`).

**Files**: `client.ts`, `checkout-cart-rebuild.ts`, `checkout-cart-rebuild.unit.spec.ts`

### Prevention Standards

- ✅ Wire `Idempotency-Key` through the entire mutation surface, not just the highest-risk endpoint; a network blip can hit any POST.
- ✅ Use deterministic keys (resource id + position / index) rather than random UUIDs so retries and replays resolve to the same idempotency scope.

---

## 9. Reuse RSC `initialCart` on First Checkout Boot

**Category**: React / SSR / Performance • **Impact**: Medium (eliminates one more `getCart` round-trip on checkout cold load)

### Issue

Even after #1 (CartContext seed) and #3 (dedup `getCart` in boot), `ensureCheckoutCartAvailable` still unconditionally fetched the cart from Medusa to verify it existed before entering the shipping / providers fan-out. When the server had already supplied a valid cart via `initialCheckoutCart`, this was a wasted round-trip.

### Root Cause

`ensureCheckoutCartAvailable` only accepted a cart id; it had no path to accept an already-resolved cart snapshot from the RSC page wrapper.

### Solution

- `ensureCheckoutCartAvailable` now accepts an optional `{ cachedCart }` argument. When the cart id from storage matches `cachedCart.id`, the helper uses the cached cart directly and skips the `GET /store/carts/:id` round-trip (`Checkout.tsx`).
- A one-shot `initialCartHintRef` feeds `initialCheckoutCart` into the boot effect's first call, then nulls itself out so any later refresh path always hits a live fetch.
- Combined with #1 (`CartContext` seed) and #3 (single `getCart` in boot), a cold checkout load with valid RSC data now performs **zero redundant cart fetches** before the parallel shipping / providers fan-out: only `getCheckoutStatus` + `listShippingOptions` + `listPaymentProviders`.

**Files**: `Checkout.tsx`

### Prevention Standards

- ✅ Boot helpers that resolve a resource should accept an optional cached snapshot; a simple identity match (same id) is enough to skip the verification GET.
- ✅ Use a one-shot ref (`initialCartHintRef`) rather than state to pass the hint into an effect — this avoids re-triggering the boot path if React re-renders before the effect fires.

---

## Remaining Observations (Not Yet Implemented)

The following were identified during the same review but deferred to future work:

| # | Observation | Priority | Reason Deferred |
|---|-------------|----------|-----------------|
| 4 | `Checkout.tsx` is 2,600 lines — split into focused modules (address parsing, payment methods, order snapshot) | Medium | Large refactor; bundle impact is acceptable until more payment providers are added |
| 5 | `useEffect` dep list includes `items.length` — re-fetches checkout aux data on every add/remove | Medium | Requires careful restructuring of the boot vs. refresh paths; `awaitPendingCartSync` already handles explicit refreshes |
| 10 | `OrderSummary` skeleton briefly shown even when `initialCart` was server-supplied | Cosmetic | Logic already correct — skeleton only shows when `initialState === 'unknown'`, which means the cookie pointed to an unfetchable cart |

---

## Related Documents

- `doc/Agent.md` §1.1 (bundle hygiene)
- `doc/LESSONS_LEARNED.md` (PosalPro / shared patterns)
- `AGENTS.md` (Horo5-specific SSR and hydration rules)
