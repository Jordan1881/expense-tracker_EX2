import { useEffect, useState } from "react";
import type { Category } from "../types/expense";
import type { ExpenseListFilters } from "../utils/expensesApi";
import { listCategories } from "../utils/categoriesApi";

type ExpenseFiltersProps = {
  value: ExpenseListFilters;
  onChange: (next: ExpenseListFilters) => void;
};

export function ExpenseFilters({ value, onChange }: ExpenseFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await listCategories();
        if (!cancelled) setCategories(list);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasFilters = Boolean(value.categoryId || value.from || value.to);

  return (
    <div
      className="mt-4 flex flex-wrap items-end gap-3"
      role="search"
      aria-label="Filter expenses"
    >
      <div>
        <label htmlFor="filter-category" className="block text-xs font-medium">
          Category
        </label>
        <select
          id="filter-category"
          className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          value={value.categoryId ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              categoryId: e.target.value || undefined,
            })
          }
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-from" className="block text-xs font-medium">
          From
        </label>
        <input
          id="filter-from"
          type="date"
          className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          value={value.from ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              from: e.target.value || undefined,
            })
          }
        />
      </div>

      <div>
        <label htmlFor="filter-to" className="block text-xs font-medium">
          To
        </label>
        <input
          id="filter-to"
          type="date"
          className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          value={value.to ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              to: e.target.value || undefined,
            })
          }
        />
      </div>

      <button
        type="button"
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-40"
        disabled={!hasFilters}
        onClick={() => onChange({})}
      >
        Clear filters
      </button>
    </div>
  );
}
