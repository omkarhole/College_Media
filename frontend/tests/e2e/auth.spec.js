/**
 * E2E Tests - Authentication
 * Issue #245: Testing Infrastructure - Playwright E2E
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication E2E', () => {
  test('should complete full login flow', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Click login button
    await page.click('text=Login');

    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Submit
    await page.click('button:has-text("Submit")');

    // Wait for redirect
    await expect(page).toHaveURL(/.*home/);

    // Verify logged in state
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should register new user', async ({ page }) => {
    await page.goto('http://localhost:5173/register');

    await page.fill('input[name="username"]', 'newuser');
    await page.fill('input[name="email"]', 'new@example.com');
    await page.fill('input[name="password"]', 'password123');

    await page.click('button:has-text("Register")');

    await expect(page).toHaveURL(/.*home/);
  });

  test('should handle logout', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173');
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Submit")');

    // Logout
    await page.click('[aria-label="Profile menu"]');
    await page.click('text=Logout');

    // Verify logged out
    await expect(page).toHaveURL(/.*login/);
  });
});
