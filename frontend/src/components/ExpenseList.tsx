import type { Expense } from "../types/expense";
import { formatMoney } from "../utils/money";

type ExpenseListProps = {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
};

export function ExpenseList({ expenses, loading, error }: ExpenseListProps) {
  if (loading) {
    return <p className="mt-2 text-sm text-slate-500">Loading expenses…</p>;
  }

  if (error) {
    return (
      <p className="mt-2 text-sm text-red-600" role="alert">
        {error}
      </p>
    );
  }

  if (expenses.length === 0) {
    return (
      <p className="mt-2 text-sm text-slate-500">
        No expenses yet. Add one using the form.
      </p>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-600">
          <tr>
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 font-medium">Category</th>
            <th className="py-2 pr-4 font-medium">Amount</th>
            <th className="py-2 font-medium">Note</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id} className="border-b border-slate-100">
              <td className="py-2 pr-4">{expense.date}</td>
              <td className="py-2 pr-4">{expense.categoryName}</td>
              <td className="py-2 pr-4">
                {formatMoney(expense.amountMinor, expense.currency)}
              </td>
              <td className="py-2 text-slate-600">{expense.note ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
