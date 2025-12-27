import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Visual Regression Tests', () => {
  const pages = [
    { path: '/', name: 'Home Page' },
    { path: '/auth', name: 'Auth Page' },
    { path: '/emergency', name: 'Emergency Page' },
    { path: '/doctors', name: 'Doctors Page' },
    { path: '/hospitals', name: 'Hospitals Page' },
    { path: '/appointments', name: 'Appointments Page' },
    { path: '/medical-history', name: 'Medical History Page' },
    { path: '/medications', name: 'Medications Page' },
    { path: '/symptom-tracker', name: 'Symptom Tracker Page' },
    { path: '/health-resources', name: 'Health Resources Page' },
  ];

  for (const pageInfo of pages) {
    test(`should match snapshot for ${pageInfo.name}`, async ({ page }) => {
      await page.goto(pageInfo.path);
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Take Percy snapshot at different viewports
      await percySnapshot(page, `${pageInfo.name} - Desktop`, {
        widths: [1280],
      });
      
      await page.setViewportSize({ width: 768, height: 1024 });
      await percySnapshot(page, `${pageInfo.name} - Tablet`, {
        widths: [768],
      });
      
      await page.setViewportSize({ width: 375, height: 667 });
      await percySnapshot(page, `${pageInfo.name} - Mobile`, {
        widths: [375],
      });
    });
  }

  test('should capture dark mode snapshots', async ({ page }) => {
    await page.goto('/');
    
    // Enable dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // Take snapshot
    await percySnapshot(page, 'Home Page - Dark Mode');
  });

  test('should capture component states', async ({ page }) => {
    await page.goto('/');
    
    // Hover state
    const button = page.getByRole('button').first();
    await button.hover();
    await percySnapshot(page, 'Button - Hover State');
    
    // Focus state
    await button.focus();
    await percySnapshot(page, 'Button - Focus State');
  });
});
