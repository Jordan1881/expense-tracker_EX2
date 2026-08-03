import { test, expect, type APIRequestContext } from "@playwright/test";

const API = "http://localhost:3001";

async function clearExpenses(request: APIRequestContext) {
  const res = await request.get(`${API}/api/expenses`);
  expect(res.ok()).toBeTruthy();
  const expenses = (await res.json()) as Array<{ id: string }>;
  for (const expense of expenses) {
    const del = await request.delete(`${API}/api/expenses/${expense.id}`);
    expect(del.ok()).toBeTruthy();
  }
}

test.describe("Expense filters", () => {
  test.beforeEach(async ({ request }) => {
    await clearExpenses(request);
  });

  test("filters by category and clears", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Amount").fill("10.00");
    await page.getByLabel("Date").fill("2026-08-10");
    await page.locator("#expense-category").selectOption({ label: "Food" });
    await page.getByLabel(/Note/).fill("FilterFood");
    await page.getByRole("button", { name: "Add expense" }).click();
    await expect(page.getByRole("table")).toBeVisible();

    await page.getByLabel("Amount").fill("20.00");
    await page.getByLabel("Date").fill("2026-08-11");
    await page
      .locator("#expense-category")
      .selectOption({ label: "Transport" });
    await page.getByLabel(/Note/).fill("FilterTransport");
    await page.getByRole("button", { name: "Add expense" }).click();

    await expect(
      page.getByRole("row").filter({ hasText: "FilterFood" }),
    ).toBeVisible();
    await expect(
      page.getByRole("row").filter({ hasText: "FilterTransport" }),
    ).toBeVisible();

    await page.locator("#filter-category").selectOption({ label: "Transport" });
    await expect(
      page.getByRole("row").filter({ hasText: "FilterTransport" }),
    ).toBeVisible();
    await expect(
      page.getByRole("row").filter({ hasText: "FilterFood" }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(
      page.getByRole("row").filter({ hasText: "FilterFood" }),
    ).toBeVisible();
  });
});
