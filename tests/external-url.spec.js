import { test, expect } from '@playwright/test';

test.describe('External URL Testing', () => {
  test('should visit Google and perform a search', async ({ page }) => {
    // Navigate to external URL
    await page.goto('https://www.google.com/');

    // Verify the page loaded
    await expect(page).toHaveTitle(/Google/);

    // Check if search box exists
    const searchBox = page.locator('textarea[name="q"]');
    await expect(searchBox).toBeVisible();

    // Perform a search
    await searchBox.fill('Maidenov Passwords');
    await searchBox.press('Enter');

    // Wait for results
    await expect(page).toHaveTitle(/Maidenov Passwords/);

    // Verify search results appear
    const searchResults = page.locator('div#search');
    await expect(searchResults).toBeVisible();
  });

  test('should visit GitHub and check page elements', async ({ page }) => {
    // Navigate to GitHub
    await page.goto('https://github.com/');

    // Verify page loaded
    await expect(page).toHaveTitle(/GitHub/);

    // Check for sign up button
    const signUpButton = page.getByRole('button', { name: 'Sign up' });
    await expect(signUpButton).toBeVisible();
  });

  test('should handle external API endpoints', async ({ page }) => {
    // Test a public API
    await page.goto('https://jsonplaceholder.typicode.com/');

    // This is just a JSON placeholder, but you can test any API
    const response = await page.evaluate(async () => {
      const res = await fetch('https://jsonplaceholder.typicode.com/posts/1');
      return res.json();
    });

    expect(response).toHaveProperty('id', 1);
  });
});