import { expect, test } from "@playwright/test"

test.describe("storefront smoke", () => {
  test("home responds and shows shell", async ({ page }) => {
    const res = await page.goto("/")
    expect(res?.ok()).toBeTruthy()
    await expect(page.locator("body")).toBeVisible()
    await expect(page.locator("#main-content")).toBeVisible({ timeout: 30_000 })
  })

  test("about page loads", async ({ page }) => {
    const res = await page.goto("/about")
    expect(res?.ok()).toBeTruthy()
    await expect(page.locator("body")).toBeVisible()
    await expect(page.locator("main, [role='main'], article").first()).toBeVisible({ timeout: 30_000 })
  })
})
