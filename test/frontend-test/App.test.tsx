import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../../frontend/src/App";

describe("App shell", () => {
  it("renders the Expense Tracker brand heading", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "Expense Tracker" }),
    ).toBeInTheDocument();
  });
});
