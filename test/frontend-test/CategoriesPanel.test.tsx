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
import type { Category } from "../../frontend/src/types/expense";

const seedCategories: Category[] = [
  { id: "1", name: "Bills", isSystem: false },
  { id: "2", name: "Entertainment", isSystem: false },
  { id: "3", name: "Food", isSystem: false },
  { id: "4", name: "Other", isSystem: true },
  { id: "5", name: "Shopping", isSystem: false },
  { id: "6", name: "Transport", isSystem: false },
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Manage Categories panel", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();

        if (url.endsWith("/categories") && method === "GET") {
          return jsonResponse(seedCategories);
        }
        return jsonResponse({ error: "Unexpected request" }, 500);
      },
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("opens a slide-over listing seeded categories", async () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: /^manage categories$/i }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: /manage categories/i,
    });
    expect(dialog).toBeInTheDocument();

    for (const name of [
      "Food",
      "Transport",
      "Entertainment",
      "Shopping",
      "Bills",
      "Other",
    ]) {
      expect(within(dialog).getByText(name)).toBeInTheDocument();
    }

    expect(
      within(dialog).getByText(/system category · cannot be deleted/i),
    ).toBeInTheDocument();
  });

  it("creates a category and shows it in the list", async () => {
    const categories = [...seedCategories];

    fetchMock.mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();

        if (url.endsWith("/categories") && method === "GET") {
          return jsonResponse(categories);
        }
        if (url.endsWith("/categories") && method === "POST") {
          const body = JSON.parse(String(init?.body)) as { name: string };
          const created = {
            id: "new",
            name: body.name,
            isSystem: false,
          };
          categories.push(created);
          return jsonResponse(created, 201);
        }
        return jsonResponse({ error: "Unexpected" }, 500);
      },
    );

    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: /^manage categories$/i }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: /manage categories/i,
    });

    fireEvent.change(within(dialog).getByLabelText(/new category name/i), {
      target: { value: "Pets" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: /^add category$/i }),
    );

    await waitFor(() => {
      expect(within(dialog).getByText("Pets")).toBeInTheDocument();
    });
  });

  it("shows an accessible error when create fails", async () => {
    fetchMock.mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();

        if (url.endsWith("/categories") && method === "GET") {
          return jsonResponse(seedCategories);
        }
        if (url.endsWith("/categories") && method === "POST") {
          return jsonResponse(
            { error: "A category with this name already exists" },
            409,
          );
        }
        return jsonResponse({ error: "Unexpected" }, 500);
      },
    );

    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: /^manage categories$/i }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: /manage categories/i,
    });

    fireEvent.change(within(dialog).getByLabelText(/new category name/i), {
      target: { value: "Food" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: /^add category$/i }),
    );

    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent(
      /a category with this name already exists/i,
    );
  });

  it("renames a non-system category", async () => {
    const categories = seedCategories.map((c) => ({ ...c }));

    fetchMock.mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();

        if (url.endsWith("/categories") && method === "GET") {
          return jsonResponse(categories);
        }
        if (url.includes("/categories/3") && method === "PATCH") {
          const body = JSON.parse(String(init?.body)) as { name: string };
          const idx = categories.findIndex((c) => c.id === "3");
          categories[idx] = { ...categories[idx], name: body.name };
          return jsonResponse(categories[idx]);
        }
        return jsonResponse({ error: "Unexpected" }, 500);
      },
    );

    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: /^manage categories$/i }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: /manage categories/i,
    });

    const foodRow = within(dialog).getByRole("listitem", { name: /^food$/i });
    fireEvent.click(
      within(foodRow).getByRole("button", { name: /^rename food$/i }),
    );
    const renameInput = within(foodRow).getByLabelText(/rename category/i);
    fireEvent.change(renameInput, { target: { value: "Groceries" } });
    fireEvent.click(within(foodRow).getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(within(dialog).getByText("Groceries")).toBeInTheDocument();
    });
  });

  it("deletes a category after confirmation and blocks deleting Other", async () => {
    const categories = [
      ...seedCategories,
      { id: "7", name: "Temp", isSystem: false },
    ];

    fetchMock.mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();

        if (url.endsWith("/categories") && method === "GET") {
          return jsonResponse(categories);
        }
        if (url.includes("/categories/7") && method === "DELETE") {
          const idx = categories.findIndex((c) => c.id === "7");
          categories.splice(idx, 1);
          return new Response(null, { status: 204 });
        }
        return jsonResponse({ error: "Unexpected" }, 500);
      },
    );

    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: /^manage categories$/i }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: /manage categories/i,
    });

    const otherRow = within(dialog).getByRole("listitem", { name: /^other$/i });
    expect(
      within(otherRow).queryByRole("button", { name: /delete/i }),
    ).not.toBeInTheDocument();

    const tempRow = within(dialog).getByRole("listitem", { name: /^temp$/i });
    fireEvent.click(
      within(tempRow).getByRole("button", { name: /^delete temp$/i }),
    );
    fireEvent.click(
      within(tempRow).getByRole("button", { name: /^confirm delete temp$/i }),
    );

    await waitFor(() => {
      expect(within(dialog).queryByText("Temp")).not.toBeInTheDocument();
    });
  });

  it("closes the panel with Escape and the close button", async () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: /^manage categories$/i }),
    );
    expect(
      await screen.findByRole("dialog", { name: /manage categories/i }),
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: /manage categories/i }),
      ).not.toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /^manage categories$/i }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: /manage categories/i,
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /^close$/i }));
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: /manage categories/i }),
      ).not.toBeInTheDocument();
    });
  });
});
