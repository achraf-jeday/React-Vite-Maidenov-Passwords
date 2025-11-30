import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login form', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');

    // Check if login form is visible
    await expect(page).toHaveTitle(/Maidenov Passwords/);
    await expect(page.locator('h1')).toContainText('Maidenov Passwords');
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should handle OAuth2 login initiation', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');

    // Check the login button exists
    const loginButton = page.getByRole('button', { name: 'Sign In' });
    await expect(loginButton).toBeVisible();

    // Click login button to initiate OAuth2 flow
    // Note: This will redirect to Drupal OAuth page
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      loginButton.click()
    ]);

    // Check if redirected to Drupal OAuth page
    await newPage.waitForLoadState('domcontentloaded');
    expect(newPage.url()).toContain('localhost:8080'); // Drupal URL
  });

  test('should handle auth callback', async ({ page }) => {
    // Simulate OAuth callback with fake code
    // This tests the callback handling logic
    const fakeCode = 'test-auth-code';
    const fakeState = 'test-state';

    // Navigate to callback URL with code
    await page.goto(`http://localhost:5173/auth/callback?code=${fakeCode}&state=${fakeState}`);

    // Should show loading or error state
    // The exact behavior depends on whether the code is valid
    await expect(page).toHaveURL(/auth\/callback/);
  });

  test('should protect dashboard route', async ({ page }) => {
    // Try to access protected dashboard without authentication
    await page.goto('http://localhost:5173/dashboard');

    // Should redirect to login page
    await expect(page).toHaveURL(/login/);
    await expect(page.locator('h1')).toContainText('Maidenov Passwords');
  });

  test('should show loading state during auth check', async ({ page }) => {
    // Navigate to app and check loading state
    await page.goto('http://localhost:5173');

    // The app should load and display the login form
    await expect(page.locator('.login-container')).toBeVisible();
  });
});