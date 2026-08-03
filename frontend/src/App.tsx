import { useCallback, useEffect, useState } from "react";
import { CategoriesPanel } from "./components/CategoriesPanel";
import { ExpenseForm } from "./components/ExpenseForm";
import { ExpenseList } from "./components/ExpenseList";
import type { Expense } from "./types/expense";
import { listExpenses } from "./utils/expensesApi";

function App() {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesError, setExpensesError] = useState<string | null>(null);

  const refreshExpenses = useCallback(async () => {
    setExpensesError(null);
    setExpensesLoading(true);
    try {
      const list = await listExpenses();
      setExpenses(list);
    } catch (err) {
      setExpensesError(
        err instanceof Error ? err.message : "Failed to load expenses",
      );
    } finally {
      setExpensesLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshExpenses();
  }, [refreshExpenses]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Expense Tracker
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Track spending by category and currency.
        </p>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-medium">Add expense</h2>
          <div className="mt-4">
            <ExpenseForm onCreated={() => void refreshExpenses()} />
          </div>
        </section>

        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6">
          <h2 className="text-lg font-medium">Summary by category</h2>
          <p className="mt-2 text-sm text-slate-500">
            Totals broken down by currency (placeholder)
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-medium">Expenses</h2>
            <button
              type="button"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              onClick={() => setCategoriesOpen(true)}
            >
              Manage categories
            </button>
          </div>
          <ExpenseList
            expenses={expenses}
            loading={expensesLoading}
            error={expensesError}
          />
        </section>
      </div>

      <CategoriesPanel
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
      />
    </main>
  );
}

export default App;
