import { useEffect, useState, type FormEvent } from "react";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from "../constants/domain";
import type { Category } from "../types/expense";
import { listCategories } from "../utils/categoriesApi";
import { createExpense } from "../utils/expensesApi";
import { formatMoney } from "../utils/money";

type ExpenseFormProps = {
  onCreated: () => void;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Convert a major-unit decimal string (e.g. "49.90") to integer minor units. */
function majorToMinor(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }
  const [whole, fraction = ""] = trimmed.split(".");
  const cents = (fraction + "00").slice(0, 2);
  const minor = Number(whole) * 100 + Number(cents);
  if (!Number.isInteger(minor) || minor <= 0) {
    return null;
  }
  return minor;
}

export function ExpenseForm({ onCreated }: ExpenseFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [date, setDate] = useState(todayIsoDate);
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await listCategories();
        if (cancelled) return;
        setCategories(list);
        setCategoryId((current) => current || list[0]?.id || "");
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load categories",
          );
        }
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const amountMinor = majorToMinor(amount);
    if (amountMinor === null) {
      setError("Enter a valid amount greater than zero (e.g. 49.90)");
      return;
    }
    if (!categoryId) {
      setError("Select a category");
      return;
    }
    if (!date) {
      setError("Date is required");
      return;
    }

    setSubmitting(true);
    try {
      await createExpense({
        amountMinor,
        currency,
        date,
        categoryId,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setAmount("");
      setNote("");
      setCurrency(DEFAULT_CURRENCY);
      setDate(todayIsoDate());
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="expense-amount" className="block text-sm font-medium">
          Amount
        </label>
        <input
          id="expense-amount"
          name="amount"
          type="text"
          inputMode="decimal"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="49.90"
          required
        />
        {amount && majorToMinor(amount) !== null ? (
          <p className="mt-1 text-xs text-slate-500">
            Stores as {formatMoney(majorToMinor(amount)!, currency)}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="expense-currency" className="block text-sm font-medium">
          Currency
        </label>
        <select
          id="expense-currency"
          name="currency"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
        >
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="expense-date" className="block text-sm font-medium">
          Date
        </label>
        <input
          id="expense-date"
          name="date"
          type="date"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="expense-category" className="block text-sm font-medium">
          Category
        </label>
        <select
          id="expense-category"
          name="category"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={loadingCategories || categories.length === 0}
          required
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="expense-note" className="block text-sm font-medium">
          Note <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <input
          id="expense-note"
          name="note"
          type="text"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        disabled={submitting || loadingCategories}
      >
        {submitting ? "Adding…" : "Add expense"}
      </button>
    </form>
  );
}
