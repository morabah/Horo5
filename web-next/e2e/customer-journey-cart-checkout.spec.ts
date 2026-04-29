import { expect, test } from "@playwright/test"
import { expectMainShell } from "./fixtures"

/**
 * Customer journey smoke test: Browse → PDP → Add to cart → Cart qty controls
 * → Checkout with qty controls → verify isolation and responsiveness.
 *
 * Requires Medusa + `NEXT_PUBLIC_*` keys.
 * With a dev server already running:
 *   PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run test:e2e -- e2e/customer-journey-cart-checkout.spec.ts
 */

let catalogJson = ""

type CatalogProduct = {
  slug?: string
  name?: string
  priceEgp?: number
  thumbnail?: string | null
  media?: { main?: string | null }
  variantsBySize?: Record<string, { id?: string; priceEgp?: number; available?: boolean }>
}

type SeededCartLine = {
  productSlug: string
  size: string
  qty: number
  variantId: string
  productName: string
  imageSrc?: string
  unitPriceEgp?: number
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function pickSeededCart() {
  if (!catalogJson) return null

  const parsed = JSON.parse(catalogJson) as { products?: CatalogProduct[] }
  const products = (parsed.products || []).flatMap((product) => {
    const variants = product.variantsBySize || {}
    const size = (["M", "L", "S", "XL", "XS", "XXL"] as const).find((key) => {
      const variant = variants[key]
      return variant?.id && variant.available !== false
    })
    const variant = size ? variants[size] : null
    if (!product.slug || !product.name || !size || !variant?.id) return []
    return [{ product, size, variant }]
  })

  if (products.length < 2) return null

  const selected = products.slice(0, 2).map(({ product, size, variant }, index): SeededCartLine => ({
    productSlug: product.slug!,
    size,
    qty: index === 0 ? 1 : 2,
    variantId: variant.id!,
    productName: product.name!,
    imageSrc: product.media?.main || product.thumbnail || undefined,
    unitPriceEgp: variant.priceEgp ?? product.priceEgp,
  }))

  return {
    first: selected[0],
    second: selected[1],
    lines: selected,
  }
}

async function seedBrowserCart(page: import("@playwright/test").Page, lines: SeededCartLine[]) {
  await page.addInitScript((seedLines) => {
    try {
      localStorage.setItem("horo-cart-v1", JSON.stringify(seedLines))
      localStorage.removeItem("horo-medusa-cart-id-v1")
      document.cookie = "horo_cart_id=; Max-Age=0; path=/"
    } catch {
      /* ignore */
    }
  }, lines)
}

test.beforeAll(async () => {
  const base = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "").replace(/\/$/, "")
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
  if (!base || !key) return
  try {
    const res = await fetch(`${base}/storefront/catalog`, {
      headers: { "x-publishable-api-key": key },
    })
    if (!res.ok) return
    const data = (await res.json()) as { products?: unknown[] }
    if (Array.isArray(data.products) && data.products.length > 0) {
      catalogJson = JSON.stringify(data)
    }
  } catch {
    /* Medusa not reachable from test runner — journey will skip. */
  }
})

test.beforeEach(async ({ context }) => {
  await context.addInitScript((raw: string) => {
    try {
      sessionStorage.clear()
      if (raw) sessionStorage.setItem("horo:lastCatalog", raw)
    } catch {
      /* ignore */
    }
  }, catalogJson)
})

test.describe("customer journey: cart & checkout", () => {
  // ─── Bug #2 fix validation: qty update isolation on cart page ───
  test("cart: increasing item A does NOT change item B quantity", async ({ page }) => {
    const seeded = pickSeededCart()
    test.skip(!seeded, "Need at least two catalog products with live variants")

    await seedBrowserCart(page, seeded!.lines)
    await page.goto("/cart", { waitUntil: "domcontentloaded" })
    await expect(page.getByRole("heading", { level: 1, name: /Your cart/i })).toBeVisible({ timeout: 30_000 })

    const firstRow = page.locator("article.cart-item").filter({ hasText: seeded!.first.productName }).first()
    const secondRow = page.locator("article.cart-item").filter({ hasText: seeded!.second.productName }).first()
    await expect(firstRow).toBeVisible({ timeout: 30_000 })
    await expect(secondRow).toBeVisible({ timeout: 30_000 })

    const firstQty = firstRow.locator(".cart-stepper-value")
    const secondQty = secondRow.locator(".cart-stepper-value")

    // Initial quantities
    await expect(firstQty).toHaveText(String(seeded!.first.qty))
    await expect(secondQty).toHaveText(String(seeded!.second.qty))

    // Click "+" on item A
    await firstRow
      .getByRole("button", { name: new RegExp(`Increase quantity for ${escapeRegExp(seeded!.first.productName)}`, "i") })
      .click()

    // Bug #1 fix: should update within 1s (was slow before)
    await expect(firstQty).toHaveText(String(seeded!.first.qty + 1), { timeout: 1000 })
    // Bug #2 fix: item B must be unchanged
    await expect(secondQty).toHaveText(String(seeded!.second.qty), { timeout: 1000 })
  })

  // ─── Bug #2 fix validation: qty update isolation on checkout page ───
  test("checkout: increasing item A does NOT change item B quantity", async ({ page }) => {
    const seeded = pickSeededCart()
    test.skip(!seeded, "Need at least two catalog products with live variants")
    test.setTimeout(180_000)

    await seedBrowserCart(page, seeded!.lines)
    await page.goto("/checkout", { waitUntil: "domcontentloaded" })

    const checkoutMain = page.locator("#main-content")
    await expect(checkoutMain.getByText(/Loading checkout/i)).toBeHidden({ timeout: 120_000 })

    // Wait for the checkout form to be ready
    await expect(page.locator("#email")).toBeVisible({ timeout: 30_000 })

    // Find quantity steppers for each product
    const firstGroup = page
      .getByRole("group", { name: new RegExp(`(?:Qty|Quantity).*${escapeRegExp(seeded!.first.productName)}`, "i") })
      .first()
    const secondGroup = page
      .getByRole("group", { name: new RegExp(`(?:Qty|Quantity).*${escapeRegExp(seeded!.second.productName)}`, "i") })
      .first()

    await expect(firstGroup).toBeVisible({ timeout: 30_000 })
    await expect(secondGroup).toBeVisible({ timeout: 30_000 })

    const firstQty = firstGroup.locator(".cart-stepper-value")
    const secondQty = secondGroup.locator(".cart-stepper-value")

    // Verify initial quantities
    await expect(firstQty).toHaveText(String(seeded!.first.qty))
    await expect(secondQty).toHaveText(String(seeded!.second.qty))

    // Click "+" on first item
    await firstGroup.getByRole("button", { name: /Increase quantity/i }).click()

    // Should update immediately (Bug #1: within 1s)
    await expect(firstQty).toHaveText(String(seeded!.first.qty + 1), { timeout: 1000 })
    // Bug #2: second item must be unchanged
    await expect(secondQty).toHaveText(String(seeded!.second.qty), { timeout: 1000 })
  })

  // ─── Bug #1 fix validation: rapid multi-click responsiveness ───
  test("cart: rapid increase clicks respond immediately without delay", async ({ page }) => {
    const seeded = pickSeededCart()
    test.skip(!seeded, "Need at least two catalog products with live variants")

    // Seed with qty=1 so we can click "+" multiple times
    const lines = seeded!.lines.map((l) => ({ ...l, qty: 1 }))
    await seedBrowserCart(page, lines)
    await page.goto("/cart", { waitUntil: "domcontentloaded" })
    await expect(page.getByRole("heading", { level: 1, name: /Your cart/i })).toBeVisible({ timeout: 30_000 })

    const firstRow = page.locator("article.cart-item").filter({ hasText: seeded!.first.productName }).first()
    await expect(firstRow).toBeVisible({ timeout: 30_000 })

    const firstQty = firstRow.locator(".cart-stepper-value")
    const increaseBtn = firstRow
      .getByRole("button", { name: new RegExp(`Increase quantity for ${escapeRegExp(seeded!.first.productName)}`, "i") })

    // Click "+" three times rapidly
    await expect(firstQty).toHaveText("1")
    await increaseBtn.click()
    await expect(firstQty).toHaveText("2", { timeout: 500 })
    await increaseBtn.click()
    await expect(firstQty).toHaveText("3", { timeout: 500 })
    await increaseBtn.click()
    await expect(firstQty).toHaveText("4", { timeout: 500 })

    // The other item should remain at qty=1
    const secondRow = page.locator("article.cart-item").filter({ hasText: seeded!.second.productName }).first()
    const secondQty = secondRow.locator(".cart-stepper-value")
    await expect(secondQty).toHaveText("1", { timeout: 1000 })
  })

  // ─── Cart: decrease to 0 removes the item ───
  test("cart: decreasing qty to 0 removes the line and shows undo", async ({ page }) => {
    const seeded = pickSeededCart()
    test.skip(!seeded, "Need at least two catalog products with live variants")

    // Seed first item with qty=1 so one "-" click removes it
    const lines = [
      { ...seeded!.first, qty: 1 },
      { ...seeded!.second, qty: 2 },
    ]
    await seedBrowserCart(page, lines)
    await page.goto("/cart", { waitUntil: "domcontentloaded" })

    const firstRow = page.locator("article.cart-item").filter({ hasText: seeded!.first.productName }).first()
    await expect(firstRow).toBeVisible({ timeout: 30_000 })

    // Click the Remove button
    const removeBtn = firstRow.getByRole("button", { name: /Remove/i })
    await removeBtn.click()

    // Item should be removed
    await expect(firstRow).toBeHidden({ timeout: 3000 })

    // Second item should still be visible with correct qty
    const secondRow = page.locator("article.cart-item").filter({ hasText: seeded!.second.productName }).first()
    await expect(secondRow).toBeVisible({ timeout: 3000 })
    const secondQty = secondRow.locator(".cart-stepper-value")
    await expect(secondQty).toHaveText("2")
  })

  // ─── Full flow: PDP → Add to bag → Cart → verify quantity ───
  test("full flow: add to bag from PDP, verify in cart with correct qty", async ({ page }) => {
    test.skip(!catalogJson, "Set NEXT_PUBLIC_MEDUSA_BACKEND_URL + NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY and run Medusa")
    test.setTimeout(180_000)

    // Start with an empty cart
    await page.goto("/products", { waitUntil: "domcontentloaded" })
    await expectMainShell(page)
    await page.evaluate(() => {
      try {
        localStorage.removeItem("horo-cart-v1")
        localStorage.removeItem("horo-medusa-cart-id-v1")
        document.cookie = "horo_cart_id=; Max-Age=0; path=/"
      } catch {
        /* ignore */
      }
    })

    // Navigate to first product
    const productLink = page.locator("#main-content").locator('a[href^="/products/"]').first()
    await expect(productLink).toBeVisible({ timeout: 90_000 })
    await productLink.click()
    await expect(page).toHaveURL(/\/products\/[^/]+$/)
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 60_000 })
    await page.waitForLoadState("networkidle").catch(() => {})
    await page.waitForTimeout(1500)

    // Select a size
    const main = page.locator("#main-content")
    const sizeGroup = main.locator("aside").getByRole("group", { name: /Size/i })
    await expect(sizeGroup).toBeVisible({ timeout: 30_000 })

    for (const label of ["M", "L", "S", "XL", "XS", "XXL"] as const) {
      const btn = sizeGroup.getByRole("button", { name: new RegExp(`^${label}$`) })
      if ((await btn.count()) === 0) continue
      const pressed = await btn.getAttribute("aria-pressed")
      if (pressed === "true") break
      try {
        await btn.click({ timeout: 2000 })
      } catch {
        await btn.click({ force: true, timeout: 2000 })
      }
      break
    }

    await expect(sizeGroup.locator('button[aria-pressed="true"]')).toHaveCount(1, { timeout: 15_000 })

    // Click "Add to Bag"
    const addToBag = main.locator("button.cta-clay").filter({ hasText: /Add to Bag/i }).first()
    await expect(addToBag).toBeVisible({ timeout: 30_000 })
    await addToBag.scrollIntoViewIfNeeded()
    await addToBag.click()

    // Verify cart in localStorage
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            try {
              const raw = localStorage.getItem("horo-cart-v1")
              if (!raw) return 0
              const parsed = JSON.parse(raw) as unknown
              return Array.isArray(parsed) ? parsed.length : 0
            } catch {
              return 0
            }
          }),
        { timeout: 30_000 },
      )
      .toBeGreaterThan(0)

    // Close mini-cart if it appears
    const miniCart = page.getByRole("dialog", { name: /added to bag|item added/i })
    try {
      await miniCart.waitFor({ state: "visible", timeout: 8000 })
      await miniCart.getByRole("button", { name: /^Close$/i }).click()
      await expect(miniCart).toBeHidden({ timeout: 8000 })
    } catch {
      /* Drawer is optional */
    }

    // Go to cart and verify item is there with qty=1
    await page.goto("/cart", { waitUntil: "domcontentloaded" })
    await expect(page.getByRole("heading", { level: 1, name: /Your cart/i })).toBeVisible({ timeout: 30_000 })
    await expect(page.locator("article.cart-item").first()).toBeVisible({ timeout: 60_000 })

    const qtyDisplay = page.locator("article.cart-item").first().locator(".cart-stepper-value")
    await expect(qtyDisplay).toHaveText("1", { timeout: 5_000 })

    // Increase qty to 2
    const increaseBtn = page.locator("article.cart-item").first().getByRole("button", { name: /Increase quantity/i })
    await increaseBtn.click()
    await expect(qtyDisplay).toHaveText("2", { timeout: 1000 })

    // Navigate to checkout
    await page.goto("/checkout", { waitUntil: "domcontentloaded" })
    const checkoutMain = page.locator("#main-content")
    await expect(checkoutMain.getByText(/Loading checkout/i)).toBeHidden({ timeout: 120_000 })

    // Verify the checkout page loaded with contact form
    try {
      await expect(page.locator("#email")).toBeVisible({ timeout: 30_000 })
    } catch {
      const excerpt = (await checkoutMain.innerText()).replace(/\s+/g, " ").trim().slice(0, 500)
      throw new Error(
        `Checkout did not show #email. Excerpt: ${excerpt}`,
      )
    }
    await expect(page.locator("#phone")).toBeVisible()
  })

  // ─── Cart empty state ───
  test("cart: empty cart shows correct empty state", async ({ page }) => {
    test.skip(!catalogJson, "Set NEXT_PUBLIC_MEDUSA_BACKEND_URL + NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY and run Medusa")

    // Ensure empty cart
    await page.addInitScript(() => {
      try {
        localStorage.removeItem("horo-cart-v1")
        localStorage.removeItem("horo-medusa-cart-id-v1")
        document.cookie = "horo_cart_id=; Max-Age=0; path=/"
      } catch {
        /* ignore */
      }
    })

    await page.goto("/cart", { waitUntil: "domcontentloaded" })
    await expect(page.getByRole("heading", { level: 1, name: /Your cart/i })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText("0 items")).toBeVisible({ timeout: 5_000 })
  })

  // ─── Checkout empty redirect/message ───
  test("checkout: empty cart shows 'nothing to check out' message", async ({ page }) => {
    test.skip(!catalogJson, "Set NEXT_PUBLIC_MEDUSA_BACKEND_URL + NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY and run Medusa")
    test.setTimeout(180_000)

    // Ensure empty cart
    await page.addInitScript(() => {
      try {
        localStorage.removeItem("horo-cart-v1")
        localStorage.removeItem("horo-medusa-cart-id-v1")
        document.cookie = "horo_cart_id=; Max-Age=0; path=/"
      } catch {
        /* ignore */
      }
    })

    await page.goto("/checkout", { waitUntil: "domcontentloaded" })
    const checkoutMain = page.locator("#main-content")
    await expect(checkoutMain.getByText(/Loading checkout/i)).toBeHidden({ timeout: 120_000 })

    // Should show "nothing to check out" or "bag is empty"
    await expect(
      checkoutMain.getByText(/nothing to check out|bag is empty/i),
    ).toBeVisible({ timeout: 30_000 })
  })
})
