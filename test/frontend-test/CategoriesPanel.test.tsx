import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import App from "../../frontend/src/App";
import { API_BASE_URL } from "../../frontend/src/constants/domain";

const seedCategories = [
  { id: "1", name: "Bills", isSystem: false },
  { id: "2", name: "Entertainment", isSystem: false },
  { id: "3", name: "Food", isSystem: false },
  { id: "4", name: "Other", isSystem: true },
  { id: "5", name: "Shopping", isSystem: false },
  { id: "6", name: "Transport", isSystem: false },
];

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("Manage Categories panel", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(
      (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();

        if (url === `${API_BASE_URL}/categories` && method === "GET") {
          return jsonResponse(seedCategories);
        }
        return jsonResponse({ error: "unexpected" }, 500);
      },
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("opens the panel and lists categories from the API", async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId("manage-categories-button"));
    const panel = await screen.findByTestId("categories-panel");

    expect(within(panel).getByText("Food")).toBeInTheDocument();
    expect(within(panel).getByText("Other")).toBeInTheDocument();
  });

  it("creates a category from the panel form", async () => {
    let categories = [...seedCategories];

    fetchMock.mockImplementation(
      (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();

        if (url === `${API_BASE_URL}/categories` && method === "GET") {
          return jsonResponse(categories);
        }
        if (url === `${API_BASE_URL}/categories` && method === "POST") {
          const body = JSON.parse(String(init?.body)) as { name: string };
          const created = {
            id: "new",
            name: body.name,
            isSystem: false,
          };
          categories = [...categories, created];
          return jsonResponse(created, 201);
        }
        return jsonResponse({ error: "unexpected" }, 500);
      },
    );

    render(<App />);
    fireEvent.click(screen.getByTestId("manage-categories-button"));
    const panel = await screen.findByTestId("categories-panel");

    fireEvent.change(within(panel).getByLabelText(/new category name/i), {
      target: { value: "Healthcare" },
    });
    fireEvent.click(within(panel).getByTestId("add-category-button"));

    await waitFor(() => {
      expect(within(panel).getByText("Healthcare")).toBeInTheDocument();
    });
  });

  it("shows an error when deleting Other fails and keeps Other listed", async () => {
    fetchMock.mockImplementation(
      (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();

        if (url === `${API_BASE_URL}/categories` && method === "GET") {
          return jsonResponse(seedCategories);
        }
        if (url === `${API_BASE_URL}/categories/4` && method === "DELETE") {
          return jsonResponse(
            { error: "System category Other cannot be deleted" },
            403,
          );
        }
        return jsonResponse({ error: "unexpected" }, 500);
      },
    );

    render(<App />);
    fireEvent.click(screen.getByTestId("manage-categories-button"));
    const panel = await screen.findByTestId("categories-panel");

    fireEvent.click(within(panel).getByTestId("delete-Other"));

    expect(
      await within(panel).findByTestId("categories-error"),
    ).toHaveTextContent(/other cannot be deleted/i);
    expect(within(panel).getByText("Other")).toBeInTheDocument();
  });
});
