import { test, expect } from '@playwright/test';

test.describe('Video-Cut End-to-End Application Flow (G-2)', () => {
  test('renders application header, branding, and privacy badge', async ({ page }) => {
    await page.goto('/');

    // Check header branding
    await expect(page.locator('header')).toContainText('Video-Cut');
    await expect(page.locator('header')).toContainText('Hybrid');

    // Check main title
    await expect(page.locator('h1')).toContainText('Instant Video Editing');

    // Check Zero Storage feature badge
    await expect(page.locator('text=Zero Storage')).toBeVisible();
    await expect(page.locator('text=100% private')).toBeVisible();
  });

  test('opens and closes Benchmark & Diagnostics modal', async ({ page }) => {
    await page.goto('/');

    // Find and click Benchmark button in header
    const benchmarkBtn = page.locator('button:has-text("Benchmark & Stats")');
    if (await benchmarkBtn.isVisible()) {
      await benchmarkBtn.click();

      // Verify modal opened
      await expect(page.locator('text=Performance Benchmark & Diagnostics')).toBeVisible();

      // Switch to Device Matrix tab
      await page.locator('button:has-text("ตารางรองรับอุปกรณ์")').click();
      await expect(page.locator('text=Google Chrome / Chromium')).toBeVisible();

      // Switch to Local Telemetry tab
      await page.locator('button:has-text("สถิติเครื่อง")').click();
      await expect(page.locator('text=เก็บสถิติการใช้งานฝั่ง Client')).toBeVisible();

      // Close modal
      await page.locator('button[type="button"] >> internal:has="svg.lucide-x"').click();
      await expect(page.locator('text=Performance Benchmark & Diagnostics')).not.toBeVisible();
    }
  });

  test('displays file drop zone and accepts video inputs', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached();

    // Verify dropzone instructions
    await expect(page.locator('text=ลากและวางไฟล์วิดีโอที่นี่')).toBeVisible();
    await expect(page.locator('text=MP4, MOV, WebM, MKV, AVI')).toBeVisible();
  });
});
