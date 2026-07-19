import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173/admin";

test.describe("Payment Management", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE_URL}`);

        await page.locator('input[name="email"]').fill("admin@gmail.com");
        await page.locator('input[name="password"]').fill("admin123");

        await page.getByRole("button", { name: /Sign In/i }).click();

        await page.waitForURL(/dashboard/i);

        await page.goto(`${BASE_URL}/payments`);

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

    test("should display payment page", async ({ page }) => {

        await page.goto(`${BASE_URL}/payments`);

        await expect(
            page.getByRole("heading", { name: /payment methods/i })
        ).toBeVisible();
    });

    test("should search payment", async ({ page }) => {
        await page.getByPlaceholder(/search payment/i).fill("USD");

        await page.waitForTimeout(500);

        await expect(page.locator("table")).toContainText("USD");
    });

    test("should switch archived tab", async ({ page }) => {
        await page.getByRole("button", { name: /archived/i }).click();

        await expect(
            page.getByRole("button", { name: /archived/i })
        ).toBeVisible();
    });

    test("should open add payment modal", async ({ page }) => {
        await page.getByRole("button", { name: /add payment/i }).click();

        await expect(
            page.getByRole("heading", { name: /add payment method/i })
        ).toBeVisible();
    });

    test("should close add payment modal", async ({ page }) => {
        await page.getByRole("button", { name: /add payment/i }).click();

        await page.getByRole("button", { name: /cancel/i }).click();

        await expect(
            page.getByRole("heading", { name: /add payment method/i })
        ).not.toBeVisible();
    });

    test("should disable add payment submit button when empty", async ({ page }) => {

        await page
            .getByRole("button", { name: /Add Payment/i })
            .first()
            .click();

        const submitButton = page
            .getByRole("button", { name: /Add Payment/i })
            .last();

        await expect(submitButton).toBeDisabled();

    });

    test("should open update payment modal", async ({ page }) => {
        await page.locator("tbody button").first().click();

        await expect(
            page.getByRole("heading", { name: /update payment method/i })
        ).toBeVisible();
    });

    test("should update payment", async ({ page }) => {
        await page.locator("tbody button").first().click();

        const newName = `Updated Account ${Date.now()}`;

        await page
            .getByPlaceholder(/account name/i)
            .fill(newName);

        await expect(
            page.getByRole("button", { name: /update payment/i })
        ).toBeEnabled();

        await page
            .getByRole("button", { name: /update payment/i })
            .click();

        await page.getByRole("button", { name: /^yes$/i }).click();

        await expect(page.locator("table")).toContainText(newName);
    });
});