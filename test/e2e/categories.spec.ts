import { test, expect } from "@playwright/test";
import {
  createExpenseForCategory,
  disconnectE2eDb,
  getExpenseCategoryName,
  resetCategoriesDb,
} from "./helpers/db";

test.describe("Manage Categories panel", () => {
  // Shared SQLite DB — keep these tests serial to avoid seed races.
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async () => {
    await resetCategoriesDb();
  });

  test.afterAll(async () => {
    await disconnectE2eDb();
  });

  async function openPanel(page: import("@playwright/test").Page) {
    await page.goto("/");
    await page.getByTestId("manage-categories-button").click();
    await expect(page.getByTestId("categories-panel")).toBeVisible();
  }

  test("lists seeded categories including Other", async ({ page }) => {
    await openPanel(page);

    for (const name of [
      "Food",
      "Transport",
      "Entertainment",
      "Shopping",
      "Bills",
      "Other",
    ]) {
      await expect(page.getByTestId(`category-row-${name}`)).toBeVisible();
    }
    await expect(page.getByTestId("system-category-badge")).toBeVisible();
  });

  test("creates a custom category", async ({ page }) => {
    await openPanel(page);

    await page.getByTestId("category-name-input").fill("Healthcare");
    await page.getByTestId("add-category-button").click();

    await expect(page.getByTestId("category-row-Healthcare")).toBeVisible();
    await expect(page.getByTestId("categories-status")).toContainText(
      /category added/i,
    );
  });

  test("rejects empty category name", async ({ page }) => {
    await openPanel(page);

    await page.getByTestId("category-name-input").fill("   ");
    await page.getByTestId("add-category-button").click();

    await expect(page.getByTestId("categories-error")).toBeVisible();
    await expect(page.getByTestId("categories-error")).toContainText(/name/i);
  });

  test("rejects duplicate category name", async ({ page }) => {
    await openPanel(page);

    await page.getByTestId("category-name-input").fill("Food");
    await page.getByTestId("add-category-button").click();

    await expect(page.getByTestId("categories-error")).toContainText(
      /exists|duplicate/i,
    );
  });

  test("renames a non-system category", async ({ page }) => {
    await openPanel(page);

    await page.getByTestId("category-name-input").fill("Gym");
    await page.getByTestId("add-category-button").click();
    await expect(page.getByTestId("category-row-Gym")).toBeVisible();

    await page.getByTestId("rename-Gym").click();
    await page.getByTestId("rename-category-input").fill("Fitness");
    await page.getByTestId("save-rename-button").click();

    await expect(page.getByTestId("category-row-Fitness")).toBeVisible();
    await expect(page.getByTestId("category-row-Gym")).toHaveCount(0);
  });

  test("deletes an unused category", async ({ page }) => {
    await openPanel(page);

    await page.getByTestId("category-name-input").fill("Temporary");
    await page.getByTestId("add-category-button").click();
    await expect(page.getByTestId("category-row-Temporary")).toBeVisible();

    await page.getByTestId("delete-Temporary").click();

    await expect(page.getByTestId("category-row-Temporary")).toHaveCount(0);
    await expect(page.getByTestId("categories-status")).toContainText(
      /deleted temporary/i,
    );
  });

  test("shows safe failure when deleting Other", async ({ page }) => {
    await openPanel(page);

    await page.getByTestId("delete-Other").click();

    await expect(page.getByTestId("categories-error")).toContainText(
      /other cannot be deleted/i,
    );
    await expect(page.getByTestId("category-row-Other")).toBeVisible();
  });

  test("delete with expenses reassigns to Other and shows status", async ({
    page,
  }) => {
    const expense = await createExpenseForCategory("Food");
    await openPanel(page);

    await page.getByTestId("delete-Food").click();

    await expect(page.getByTestId("category-row-Food")).toHaveCount(0);
    await expect(page.getByTestId("category-row-Other")).toBeVisible();
    await expect(page.getByTestId("categories-status")).toContainText(
      /reassigned to Other/i,
    );
    await expect(page.getByTestId("categories-status")).toContainText(
      /1 expense/,
    );

    expect(await getExpenseCategoryName(expense.id)).toBe("Other");
  });

  test("persists custom categories after reload", async ({ page }) => {
    await openPanel(page);

    await page.getByTestId("category-name-input").fill("Books");
    await page.getByTestId("add-category-button").click();
    await expect(page.getByTestId("category-row-Books")).toBeVisible();

    await page.reload();
    await page.getByTestId("manage-categories-button").click();
    await expect(page.getByTestId("category-row-Books")).toBeVisible();
  });

  test("closes the panel", async ({ page }) => {
    await openPanel(page);
    await page.getByTestId("categories-panel-close").click();
    await expect(page.getByTestId("categories-panel")).toHaveCount(0);
  });
});
