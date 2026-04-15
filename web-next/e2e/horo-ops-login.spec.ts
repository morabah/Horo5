import { expect, test } from "@playwright/test";

test.describe("horo ops internal", () => {
  test("login page loads for staff sign-in", async ({ page }) => {
    const res = await page.goto("/internal/horo-ops/login");
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: /HORO ops sign-in/i })).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });
});
