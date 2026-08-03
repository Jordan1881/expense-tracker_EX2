import { formatMoney } from "../utils/money";
import type { CategorySummaryRow } from "../utils/summaryApi";

type CategorySummaryProps = {
  rows: CategorySummaryRow[];
  loading: boolean;
  error: string | null;
};

export function CategorySummary({
  rows,
  loading,
  error,
}: CategorySummaryProps) {
  if (loading) {
    return <p className="mt-2 text-sm text-slate-500">Loading summary…</p>;
  }

  if (error) {
    return (
      <p className="mt-2 text-sm text-red-600" role="alert">
        {error}
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="mt-2 text-sm text-slate-500">
        No spending yet. Totals will appear here by category and currency.
      </p>
    );
  }

  return (
    <ul className="mt-4 space-y-3" aria-label="Category summary">
      {rows.map((row) => (
        <li key={row.categoryId} className="text-sm">
          <p className="font-medium">{row.categoryName}</p>
          <p className="mt-0.5 text-slate-600">
            {row.totals
              .map((total) => formatMoney(total.amountMinor, total.currency))
              .join(" · ")}
          </p>
        </li>
      ))}
    </ul>
  );
}
