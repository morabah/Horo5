import { expect, type Page } from "@playwright/test"

export { expect }

/** Main storefront shell from `StorefrontChrome`. */
export async function expectMainShell(page: Page) {
  await expect(page.locator("#main-content")).toBeVisible({ timeout: 60_000 })
}
