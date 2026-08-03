export type CurrencyCode = "USD" | "ILS" | "EUR";

export type Expense = {
  id: string;
  amountMinor: number;
  currency: CurrencyCode;
  date: string;
  note?: string | null;
  categoryId: string;
  categoryName: string;
};

export type Category = {
  id: string;
  name: string;
  isSystem: boolean;
};
