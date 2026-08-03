import { useCallback, useEffect, useState } from "react";
import { CategoriesPanel } from "./components/CategoriesPanel";
import { CategorySummary } from "./components/CategorySummary";
import { ExpenseFilters } from "./components/ExpenseFilters";
import { ExpenseForm } from "./components/ExpenseForm";
import { ExpenseList } from "./components/ExpenseList";
import type { Expense } from "./types/expense";
import {
  deleteExpense,
  listExpenses,
  type ExpenseListFilters,
} from "./utils/expensesApi";
import {
  fetchCategorySummary,
  type CategorySummaryRow,
} from "./utils/summaryApi";

function App() {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExpenseListFilters>({});
  const [editing, setEditing] = useState<Expense | null>(null);
  const [summaryRows, setSummaryRows] = useState<CategorySummaryRow[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [categoriesRevision, setCategoriesRevision] = useState(0);

  const filtersActive = Boolean(
    filters.categoryId || filters.from || filters.to,
  );

  const refreshSummary = useCallback(async () => {
    setSummaryError(null);
    setSummaryLoading(true);
    try {
      setSummaryRows(await fetchCategorySummary());
    } catch (err) {
      setSummaryError(
        err instanceof Error ? err.message : "Failed to load summary",
      );
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const refreshExpenses = useCallback(async () => {
    setExpensesError(null);
    setExpensesLoading(true);
    try {
      const list = await listExpenses(filters);
      setExpenses(list);
    } catch (err) {
      setExpensesError(
        err instanceof Error ? err.message : "Failed to load expenses",
      );
    } finally {
      setExpensesLoading(false);
    }
  }, [filters]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshExpenses(), refreshSummary()]);
  }, [refreshExpenses, refreshSummary]);

  useEffect(() => {
    void refreshExpenses();
  }, [refreshExpenses]);

  useEffect(() => {
    void refreshSummary();
  }, [refreshSummary]);

  async function handleDelete(expense: Expense) {
    const ok = window.confirm(
      `Delete expense on ${expense.date} (${expense.categoryName})?`,
    );
    if (!ok) return;
    try {
      await deleteExpense(expense.id);
      if (editing?.id === expense.id) setEditing(null);
      await refreshAll();
    } catch (err) {
      setExpensesError(
        err instanceof Error ? err.message : "Failed to delete expense",
      );
    }
  }

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
          <h2 className="text-lg font-medium">
            {editing ? "Edit expense" : "Add expense"}
          </h2>
          <div className="mt-4">
            <ExpenseForm
              editing={editing}
              categoriesRevision={categoriesRevision}
              onCancelEdit={() => setEditing(null)}
              onSaved={() => {
                setEditing(null);
                void refreshAll();
              }}
            />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-medium">Summary by category</h2>
          <CategorySummary
            rows={summaryRows}
            loading={summaryLoading}
            error={summaryError}
          />
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
          <ExpenseFilters
            value={filters}
            onChange={setFilters}
            categoriesRevision={categoriesRevision}
          />
          <ExpenseList
            expenses={expenses}
            loading={expensesLoading}
            error={expensesError}
            filtersActive={filtersActive}
            onEdit={setEditing}
            onDelete={(expense) => void handleDelete(expense)}
          />
        </section>
      </div>

      <CategoriesPanel
        open={categoriesOpen}
        onClose={() => {
          setCategoriesOpen(false);
          setCategoriesRevision((n) => n + 1);
          void refreshAll();
        }}
      />
    </main>
  );
}

export default App;
