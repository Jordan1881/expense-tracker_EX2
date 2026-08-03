import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import App from "../../frontend/src/App";
import type { Category } from "../../frontend/src/types/expense";

const seedCategories: Category[] = [
  { id: "cat-food", name: "Food", isSystem: false },
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Category summary", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/categories")) {
          return jsonResponse(seedCategories);
        }
        if (url.includes("/expenses")) {
          return jsonResponse([]);
        }
        if (url.includes("/summary/by-category")) {
          return jsonResponse([
            {
              categoryId: "cat-food",
              categoryName: "Food",
              totals: [
                { currency: "ILS", amountMinor: 1500 },
                { currency: "USD", amountMinor: 2000 },
              ],
            },
          ]);
        }
        return jsonResponse({ error: "unexpected" }, 500);
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows per-currency totals for a category", async () => {
    render(<App />);
    const summary = await screen.findByLabelText("Category summary");
    await waitFor(() => {
      expect(summary).toHaveTextContent("Food");
    });
    expect(summary.textContent).toMatch(/15\.00/);
    expect(summary.textContent).toMatch(/20\.00/);
  });
});
