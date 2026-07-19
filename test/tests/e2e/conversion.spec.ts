import { test, expect } from "@playwright/test";

test.describe("Currency Exchange Flow", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("http://localhost:5173/");
    });

    test("should execute successful direct conversion", async ({ page }) => {
        await page.locator('input[type="number"]').fill("100");

        await page.locator("select").first().selectOption("USD");
        await page.locator("select").nth(1).selectOption("THB");

        const receiveInput = page.locator('input[type="text"]');

        await expect(receiveInput).not.toHaveValue("0.0000");

        await expect(page.getByText(/Rate:/)).toBeVisible();

        await page.getByRole("button", {
            name: "Execute Exchange",
        }).click();

        await expect(page).toHaveURL(/\/payment/);
    });

    test("should execute bridge conversion successfully", async ({ page }) => {
        await page.locator('input[type="number"]').fill("100");

        const fromSelect = page.locator("select").first();
        const toSelect = page.locator("select").nth(1);
        const receiveInput = page.locator('input[type="text"]');

        await expect(fromSelect.locator("option")).not.toHaveCount(0);

        await fromSelect.selectOption("JPY");

        await expect(
            toSelect.locator('option[value="MMK"]')
        ).toHaveCount(1);

        await toSelect.selectOption("MMK");

        await expect(receiveInput).not.toHaveValue("0.0000");

        await page.getByRole("button", {
            name: "Execute Exchange",
        }).click();

        await expect(page).toHaveURL(/\/payment/);

        await expect(page.getByRole("heading", { name: /payment/i })).toBeVisible();
    });

    test("should recalculate conversion when currencies change", async ({ page }) => {
        await page.locator('input[type="number"]').fill("100");

        const fromSelect = page.locator("select").first();
        const toSelect = page.locator("select").nth(1);
        const receiveInput = page.locator('input[type="text"]');

        await expect(fromSelect.locator("option")).not.toHaveCount(0);

        await fromSelect.selectOption("USD");

        await expect(toSelect.locator('option[value="THB"]')).toHaveCount(1);

        await toSelect.selectOption("THB");

        await expect(receiveInput).not.toHaveValue("0.0000");

        const firstResult = await receiveInput.inputValue();

        await expect(toSelect.locator('option[value="JPY"]')).toHaveCount(1);

        await toSelect.selectOption("JPY");

        await expect(receiveInput).not.toHaveValue(firstResult);

        const secondResult = await receiveInput.inputValue();

        expect(secondResult).not.toBe(firstResult);
    });

    test("should navigate to payment page and display transaction details", async ({ page }) => {
        await page.locator('input[type="number"]').fill("100");

        const fromSelect = page.locator("select").first();
        const toSelect = page.locator("select").nth(1);

        await expect(fromSelect.locator("option")).not.toHaveCount(0);

        await fromSelect.selectOption("USD");

        await expect(toSelect.locator('option[value="THB"]')).toHaveCount(1);

        await toSelect.selectOption("THB");

        await page.getByRole("button", {name: "Execute Exchange"}).click();

        await expect(page).toHaveURL(/\/payment/);

        await expect(page.getByRole("heading", { name: /payment/i })).toBeVisible();

        await expect(page.locator("body")).toContainText("USD");
        await expect(page.locator("body")).toContainText("THB");

        await expect(page.locator("body")).toContainText("100");
    });
});