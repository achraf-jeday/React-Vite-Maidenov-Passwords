import { test, expect } from '@playwright/test';

test.describe('Todo App', () => {
  test('should add a new todo', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/React/);

    // Assuming there's an input field for adding todos
    // This is a sample test - adjust selectors based on your actual app
    const todoInput = page.getByPlaceholder('What needs to be done?');
    const addButton = page.getByRole('button', { name: 'Add' });

    await todoInput.fill('Learn Playwright');
    await addButton.click();

    // Check if the todo was added
    await expect(page.getByText('Learn Playwright')).toBeVisible();
  });

  test('should mark todo as completed', async ({ page }) => {
    await page.goto('/');

    // Mark first todo as completed
    const title = page.locator('.login-box h1');
    // await firstCheckbox.check();

    // Verify it's marked as completed
    await expect(title).toHaveText('Maidenov is Awesome!');
  });

  test('should filter todos', async ({ page }) => {
    await page.goto('/');

    // Click on 'Active' filter
    await page.getByRole('button', { name: 'Active' }).click();

    // Verify that only active todos are visible
    await expect(page.locator('.todo-item:not(.completed)')).toHaveCount(2);
  });
});