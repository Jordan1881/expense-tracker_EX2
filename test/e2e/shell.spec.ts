import { test, expect } from "@playwright/test";

test.describe("Expense Tracker shell", () => {
  test("shows the app title", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Expense Tracker" }),
    ).toBeVisible();
  });
});
