import { test, expect } from "@playwright/test";

test.describe("Admin Transactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/admin");


    await page.locator('input[name="email"]').fill("admin@gmail.com");
    await page.locator('input[name="password"]').fill("admin123");

    await page.getByRole("button", { name: /Sign In/i }).click();

    await page.waitForURL(/dashboard/);

    await page.goto("http://localhost:5173/admin/transactions");

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

  test("should render transactions page", async ({ page }) => {
    await expect(page.getByText("All Transactions")).toBeVisible();

    await expect(page.getByRole("columnheader", { name: "Pair" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Amount" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Converted" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "User IP" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Approved By" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Action" })).toBeVisible();
  });

  test("should render transaction rows", async ({ page }) => {
    const rows = page.locator("tbody tr");

    await expect(rows.first()).toBeVisible();
    await expect(rows).not.toHaveCount(0);
  });

  test("should search transactions", async ({ page }) => {
    const search = page.getByPlaceholder("Search transactions...");

    await search.fill("USD");

    await page.waitForTimeout(600); // debounce

    await expect(search).toHaveValue("USD");
  });

  test("should filter by status", async ({ page }) => {
    await page.locator("select").selectOption("completed");

    await expect(page.locator("select")).toHaveValue("completed");
  });

  test("should paginate", async ({ page }) => {
    const next = page.getByRole("button", { name: "Next" });

    if (await next.isEnabled()) {
      const before = await page.locator("text=Page").textContent();

      await next.click();

      await expect(page.locator("text=Page")).not.toHaveText(before ?? "");
    }
  });

  test("should navigate back to dashboard", async ({ page }) => {
    await page.getByRole("button", { name: /Back/i }).click();

    await expect(page).toHaveURL(/dashboard/);
  });

  test("should navigate to transaction detail", async ({ page }) => {
    const firstViewButton = page.locator("tbody tr a").first();

    await firstViewButton.click();

    await expect(page).toHaveURL(/admin\/transactions\/.+/);
  });

  test("should show empty state when no transaction matches search", async ({ page }) => {
    const search = page.getByPlaceholder("Search transactions...");

    await search.fill("thistransactiondoesnotexist");

    await page.waitForTimeout(600);

    await expect(page.getByText("No transactions found")).toBeVisible();
  });

  test("should disable previous button on first page", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Previous" })
    ).toBeDisabled();
  });

  test("should display page information", async ({ page }) => {
    await expect(page.getByText(/Page \d+ of \d+/)).toBeVisible();
  });
});