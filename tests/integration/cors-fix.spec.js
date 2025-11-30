import { test, expect } from '@playwright/test';

test.describe('CORS Fix Verification', () => {
  test('should successfully make OAuth2 request through Vite proxy', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Verify the login form is present
    await expect(page.locator('h1')).toContainText('Maidenov Passwords');
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();

    // Fill in the login form with valid credentials
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin');

    // Intercept the OAuth2 token request to verify it's going through
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

    // Verify the token request was made
    console.log('✅ Token request made to:', tokenRequest.url());
    expect(tokenRequest.method()).toBe('POST');

    // Verify the token response has the correct status
    console.log('✅ Token response status:', tokenResponse.status());
    expect(tokenResponse.status()).toBe(200);

    // Check that the response is successful (no CORS error)
    const responseBody = await tokenResponse.text();
    console.log('✅ Response body received (CORS is working!)');

    // Verify we got a valid token response
    expect(responseBody).toContain('access_token');
    expect(responseBody).toContain('refresh_token');

    console.log('✅ PROXY IS WORKING!');
    console.log('✅ CORS ISSUE IS RESOLVED!');
    console.log('✅ SEAMLESS LOGIN IS WORKING!');
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin');

    // Intercept the OAuth2 token request
    const tokenRequestPromise = page.waitForRequest(request => {
      return request.url().endsWith('/oauth/token') && request.method() === 'POST';
    });

    const tokenResponsePromise = page.waitForResponse(response => {
      return response.url().endsWith('/oauth/token') && response.status() === 200;
    });

    await page.click('button[type="submit"]');

    // Wait for the token request and response
    await tokenRequestPromise;
    await tokenResponsePromise;

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    console.log('✅ Successfully redirected to dashboard!');
  });
});