import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import App from "../../frontend/src/App";
import type { Category, Expense } from "../../frontend/src/types/expense";

const seedCategories: Category[] = [
  { id: "cat-food", name: "Food", isSystem: false },
  { id: "cat-other", name: "Other", isSystem: true },
];

let expensesStore: Expense[] = [];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Add expense form → list", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    expensesStore = [];
    fetchMock.mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();

        if (url.endsWith("/categories") && method === "GET") {
          return jsonResponse(seedCategories);
        }

        if (url.includes("/summary/by-category") && method === "GET") {
          return jsonResponse([]);
        }

        if (url.endsWith("/expenses") && method === "GET") {
          return jsonResponse(expensesStore);
        }

        if (url.endsWith("/expenses") && method === "POST") {
          const payload = JSON.parse(String(init?.body ?? "{}")) as {
            amountMinor: number;
            currency: Expense["currency"];
            date: string;
            note?: string;
            categoryId: string;
          };
          if (
            typeof payload.amountMinor !== "number" ||
            payload.amountMinor <= 0
          ) {
            return jsonResponse({ error: "amountMinor must be positive" }, 400);
          }
          const category = seedCategories.find(
            (c) => c.id === payload.categoryId,
          );
          if (!category) {
            return jsonResponse({ error: "Category not found" }, 404);
          }
          const created: Expense = {
            id: `exp-${expensesStore.length + 1}`,
            amountMinor: payload.amountMinor,
            currency: payload.currency,
            date: payload.date,
            note: payload.note ?? null,
            categoryId: payload.categoryId,
            categoryName: category.name,
          };
          expensesStore = [created, ...expensesStore];
          return jsonResponse(created, 201);
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

  it("defaults currency to ILS", async () => {
    render(<App />);
    const currency = await screen.findByLabelText("Currency");
    expect(currency).toHaveValue("ILS");
  });

  it("adds an expense with a note and shows it in the list", async () => {
    render(<App />);

    await screen.findByLabelText((text, el) => {
      return text === "Category" && el?.id === "expense-category";
    });
    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "49.90" },
    });
    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "2026-08-03" },
    });
    fireEvent.change(screen.getByLabelText(/Note/), {
      target: { value: "Lunch" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    const row = screen.getByRole("row", { name: /Lunch/i });
    expect(within(row).getByText("Food")).toBeInTheDocument();
    expect(within(row).getByText("2026-08-03")).toBeInTheDocument();
  });

  it("adds an expense without a note", async () => {
    render(<App />);

    await screen.findByLabelText((text, el) => {
      return text === "Category" && el?.id === "expense-category";
    });
    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "2026-08-04" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    const row = screen.getByRole("row", { name: /2026-08-04/ });
    expect(within(row).getByText("—")).toBeInTheDocument();
  });

  it("shows validation error for invalid amount", async () => {
    render(<App />);

    await screen.findByLabelText((text, el) => {
      return text === "Category" && el?.id === "expense-category";
    });
    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "abc" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/valid amount/i);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
