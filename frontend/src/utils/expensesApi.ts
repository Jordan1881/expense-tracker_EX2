import { API_BASE_URL } from "../constants/domain";
import type { CurrencyCode, Expense } from "../types/expense";

export type CreateExpensePayload = {
  amountMinor: number;
  currency: CurrencyCode;
  date: string;
  note?: string;
  categoryId: string;
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

export async function listExpenses(): Promise<Expense[]> {
  const response = await fetch(`${API_BASE_URL}/expenses`);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as Expense[];
}

export async function createExpense(
  payload: CreateExpensePayload,
): Promise<Expense> {
  const response = await fetch(`${API_BASE_URL}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as Expense;
}
