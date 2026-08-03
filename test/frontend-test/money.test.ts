import { describe, expect, it } from "vitest";
import { formatMoney } from "../../frontend/src/utils/money";

describe("formatMoney", () => {
  it("formats ILS minor units", () => {
    expect(formatMoney(4990, "ILS")).toContain("49.90");
  });

  it("formats USD minor units", () => {
    expect(formatMoney(1000, "USD")).toContain("10.00");
  });
});
