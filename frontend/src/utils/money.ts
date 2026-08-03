import { DEFAULT_CURRENCY, type CurrencyCode } from "../constants/domain";

/** Format integer minor units for display (e.g. 4990 + ILS → ₪49.90). */
export function formatMoney(
  amountMinor: number,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): string {
  const amount = amountMinor / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}
