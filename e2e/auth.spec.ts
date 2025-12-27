import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Authentication Flow', () => {
  test('should display auth page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to auth page
    await expect(page).toHaveURL(/.*auth/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    
    // Take Percy snapshot
    await percySnapshot(page, 'Auth Page - Sign In');
  });

  test('should toggle between sign in and sign up', async ({ page }) => {
    await page.goto('/auth');
    
    // Should start on sign in
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    
    // Click to switch to sign up
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    
    // Take Percy snapshot
    await percySnapshot(page, 'Auth Page - Sign Up');
    
    // Switch back to sign in
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/auth');
    
    // Try to submit empty form
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Should show validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/auth');
    
    // Enter invalid email
    await page.getByPlaceholder(/email/i).fill('invalid-email');
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });
});
