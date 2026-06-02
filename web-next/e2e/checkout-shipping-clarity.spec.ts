import { expect, test } from "@playwright/test"
import { expectMainShell } from "./fixtures"

/**
 * Guards hidden-cost clarity on cart and checkout.
 * Requires Medusa + catalog. Skip webserver if already running.
 */

test.describe("checkout shipping clarity", () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.get("/api/storefront/catalog")
    test.skip(!res.ok(), "Storefront catalog unavailable")
  })

  test("cart shows governorate prompt before selection", async ({ page }) => {
    const catalogRes = await page.request.get("/api/storefront/catalog")
    test.skip(!catalogRes.ok(), "catalog unavailable")
    const catalog = (await catalogRes.json()) as {
      products?: Array<{
        slug?: string
        variantsBySize?: Record<string, { id?: string; available?: boolean }>
      }>
    }
    const product = catalog.products?.find((p) => {
      const v = p.variantsBySize?.M ?? p.variantsBySize?.L
      return p.slug && v?.id && v.available !== false
    })
    test.skip(!product?.slug, "no seeded product")

    const variant = product!.variantsBySize!.M ?? product!.variantsBySize!.L!
    await page.addInitScript(
      ([line]) => {
        localStorage.setItem(
          "horo-cart-v1",
          JSON.stringify([
            {
              productSlug: line.slug,
              size: line.size,
              qty: 1,
              variantId: line.variantId,
              productName: line.name,
            },
          ]),
        )
        localStorage.removeItem("horo-medusa-cart-id-v1")
      },
      [
        {
          slug: product!.slug,
          size: "M" in (product!.variantsBySize ?? {}) ? "M" : "L",
          variantId: variant.id,
          name: product!.slug,
        },
      ],
    )

    await page.goto("/cart")
    await expectMainShell(page)
    await expect(page.getByText(/Choose your governorate to see shipping/i)).toBeVisible()
    await page.getByRole("button", { name: /Choose governorate/i }).click()
    await page.getByRole("button", { name: /Cairo/i }).first().click()
    await expect(page.getByTestId("cart-shipping-basis")).toContainText(/Delivery to/i)
    const shippingRow = page.locator(".cart-summary-row--meta").filter({ hasText: /shipping/i })
    await expect(shippingRow).not.toContainText("—")
  })

  test("checkout mobile sticky shows cost breakdown line", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/checkout")
    await expectMainShell(page)
    const sticky = page.locator(".fixed.inset-x-0.bottom-0")
    await expect(sticky).toBeVisible()
    await expect(sticky).toContainText(/EGP|shipping|address/i)
  })
})
