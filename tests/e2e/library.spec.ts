import { test, expect } from '@playwright/test';

test.describe('Library', () => {
    test('library page is accessible', async ({ page }) => {
        await page.goto('/library');

        // Wait for page to load
        await expect(page.locator('body')).toBeVisible();
    });

    test('can navigate to library from home', async ({ page }) => {
        await page.goto('/');

        // Find and click library link
        const libraryLink = page.getByRole('link', { name: /library/i });

        if (await libraryLink.count() > 0) {
            await libraryLink.click();
            await expect(page).toHaveURL(/library/);
        }
    });
});
