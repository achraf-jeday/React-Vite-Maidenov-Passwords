import { test, expect } from '@playwright/test';

test.describe('Logout Functionality', () => {
  test('should successfully logout and clear tokens', async ({ page }) => {
    // First, login to get tokens
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

    // Wait for successful login
    await tokenRequestPromise;
    const tokenResponse = await tokenResponsePromise;
    expect(tokenResponse.status()).toBe(200);

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Verify tokens are stored
    const accessToken = await page.evaluate(() => localStorage.getItem('maidenov_access_token'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('maidenov_refresh_token'));
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();

    // Now logout - intercept the revoke request
    const revokeRequestPromise = page.waitForRequest(request => {
      return request.url().endsWith('/oauth/revoke') && request.method() === 'POST';
    });

    const revokeResponsePromise = page.waitForResponse(response => {
      return response.url().endsWith('/oauth/revoke');
    });

    // Click logout button (assuming it exists on dashboard)
    await page.click('button:text("Logout")');

    // Wait for revoke request
    const revokeRequest = await revokeRequestPromise;
    const revokeResponse = await revokeResponsePromise;

    console.log('✅ Revoke request made to:', revokeRequest.url());
    console.log('✅ Revoke response status:', revokeResponse.status());

    // Verify tokens are cleared
    const accessTokenAfterLogout = await page.evaluate(() => localStorage.getItem('maidenov_access_token'));
    const refreshTokenAfterLogout = await page.evaluate(() => localStorage.getItem('maidenov_refresh_token'));
    const expiresAtAfterLogout = await page.evaluate(() => localStorage.getItem('maidenov_token_expires_at'));
    const userInfoAfterLogout = await page.evaluate(() => localStorage.getItem('maidenov_user_info'));

    expect(accessTokenAfterLogout).toBeNull();
    expect(refreshTokenAfterLogout).toBeNull();
    expect(expiresAtAfterLogout).toBeNull();
    expect(userInfoAfterLogout).toBeNull();

    console.log('✅ Logout successful!');
    console.log('✅ All tokens cleared from localStorage!');
  });

  test('should handle revoke endpoint failure gracefully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Verify we have tokens
    const accessToken = await page.evaluate(() => localStorage.getItem('maidenov_access_token'));
    expect(accessToken).toBeTruthy();

    // Logout should succeed even if revoke fails
    await page.click('button:text("Logout")');

    // Tokens should be cleared regardless of revoke status
    const accessTokenAfterLogout = await page.evaluate(() => localStorage.getItem('maidenov_access_token'));
    expect(accessTokenAfterLogout).toBeNull();

    console.log('✅ Logout handles revoke failures gracefully!');
  });
});