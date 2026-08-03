import { test, expect } from "@playwright/test";

test.describe("Manage categories panel", () => {
  test("opens panel and shows seeded categories", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Manage categories" }).click();

    const panel = page.getByRole("dialog", { name: "Manage categories" });
    await expect(panel).toBeVisible();

    for (const name of [
      "Food",
      "Transport",
      "Entertainment",
      "Shopping",
      "Bills",
      "Other",
    ]) {
      await expect(panel.getByText(name, { exact: true })).toBeVisible();
    }

    await expect(panel.getByText("System category")).toBeVisible();
  });
});
