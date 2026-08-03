import { test, expect } from "@playwright/test";

test.describe("Expense filters", () => {
  test("filters by category and clears", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Amount").fill("10.00");
    await page.getByLabel("Date").fill("2026-08-10");
    await page.locator("#expense-category").selectOption({ label: "Food" });
    await page.getByRole("button", { name: "Add expense" }).click();
    await expect(page.getByRole("table")).toBeVisible();

    await page.getByLabel("Amount").fill("20.00");
    await page.getByLabel("Date").fill("2026-08-11");
    await page
      .locator("#expense-category")
      .selectOption({ label: "Transport" });
    await page.getByRole("button", { name: "Add expense" }).click();

    await expect(
      page.getByRole("row").filter({ hasText: "Food" }),
    ).toBeVisible();
    await expect(
      page.getByRole("row").filter({ hasText: "Transport" }),
    ).toBeVisible();

    await page.locator("#filter-category").selectOption({ label: "Transport" });
    await expect(
      page.getByRole("row").filter({ hasText: "Transport" }),
    ).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "Food" })).toHaveCount(
      0,
    );

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(
      page.getByRole("row").filter({ hasText: "Food" }),
    ).toBeVisible();
  });
});
