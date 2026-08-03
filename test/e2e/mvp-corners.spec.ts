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

async function removeCategoryByName(request: APIRequestContext, name: string) {
  const res = await request.get(`${API}/api/categories`);
  expect(res.ok()).toBeTruthy();
  const categories = (await res.json()) as Array<{ id: string; name: string }>;
  const match = categories.find((c) => c.name === name);
  if (!match) return;
  const del = await request.delete(`${API}/api/categories/${match.id}`);
  expect(del.ok()).toBeTruthy();
}

test.describe("MVP corner flows", () => {
  test.beforeEach(async ({ request }) => {
    await clearExpenses(request);
    await removeCategoryByName(request, "E2E Disposable");
  });

  test("add expense, see summary, edit, filter, reload persists", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByLabel("Amount").fill("10.00");
    await page.getByLabel("Date").fill("2026-08-10");
    await page.locator("#expense-category").selectOption({ label: "Food" });
    await page.getByLabel("Currency").selectOption("ILS");
    await page.getByLabel(/Note/).fill("Lunch");
    await page.getByRole("button", { name: "Add expense" }).click();

    await expect(page.getByRole("table")).toBeVisible();
    await expect(
      page.getByRole("row").filter({ hasText: "Lunch" }),
    ).toBeVisible();

    const summary = page.getByLabel("Category summary");
    await expect(summary).toContainText("Food");
    await expect(summary).toContainText("10.00");

    await page.getByLabel("Amount").fill("5.00");
    await page.getByLabel("Date").fill("2026-08-11");
    await page.locator("#expense-category").selectOption({ label: "Food" });
    await page.getByLabel("Currency").selectOption("USD");
    await page.getByRole("button", { name: "Add expense" }).click();
    await expect(summary).toContainText("5.00");

    await page
      .getByRole("row")
      .filter({ hasText: "5.00" })
      .getByRole("button", { name: "Edit" })
      .click();
    await expect(page.getByText(/Editing expense/i)).toBeVisible();
    await page.getByLabel(/Note/).fill("Brunch");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(
      page.getByRole("row").filter({ hasText: "Brunch" }),
    ).toBeVisible();

    await page.locator("#filter-category").selectOption({ label: "Transport" });
    await expect(
      page.getByText("No expenses match these filters."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.getByRole("table")).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("row")
      .filter({ hasText: "Brunch" })
      .getByRole("button", { name: "Delete" })
      .click();
    await expect(
      page.getByRole("row").filter({ hasText: "Brunch" }),
    ).toHaveCount(0);

    await page.reload();
    await expect(
      page.getByRole("row").filter({ hasText: "Lunch" }),
    ).toBeVisible();
    await expect(page.getByLabel("Category summary")).toContainText("Food");
    await expect(page.getByLabel("Category summary")).toContainText("10.00");
  });

  test("delete Other category fails; delete category reassigns expenses", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Manage categories" }).click();
    const panel = page.getByRole("dialog", { name: "Manage categories" });
    await expect(panel).toBeVisible();

    await panel.getByLabel("New category name").fill("E2E Disposable");
    await panel.getByRole("button", { name: "Add category" }).click();
    await expect(
      panel.getByText("E2E Disposable", { exact: true }),
    ).toBeVisible();
    await panel.getByRole("button", { name: "Close" }).click();
    await expect(panel).toBeHidden();
    await expect(page.locator("#expense-category")).toContainText(
      "E2E Disposable",
    );

    await page.getByLabel("Amount").fill("12.00");
    await page.getByLabel("Date").fill("2026-08-12");
    await page
      .locator("#expense-category")
      .selectOption({ label: "E2E Disposable" });
    await page.getByRole("button", { name: "Add expense" }).click();
    await expect(
      page.getByRole("row").filter({ hasText: "E2E Disposable" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Manage categories" }).click();
    await expect(panel).toBeVisible();

    const otherRow = panel.locator("li", { hasText: "Other" });
    await expect(otherRow.getByRole("button", { name: "Delete" })).toHaveCount(
      0,
    );

    const disposableRow = panel.locator("li", { hasText: "E2E Disposable" });
    await disposableRow.getByRole("button", { name: "Delete" }).click();
    await disposableRow.getByRole("button", { name: "Confirm delete" }).click();
    await expect(
      panel.getByText("E2E Disposable", { exact: true }),
    ).toHaveCount(0);

    await panel.getByRole("button", { name: "Close" }).click();
    await expect(panel).toBeHidden();

    await expect(
      page.getByRole("row").filter({ hasText: "Other" }),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel("Category summary")).toContainText("Other");
  });
});
