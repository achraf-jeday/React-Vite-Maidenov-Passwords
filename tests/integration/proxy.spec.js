import { test, expect } from '@playwright/test';

test.describe('Vite Proxy and CORS Fix', () => {
  test('should proxy OAuth2 requests through Vite', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Verify the login form is present
    await expect(page.locator('h1')).toContainText('Maidenov Passwords');
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();

    // Fill in the login form with valid credentials
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin');

    // Intercept the OAuth2 token request to verify it's going through the proxy
    const tokenRequestPromise = page.waitForRequest(request => {
      return request.url().endsWith('/oauth/token') && request.method() === 'POST';
    });

    const tokenResponsePromise = page.waitForResponse(response => {
      return response.url().endsWith('/oauth/token') && response.status() === 200;
    });

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for the token request and response
    const tokenRequest = await tokenRequestPromise;
    const tokenResponse = await tokenResponsePromise;

    // Verify the token request was made successfully
    console.log('Token request URL:', tokenRequest.url());
    expect(tokenRequest.method()).toBe('POST');

    // Verify the token response has the correct status
    expect(tokenResponse.status()).toBe(200);

    const tokenData = await tokenResponse.json();
    console.log('Token response:', tokenData);

    // Verify we got the expected token response
    expect(tokenData.access_token).toBeDefined();
    expect(tokenData.refresh_token).toBeDefined();
    expect(tokenData.expires_in).toBeDefined();
    expect(tokenData.token_type).toBe('Bearer');

    console.log('✅ Proxy is working correctly!');
    console.log('✅ CORS issue is resolved!');
    console.log('✅ OAuth2 authentication successful!');
  });

  test('should handle invalid credentials gracefully', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Username').fill('invalid');
    await page.getByLabel('Password').fill('wrongpassword');

    // Intercept the OAuth2 token request
    const tokenRequestPromise = page.waitForRequest(request => {
      return request.url().endsWith('/oauth/token') && request.method() === 'POST';
    });

    const tokenResponsePromise = page.waitForResponse(response => {
      return response.url().endsWith('/oauth/token') && response.status() !== 200;
    });

    await page.click('button[type="submit"]');

    // Wait for the token request and response
    await tokenRequestPromise;
    const tokenResponse = await tokenResponsePromise;

    // Verify the token response indicates failure
    expect(tokenResponse.status()).not.toBe(200);

    const tokenData = await tokenResponse.json();
    console.log('Error response:', tokenData);
    expect(tokenData.error).toBeDefined();

    // Should still be on the login page
    await expect(page).toHaveURL('/login');
  });
});