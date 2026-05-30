import { test, expect } from '@playwright/test';

test.describe('Drops hub', () => {
  test('loads drops index', async ({ page }) => {
    await page.goto('/drops');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/HORO drops/i);
  });
});
