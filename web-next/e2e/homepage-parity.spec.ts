import { expect, test, type Page } from "@playwright/test"
import { expectMainShell } from "./fixtures"

const VIEWPORTS = [
  { width: 390, height: 844, name: "mobile" },
  { width: 768, height: 1024, name: "tablet" },
  { width: 1440, height: 900, name: "desktop" },
] as const

async function loadHomepageLazyMedia(page: Page) {
  for (const selector of ["#editorial-feature img", "#gift-by-meaning img", "#our-story img"]) {
    const image = page.locator(selector).first()
    if ((await image.count()) === 0) continue
    await image.scrollIntoViewIfNeeded().catch(() => {})
    await expect(image).toBeVisible({ timeout: 10_000 }).catch(() => {})
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(150)
}

test.describe("homepage parity (visual baseline)", () => {
  for (const viewport of VIEWPORTS) {
    test(`home @ ${viewport.name} (${viewport.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.emulateMedia({ reducedMotion: "reduce" })
      const res = await page.goto("/", { waitUntil: "domcontentloaded" })
      expect(res?.ok(), "home should return 2xx").toBeTruthy()
      await expectMainShell(page)

      const hero = page.locator("#home-hero")
      if ((await hero.count()) > 0) {
        await expect(hero).toBeVisible({ timeout: 30_000 })
        await expect(hero.locator("img").first()).toBeVisible({ timeout: 30_000 })
        const heroPrimaryCta = hero.locator(".home-hero--cinematic__actions a, .home-image-campaign__content a.home-btn--primary").first()
        await expect(heroPrimaryCta).toBeVisible({ timeout: 30_000 })
        const heroBox = await heroPrimaryCta.boundingBox()
        expect(heroBox?.y ?? 9999).toBeLessThan(viewport.height)
      }

      const foundingCards = page.locator(".home-founding-card__image, .home-founding-grid .product-card img")
      const count = await foundingCards.count()
      if (count > 0) {
        await expect(foundingCards.first()).toBeVisible({ timeout: 30_000 })
        const firstSrc = await foundingCards.first().getAttribute("src")
        expect(firstSrc ?? "", "founding card should have an image src").not.toEqual("")
        expect(firstSrc?.toLowerCase() ?? "").not.toMatch(/back-view|backview|_back|-back\./)
      }

      await loadHomepageLazyMedia(page)

      await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.04,
      })
    })
  }

  test("founding drop section is present with shop CTA", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await expect(page.locator("#founding-drop")).toBeVisible({ timeout: 30_000 })
    await expect(page.locator("#founding-drop").getByRole("link", { name: /shop the drop/i }).first()).toBeVisible({
      timeout: 30_000,
    })
  })

  test("editorial feature and service proof sections render", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await expect(page.locator("#editorial-feature")).toBeVisible({ timeout: 30_000 })
    await expect(page.locator("#size-help")).toBeVisible({ timeout: 30_000 })
  })

  test("hero exposes primary and secondary CTAs", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/", { waitUntil: "networkidle" })
    const hero = page.locator("#home-hero")
    await expect(hero).toBeVisible({ timeout: 30_000 })
    await expect(hero.getByRole("link", { name: /shop the drop/i }).first()).toBeVisible({ timeout: 30_000 })

    const editorialCta = hero.getByRole("link", { name: /see the details|a closer look/i })
    if ((await editorialCta.count()) > 0) {
      const href = await editorialCta.first().getAttribute("href")
      expect(href ?? "").toMatch(/editorial-feature/)
      await editorialCta.first().click()
      await expect(page.locator("#editorial-feature")).toBeInViewport({ timeout: 10_000 })
      return
    }

    const heroActions = hero.locator(".home-hero--cinematic__actions a, .home-image-campaign__actions a")
    await expect(heroActions.nth(1)).toBeVisible({ timeout: 30_000 })
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
