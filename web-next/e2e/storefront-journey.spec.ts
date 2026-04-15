import { expect, test } from "@playwright/test"
import { expectMainShell } from "./fixtures"

/**
 * Full path: catalog in session → PDP → add to bag → cart → checkout.
 * Requires Medusa + `NEXT_PUBLIC_*` keys (loaded via `@next/env` in `playwright.config.ts`).
 * With a dev server already running:
 *   PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run test:e2e -- e2e/storefront-journey.spec.ts
 */

let catalogJson = ""

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
  // Seed session catalog on every navigation. Do not clear localStorage here —
  // Playwright init scripts run on each document load and would wipe the cart
  // before `/cart` and `/checkout`.
  await context.addInitScript((raw: string) => {
    try {
      sessionStorage.clear()
      if (raw) sessionStorage.setItem("horo:lastCatalog", raw)
    } catch {
      /* ignore */
    }
  }, catalogJson)
})

test.describe("storefront journey", () => {
  test("products → PDP → add to bag → cart → checkout contact form", async ({ page }) => {
    test.skip(!catalogJson, "Set NEXT_PUBLIC_MEDUSA_BACKEND_URL + NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY and run Medusa")

    test.setTimeout(180_000)

    await page.goto("/products", { waitUntil: "domcontentloaded" })
    await expectMainShell(page)
    await page.evaluate(() => {
      try {
        localStorage.removeItem("horo-cart-v1")
      } catch {
        /* ignore */
      }
    })

    const productLink = page.locator("#main-content").locator('a[href^="/products/"]').first()
    await expect(productLink).toBeVisible({ timeout: 90_000 })
    const href = await productLink.getAttribute("href")
    expect(href, "catalog should expose at least one /products/:slug link").toMatch(/^\/products\/[^/]+$/)
    await productLink.click()
    await expect(page).toHaveURL(/\/products\/[^/]+$/)
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 60_000 })
    await page.waitForLoadState("networkidle").catch(() => {})
    await page.waitForTimeout(1500)

    const main = page.locator("#main-content")
    // PDP sizes live in the product aside; avoid any other "Size" region in the tree.
    const sizeGroup = main.locator("aside").getByRole("group", { name: /Size/i })
    await expect(sizeGroup).toBeVisible({ timeout: 30_000 })

    // `getPreferredDefaultSize` often pre-selects M — clicking M again toggles selection off.
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

    const addToBag = main.locator("button.cta-clay").filter({ hasText: /Add to Bag/i }).first()
    await expect(addToBag).toBeVisible({ timeout: 30_000 })
    await addToBag.scrollIntoViewIfNeeded()
    await addToBag.click()

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

    const miniCart = page.getByRole("dialog", { name: /added to bag|item added/i })
    try {
      await miniCart.waitFor({ state: "visible", timeout: 8000 })
      await miniCart.getByRole("button", { name: /^Close$/i }).click()
      await expect(miniCart).toBeHidden({ timeout: 8000 })
    } catch {
      /* Drawer is optional if state batching delayed open. */
    }

    await page.goto("/cart", { waitUntil: "domcontentloaded" })
    await expect(page.getByRole("heading", { level: 1, name: /Your cart/i })).toBeVisible({ timeout: 30_000 })
    await expect(page.locator("article.cart-item").first()).toBeVisible({ timeout: 60_000 })

    await page.goto("/checkout", { waitUntil: "domcontentloaded" })
    const checkoutMain = page.locator("#main-content")
    await expect(checkoutMain.getByText(/Loading checkout/i)).toBeHidden({ timeout: 120_000 })
    try {
      await expect(page.locator("#email")).toBeVisible({ timeout: 30_000 })
    } catch {
      const excerpt = (await checkoutMain.innerText()).replace(/\s+/g, " ").trim().slice(0, 500)
      throw new Error(
        `Checkout did not show #email (Medusa must be reachable from the browser, not only from Node). Excerpt: ${excerpt}`,
      )
    }
    await expect(page.locator("#phone")).toBeVisible()
  })
})
