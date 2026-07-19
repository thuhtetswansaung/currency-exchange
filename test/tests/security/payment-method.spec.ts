import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173/admin";

test.describe("Payment Security", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}`);

    await page.locator('input[name="email"]').fill("admin@gmail.com");
    await page.locator('input[name="password"]').fill("admin123");

    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL(/dashboard/i);

    await page.goto(`${BASE_URL}/payments`);
  });

  test("should reject XSS in account name", async ({ page }) => {

    await page.getByRole("button", { name: /add payment/i }).first().click();

    await expect(
      page.getByRole("heading", { name: /add payment method/i })
    ).toBeVisible();

    await page.locator("select").selectOption({ index: 1 });

    await page
      .getByPlaceholder(/account name/i)
      .fill("<script>alert('XSS')</script>");

    await page.getByPlaceholder(/account number/i).fill("111111");
    await page.getByPlaceholder(/bank provider/i).fill("Bank");

    await page
      .locator('input[type="file"]')
      .setInputFiles("tests/assets/qr.png");

    await page.getByTestId("submit-add-payment").click();
  });

  test("should reject XSS in bank provider", async ({ page }) => {

    await page.getByRole("button", { name: /add payment/i }).first().click();

    await expect(
        page.getByRole("heading", { name: /add payment method/i })
    ).toBeVisible();

    await page.locator("select").selectOption({ index: 1 });

    await page
        .getByPlaceholder(/account name/i)
        .fill("Playwright");

    await page
        .getByPlaceholder(/account number/i)
        .fill("111111");

    await page
        .getByPlaceholder(/bank provider/i)
        .fill("<img src=x onerror=alert(1)>");

    await page
        .locator('input[type="file"]')
        .setInputFiles("tests/assets/qr.png");

    await page.getByTestId("submit-add-payment").click();
});

  test("should resist SQL injection in search", async ({ page }) => {
    await page
      .getByPlaceholder(/search payment/i)
      .fill("' OR 1=1 --");

    await page.waitForTimeout(500);

    await expect(page.locator("table")).toBeVisible();
  });

  test("should reject oversized input", async ({ page }) => {
    await page.getByRole("button", { name: /add payment/i }).first().click();

    await expect(
        page.getByRole("heading", { name: /add payment method/i })
    ).toBeVisible();

    await page.locator("select").selectOption({ index: 1 });

    await page
        .getByPlaceholder(/account name/i)
        .fill("A".repeat(10000));

    await page
        .getByPlaceholder(/account number/i)
        .fill("123");

    await page
        .getByPlaceholder(/bank provider/i)
        .fill("Bank");

    await page
        .locator('input[type="file"]')
        .setInputFiles("tests/assets/qr.png");


    await page.getByTestId("submit-add-payment").click();


    // Application should not crash
    await expect(page.locator("body")).toBeVisible();
});
});