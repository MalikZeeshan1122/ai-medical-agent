import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Emergency Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/emergency');
  });

  test('should display critical symptoms information', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /critical symptoms/i })).toBeVisible();
    await expect(page.getByText(/chest pain/i)).toBeVisible();
    await expect(page.getByText(/difficulty breathing/i)).toBeVisible();
    
    // Take Percy snapshot
    await percySnapshot(page, 'Emergency Page - Critical Symptoms');
  });

  test('should display emergency contact numbers', async ({ page }) => {
    await expect(page.getByText(/911/i)).toBeVisible();
    
    // Take Percy snapshot
    await percySnapshot(page, 'Emergency Page - Contact Info');
  });

  test('should have accessible emergency information', async ({ page }) => {
    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Check for important links
    const links = await page.locator('a').all();
    expect(links.length).toBeGreaterThan(0);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await expect(page.getByRole('heading', { name: /emergency/i })).toBeVisible();
    
    // Take Percy snapshot
    await percySnapshot(page, 'Emergency Page - Mobile');
  });
});
