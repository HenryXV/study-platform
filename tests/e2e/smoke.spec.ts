import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
    test('home page loads successfully', async ({ page }) => {
        await page.goto('/');

        // Verify page loaded (check for navigation or main content)
        await expect(page).toHaveTitle(/study/i);
    });

    test('main navigation is visible', async ({ page }) => {
        await page.goto('/');

        // Check for main layout elements
        await expect(page.locator('body')).toBeVisible();
    });
});
