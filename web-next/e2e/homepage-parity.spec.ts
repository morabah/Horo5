import { expect, test } from "@playwright/test"
import { expectMainShell } from "./fixtures"

const VIEWPORTS = [
  { width: 390, height: 844, name: "mobile" },
  { width: 768, height: 1024, name: "tablet" },
  { width: 1440, height: 900, name: "desktop" },
] as const

test.describe("homepage parity (visual baseline)", () => {
  for (const viewport of VIEWPORTS) {
    test(`home @ ${viewport.name} (${viewport.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      const res = await page.goto("/", { waitUntil: "domcontentloaded" })
      expect(res?.ok(), "home should return 2xx").toBeTruthy()
      await expectMainShell(page)

      const foundingCards = page.locator(".home-founding-card__image, .home-founding-rail .product-card img")
      const count = await foundingCards.count()
      if (count > 0) {
        await expect(foundingCards.first()).toBeVisible({ timeout: 30_000 })
        const firstSrc = await foundingCards.first().getAttribute("src")
        expect(firstSrc ?? "", "founding card should have an image src").not.toEqual("")
        expect(firstSrc?.toLowerCase() ?? "").not.toMatch(/back-view|backview|_back|-back\./)
      }

      await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.04,
      })
    })
  }

  test("founding drop section is present with shop CTA", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await expect(page.getByRole("link", { name: /shop the founding drop/i }).first()).toBeVisible({
      timeout: 30_000,
    })
  })
})
