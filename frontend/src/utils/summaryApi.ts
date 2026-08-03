import { API_BASE_URL } from "../constants/domain";
import type { CurrencyCode } from "../types/expense";

export type CategorySummaryRow = {
  categoryId: string;
  categoryName: string;
  totals: Array<{ currency: CurrencyCode; amountMinor: number }>;
};

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    if (body?.error) {
      return body.error;
    }
  } catch {
    // fall through
  }
  return `Request failed (${response.status})`;
}

export async function fetchCategorySummary(): Promise<CategorySummaryRow[]> {
  const response = await fetch(`${API_BASE_URL}/summary/by-category`);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as CategorySummaryRow[];
}
