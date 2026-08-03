import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import App from "../../frontend/src/App";
import type { Category, Expense } from "../../frontend/src/types/expense";

const seedCategories: Category[] = [
  { id: "cat-food", name: "Food", isSystem: false },
];

let expensesStore: Expense[] = [
  {
    id: "e1",
    amountMinor: 1000,
    currency: "ILS",
    date: "2026-08-10",
    note: "Lunch",
    categoryId: "cat-food",
    categoryName: "Food",
  },
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Edit and delete expense", () => {
  beforeEach(() => {
    expensesStore = [
      {
        id: "e1",
        amountMinor: 1000,
        currency: "ILS",
        date: "2026-08-10",
        note: "Lunch",
        categoryId: "cat-food",
        categoryName: "Food",
      },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();

        if (url.includes("/categories") && method === "GET") {
          return jsonResponse(seedCategories);
        }
        if (url.includes("/summary/by-category") && method === "GET") {
          return jsonResponse([
            {
              categoryId: "cat-food",
              categoryName: "Food",
              totals: [{ currency: "ILS", amountMinor: 1000 }],
            },
          ]);
        }
        if (url.includes("/expenses") && method === "GET") {
          return jsonResponse(expensesStore);
        }
        if (url.includes("/expenses/e1") && method === "PATCH") {
          const payload = JSON.parse(String(init?.body ?? "{}"));
          expensesStore = [
            {
              ...expensesStore[0]!,
              amountMinor: payload.amountMinor,
              note: payload.note ?? null,
              date: payload.date,
              currency: payload.currency,
            },
          ];
          return jsonResponse(expensesStore[0], 200);
        }
        if (url.includes("/expenses/e1") && method === "DELETE") {
          expensesStore = [];
          return new Response(null, { status: 204 });
        }
        return jsonResponse({ error: `Unhandled ${method} ${url}` }, 500);
      }),
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("edits an expense from the list", async () => {
    render(<App />);
    await screen.findByText("Lunch");

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(await screen.findByText(/Editing expense/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "25.00" },
    });
    fireEvent.change(screen.getByLabelText(/Note/), {
      target: { value: "Dinner" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(screen.getByText("Dinner")).toBeInTheDocument();
    });
  });

  it("deletes an expense from the list", async () => {
    render(<App />);
    await screen.findByText("Lunch");

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByText("Lunch")).not.toBeInTheDocument();
      expect(screen.getByText(/No expenses yet/i)).toBeInTheDocument();
    });
  });
});
