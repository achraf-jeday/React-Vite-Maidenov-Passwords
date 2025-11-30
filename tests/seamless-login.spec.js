import { test, expect } from '@playwright/test';

test.describe('Seamless Login Flow (ROPC)', () => {
  test('should display login form', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');

    // Check if login form is visible
    await expect(page).toHaveTitle(/Maidenov is Awesome/);
    await expect(page.locator('h1')).toContainText('Maidenov Passwords');
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should handle login with valid credentials', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');

    // Fill in credentials
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin');

    // Intercept the network request to Drupal
    const responsePromise = page.waitForResponse('http://localhost:8080/oauth/token');

    // Click login button
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for the response
    const response = await responsePromise;

    // Should get a 200 response with tokens
    expect(response.status()).toBe(200);

    const responseData = await response.json();
    expect(responseData).toHaveProperty('access_token');
    expect(responseData).toHaveProperty('refresh_token');
    expect(responseData).toHaveProperty('token_type', 'Bearer');
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');

    // Fill in invalid credentials
    await page.getByLabel('Username').fill('invaliduser');
    await page.getByLabel('Password').fill('wrongpassword');

    // Intercept the network request to Drupal
    const responsePromise = page.waitForResponse('http://localhost:8080/oauth/token');

    // Click login button
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for the response
    const response = await responsePromise;

    // Should get a 400 response (invalid credentials)
    expect(response.status()).toBe(400);

    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
  });

  test('should protect dashboard route', async ({ page }) => {
    // Try to access protected dashboard without authentication
    await page.goto('http://localhost:5173/dashboard');

    // Should redirect to login page
    await expect(page).toHaveURL(/login/);
    await expect(page.locator('h1')).toContainText('Maidenov Passwords');
  });
});