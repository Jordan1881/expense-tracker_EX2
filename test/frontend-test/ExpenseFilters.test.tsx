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
  { id: "cat-transport", name: "Transport", isSystem: false },
];

const allExpenses: Expense[] = [
  {
    id: "e1",
    amountMinor: 1000,
    currency: "ILS",
    date: "2026-08-10",
    note: "Groceries",
    categoryId: "cat-food",
    categoryName: "Food",
  },
  {
    id: "e2",
    amountMinor: 2000,
    currency: "ILS",
    date: "2026-08-12",
    note: "Bus",
    categoryId: "cat-transport",
    categoryName: "Transport",
  },
  {
    id: "e3",
    amountMinor: 3000,
    currency: "ILS",
    date: "2026-07-01",
    note: "Old food",
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

function filterExpenses(url: string): Expense[] {
  const parsed = new URL(url, "http://localhost");
  const categoryId = parsed.searchParams.get("categoryId") ?? undefined;
  const from = parsed.searchParams.get("from") ?? undefined;
  const to = parsed.searchParams.get("to") ?? undefined;
  return allExpenses.filter((expense) => {
    if (categoryId && expense.categoryId !== categoryId) return false;
    if (from && expense.date < from) return false;
    if (to && expense.date > to) return false;
    return true;
  });
}

describe("Expense filters", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();

        if (url.includes("/categories") && method === "GET") {
          return jsonResponse(seedCategories);
        }
        if (url.includes("/expenses") && method === "GET") {
          return jsonResponse(filterExpenses(url));
        }
        return jsonResponse({ error: `Unhandled ${method} ${url}` }, 500);
      },
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("filters by category and clears filters", async () => {
    render(<App />);

    await screen.findByText("Groceries");
    expect(screen.getByText("Bus")).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText((text, el) => {
        return text === "Category" && el?.id === "filter-category";
      }),
      {
        target: { value: "cat-transport" },
      },
    );

    await waitFor(() => {
      expect(screen.queryByText("Groceries")).not.toBeInTheDocument();
      expect(screen.getByText("Bus")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    await waitFor(() => {
      expect(screen.getByText("Groceries")).toBeInTheDocument();
      expect(screen.getByText("Bus")).toBeInTheDocument();
    });
  });

  it("shows empty filter message when nothing matches", async () => {
    render(<App />);
    await screen.findByText("Groceries");

    fireEvent.change(screen.getByLabelText("From"), {
      target: { value: "2020-01-01" },
    });
    fireEvent.change(screen.getByLabelText("To"), {
      target: { value: "2020-12-31" },
    });

    await waitFor(() => {
      expect(
        screen.getByText("No expenses match these filters."),
      ).toBeInTheDocument();
    });
  });
});
