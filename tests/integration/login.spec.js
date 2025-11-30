import { test, expect } from '@playwright/test';

test.describe('OAuth2 Login Integration', () => {
  test('should successfully login with valid credentials', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Verify the login form is present
    await expect(page.locator('h1')).toContainText('Maidenov Passwords');
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();

    // Fill in the login form
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin');

    // Intercept the OAuth2 token request
    const tokenRequestPromise = page.waitForRequest(request => {
      return request.url().includes('/oauth/token') && request.method() === 'POST';
    });

    const tokenResponsePromise = page.waitForResponse(response => {
      return response.url().includes('/oauth/token') && response.status() === 200;
    });

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for the token request and response
    const tokenRequest = await tokenRequestPromise;
    const tokenResponse = await tokenResponsePromise;

    // Verify the token request
    expect(tokenRequest.method()).toBe('POST');
    expect(tokenRequest.url()).toContain('/oauth/token');

    // Verify the token response
    expect(tokenResponse.status()).toBe(200);

    const tokenData = await tokenResponse.json();
    expect(tokenData.access_token).toBeDefined();
    expect(tokenData.refresh_token).toBeDefined();
    expect(tokenData.expires_in).toBeDefined();

    // Check for successful redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Verify tokens are stored in localStorage
    const accessToken = await page.evaluate(() => localStorage.getItem('maidenov_access_token'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('maidenov_refresh_token'));
    const expiresAt = await page.evaluate(() => localStorage.getItem('maidenov_token_expires_at'));

    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    expect(expiresAt).toBeTruthy();

    console.log('✅ Login successful!');
    console.log('Access token received:', !!accessToken);
    console.log('Refresh token received:', !!refreshToken);
    console.log('Token expires at:', new Date(parseInt(expiresAt)).toISOString());
  });

  test('should fail login with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Username').fill('invalid');
    await page.getByLabel('Password').fill('wrongpassword');

    // Intercept the OAuth2 token request
    const tokenRequestPromise = page.waitForRequest(request => {
      return request.url().includes('/oauth/token') && request.method() === 'POST';
    });

    const tokenResponsePromise = page.waitForResponse(response => {
      return response.url().includes('/oauth/token') && response.status() !== 200;
    });

    await page.click('button[type="submit"]');

    // Wait for the token request and response
    await tokenRequestPromise;
    const tokenResponse = await tokenResponsePromise;

    // Verify the token response indicates failure
    expect(tokenResponse.status()).not.toBe(200);

    const tokenData = await tokenResponse.json();
    expect(tokenData.error).toBeDefined();

    // Should still be on the login page
    await expect(page).toHaveURL('/login');
  });

  test('should show loading state during authentication', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin');

    // Click submit and check for loading state
    await page.click('button[type="submit"]');

    // Should show loading spinner and disable button
    await expect(page.locator('.spinner')).toBeVisible();
    await expect(page.locator('.login-button')).toBeDisabled();

    // Wait for completion
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 10000 });
  });
});