import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Note: In real tests, you'd need to authenticate first
    await page.goto('/');
  });

  test('should navigate to emergency page', async ({ page }) => {
    await page.goto('/emergency');
    
    await expect(page).toHaveURL(/.*emergency/);
    await expect(page.getByRole('heading', { name: /emergency/i })).toBeVisible();
    
    // Take Percy snapshot
    await percySnapshot(page, 'Emergency Page');
  });

  test('should navigate to doctors page', async ({ page }) => {
    await page.goto('/doctors');
    
    await expect(page).toHaveURL(/.*doctors/);
    await expect(page.getByRole('heading', { name: /doctors/i })).toBeVisible();
    
    // Take Percy snapshot
    await percySnapshot(page, 'Doctors Page');
  });

  test('should navigate to hospitals page', async ({ page }) => {
    await page.goto('/hospitals');
    
    await expect(page).toHaveURL(/.*hospitals/);
    await expect(page.getByRole('heading', { name: /hospitals/i })).toBeVisible();
    
    // Take Percy snapshot
    await percySnapshot(page, 'Hospitals Page');
  });

  test('should navigate to appointments page', async ({ page }) => {
    await page.goto('/appointments');
    
    await expect(page).toHaveURL(/.*appointments/);
    
    // Take Percy snapshot
    await percySnapshot(page, 'Appointments Page');
  });

  test('should show 404 page for invalid routes', async ({ page }) => {
    await page.goto('/invalid-route-that-does-not-exist');
    
    await expect(page.getByText(/404/i)).toBeVisible();
    await expect(page.getByText(/page not found/i)).toBeVisible();
    
    // Take Percy snapshot
    await percySnapshot(page, '404 Page');
  });
});
