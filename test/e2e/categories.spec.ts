import { test, expect } from "@playwright/test";

test.describe("Manage Categories panel", () => {
  test("opens panel, lists seeded categories, and blocks deleting Other", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /^manage categories$/i }).click();
    const dialog = page.getByRole("dialog", { name: /manage categories/i });
    await expect(dialog).toBeVisible();

    await expect(dialog.getByText("Food")).toBeVisible();
    await expect(dialog.getByText("Transport")).toBeVisible();
    await expect(dialog.getByText("Entertainment")).toBeVisible();
    await expect(dialog.getByText("Shopping")).toBeVisible();
    await expect(dialog.getByText("Bills")).toBeVisible();
    await expect(dialog.getByText("Other", { exact: true })).toBeVisible();
    await expect(
      dialog.getByText(/system category · cannot be deleted/i),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: /delete other/i }),
    ).toHaveCount(0);
  });

  test("creates a category and surfaces API validation errors", async ({
    page,
  }) => {
    const uniqueName = `Travel-${Date.now()}`;
    await page.goto("/");
    await page.getByRole("button", { name: /^manage categories$/i }).click();
    const dialog = page.getByRole("dialog", { name: /manage categories/i });
    await expect(dialog.getByText("Food")).toBeVisible({ timeout: 15_000 });

    await dialog.getByLabel(/new category name/i).fill(uniqueName);
    await dialog.getByRole("button", { name: /^add category$/i }).click();
    await expect(dialog.getByText(uniqueName)).toBeVisible({ timeout: 15_000 });

    await dialog.getByLabel(/new category name/i).fill(uniqueName);
    await dialog.getByRole("button", { name: /^add category$/i }).click();
    await expect(dialog.getByRole("alert")).toContainText(/already exists/i);
  });

  test("renames and deletes a custom category with confirmation", async ({
    page,
  }) => {
    const original = `Custom-${Date.now()}`;
    const renamed = `${original}-renamed`;

    await page.goto("/");
    await page.getByRole("button", { name: /^manage categories$/i }).click();
    const dialog = page.getByRole("dialog", { name: /manage categories/i });
    await expect(dialog.getByText("Food")).toBeVisible({ timeout: 15_000 });

    await dialog.getByLabel(/new category name/i).fill(original);
    await dialog.getByRole("button", { name: /^add category$/i }).click();
    await expect(dialog.getByText(original)).toBeVisible({ timeout: 15_000 });

    const row = dialog.getByRole("listitem", { name: original });
    await row.getByRole("button", { name: `Rename ${original}` }).click();
    await row.getByLabel(/rename category/i).fill(renamed);
    await row.getByRole("button", { name: /^save$/i }).click();
    await expect(dialog.getByText(renamed)).toBeVisible({ timeout: 15_000 });

    const renamedRow = dialog.getByRole("listitem", { name: renamed });
    await renamedRow.getByRole("button", { name: `Delete ${renamed}` }).click();
    await renamedRow
      .getByRole("button", { name: `Confirm delete ${renamed}` })
      .click();
    await expect(dialog.getByText(renamed)).toHaveCount(0);
  });
});
