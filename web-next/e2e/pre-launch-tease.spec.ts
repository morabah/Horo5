import { expect, test } from "@playwright/test"

test.describe("pre-launch tease mode", () => {
  test("tease hero renders headline and waitlist input, no product cards", async ({ page }) => {
    await page.goto("/")

    const teaseHero = page.locator("#pre-launch-tease-hero")
    if (await teaseHero.isHidden().catch(() => true)) {
      test.skip()
      return
    }

    // Hero headline visible
    await expect(page.locator('h2:has-text("Art is coming to your wardrobe")')).toBeVisible()

    // Waitlist email input present
    await expect(page.locator('input[type="email"]')).toBeVisible()

    // No product cards in DOM
    const productCards = await page.locator('[data-testid="product-card"]').count()
    expect(productCards).toBe(0)

    // No "Shop All" or product grid headings
    await expect(page.locator('text=Shop All')).not.toBeVisible()
  })
})
