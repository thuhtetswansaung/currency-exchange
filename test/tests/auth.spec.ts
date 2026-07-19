import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/admin');

    page.on('response', res => {
  if (res.url().includes('login')) {
    console.log('LOGIN RESPONSE:', res.status(), res.url());
  }
});
page.on('requestfailed', req => {
  console.log('REQUEST FAILED:', req.url(), req.failure()?.errorText);
});
page.on('console', msg => console.log('BROWSER:', msg.text()));
  });

  test('should login successfully', async ({ page }) => {
    await page.locator('input[name="email"]').fill('admin@gmail.com');
    await page.locator('input[name="password"]').fill('admin123');


    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/admin\/dashboard$/);
  });

  test('should show validation errors when fields are empty', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
     await page.locator('input[name="email"]').fill('wrong@gmail.com');
  await page.locator('input[name="password"]').fill('wrong');


    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText(/invalid credentials|incorrect|failed/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
  await page.goto('http://localhost:5173/admin');

  await page.locator('input[name="email"]').fill('admin@gmail.com');
  await page.locator('input[name="password"]').fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/admin\/dashboard/);

  await page.getByRole('button', { name: /logout/i }).click();

  await expect(page).toHaveURL(/admin$/);
});
});