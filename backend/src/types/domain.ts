export type CurrencyCode = "USD" | "ILS" | "EUR";

export const CURRENCIES: CurrencyCode[] = ["USD", "ILS", "EUR"];
export const DEFAULT_CURRENCY: CurrencyCode = "ILS";

export const SEED_CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Shopping",
  "Bills",
  "Other",
] as const;

export const SYSTEM_CATEGORY_NAME = "Other";
