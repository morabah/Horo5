import { expect, test } from "@playwright/test"
import { expectMainShell } from "./fixtures"

const mainRoutes = [
  { path: "/", name: "home" },
  { path: "/about", name: "about" },
  { path: "/feelings", name: "feelings hub" },
  { path: "/occasions", name: "occasions hub" },
  { path: "/search", name: "search" },
  { path: "/products", name: "shop all" },
  { path: "/cart", name: "cart" },
] as const

test.describe("storefront browse (HTTP 200 + shell)", () => {
  for (const { path, name } of mainRoutes) {
    test(`${name}: ${path}`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" })
      expect(res?.ok(), `${path} should return 2xx`).toBeTruthy()
      await expectMainShell(page)
    })
  }

  test("checkout route loads shell (empty bag is ok)", async ({ page }) => {
    const res = await page.goto("/checkout", { waitUntil: "domcontentloaded" })
    expect(res?.ok()).toBeTruthy()
    await expect(page.locator("body")).toBeVisible()
    await expect(page.getByText(/Loading checkout|Nothing to check out|Your bag is empty/i).first()).toBeVisible({
      timeout: 90_000,
    })
  })
})
