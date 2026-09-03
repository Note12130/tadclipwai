import { test, expect } from '@playwright/test';

test.describe('App Shell & Headers', () => {
  test('loads home page and shows app title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ตัดคลิปไว/);
    await expect(page.locator('header')).toContainText('ตัดคลิปไว');
  });

  test('verifies privacy badge is displayed', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=ปลอดภัย 100%')).toBeVisible();
  });
});
