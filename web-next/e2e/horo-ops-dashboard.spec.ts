import { expect, test } from "@playwright/test";

test.describe("horo ops dashboard", () => {
  test("unauthenticated visit redirects to login (dashboard requires session)", async ({ page }) => {
    await page.goto("/internal/horo-ops");
    await expect(page).toHaveURL(/\/internal\/horo-ops\/login/);
    await expect(page.getByRole("heading", { name: /HORO ops sign-in/i })).toBeVisible();
  });
});
