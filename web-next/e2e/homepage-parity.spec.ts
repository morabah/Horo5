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

      const foundingCards = page.locator(".home-founding-card__image, .home-founding-grid .product-card img")
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

  test("editorial feature and service proof sections render", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await expect(page.locator("#editorial-feature")).toBeVisible({ timeout: 30_000 })
    await expect(page.locator("#size-help")).toBeVisible({ timeout: 30_000 })
  })

  test("founding secondary CTA targets editorial anchor", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" })
    const closerLook = page
      .locator("#founding-drop-campaign, #founding-drop")
      .getByRole("link", { name: /a closer look/i })
      .first()
    await expect(closerLook).toBeVisible({ timeout: 30_000 })
    const href = await closerLook.getAttribute("href")
    expect(href ?? "").toMatch(/editorial-feature/)
    await closerLook.click()
    await expect(page.locator("#editorial-feature")).toBeInViewport({ timeout: 10_000 })
  })

  test("mobile campaigns expose one heading per block", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/", { waitUntil: "networkidle" })
    await page.locator(".home-image-campaign").first().waitFor({ state: "visible", timeout: 30_000 })

    const campaigns = page.locator(".home-image-campaign")
    const campaignCount = await campaigns.count()
    expect(campaignCount).toBeGreaterThan(0)

    for (let i = 0; i < campaignCount; i += 1) {
      const block = campaigns.nth(i)
      await expect(block.getByRole("heading")).toHaveCount(1)
    }

  })
})
