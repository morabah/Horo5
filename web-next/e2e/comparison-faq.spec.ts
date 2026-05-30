import { test, expect } from '@playwright/test';

test.describe('Comparison FAQ', () => {
  test('loads comparison page with table and shop CTAs', async ({ page }) => {
    await page.goto('/comparison');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Why HORO/i);
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('link', { name: /Shop the collection/i })).toBeVisible();
  });
});
