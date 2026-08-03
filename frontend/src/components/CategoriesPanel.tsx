import { useState } from "react";
import type { FormEvent } from "react";
import type { Category } from "../types/expense";
import { useCategories } from "../hooks/useCategories";

type CategoriesPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function CategoriesPanel({ open, onClose }: CategoriesPanelProps) {
  const {
    categories,
    loading,
    error,
    setError,
    createCategory,
    renameCategory,
    removeCategory,
  } = useCategories(open);

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return null;
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setStatusMessage(null);
    setBusy(true);
    try {
      await createCategory(newName);
      setNewName("");
      setStatusMessage("Category added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add category");
    } finally {
      setBusy(false);
    }
  }

  async function handleRename(category: Category) {
    setStatusMessage(null);
    setBusy(true);
    try {
      await renameCategory(category.id, editName);
      setEditingId(null);
      setEditName("");
      setStatusMessage(`Renamed to ${editName.trim()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename category");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(category: Category) {
    setStatusMessage(null);
    setBusy(true);
    try {
      const result = await removeCategory(category.id);
      if (result.reassignedCount > 0) {
        setStatusMessage(
          `Deleted ${category.name}. ${result.reassignedCount} expense(s) reassigned to Other.`,
        );
      } else {
        setStatusMessage(`Deleted ${category.name}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-slate-900/40"
      data-testid="categories-panel-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Manage categories"
        className="flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        data-testid="categories-panel"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-medium">Manage categories</h2>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            onClick={onClose}
            data-testid="categories-panel-close"
          >
            Close
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <form className="space-y-2" onSubmit={handleCreate}>
            <label
              htmlFor="new-category-name"
              className="block text-sm font-medium text-slate-700"
            >
              New category name
            </label>
            <div className="flex gap-2">
              <input
                id="new-category-name"
                data-testid="category-name-input"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="e.g. Healthcare"
                disabled={busy}
              />
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
                disabled={busy}
                data-testid="add-category-button"
              >
                Add category
              </button>
            </div>
          </form>

          {loading ? (
            <p className="text-sm text-slate-500" data-testid="categories-loading">
              Loading categories…
            </p>
          ) : null}

          {error ? (
            <p
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
              data-testid="categories-error"
            >
              {error}
            </p>
          ) : null}

          {statusMessage ? (
            <p
              className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              data-testid="categories-status"
            >
              {statusMessage}
            </p>
          ) : null}

          <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex flex-col gap-2 px-3 py-3"
                data-testid={`category-row-${category.name}`}
              >
                {editingId === category.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="sr-only" htmlFor={`rename-${category.id}`}>
                      Rename {category.name}
                    </label>
                    <input
                      id={`rename-${category.id}`}
                      data-testid="rename-category-input"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                      disabled={busy}
                    />
                    <button
                      type="button"
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
                      onClick={() => void handleRename(category)}
                      disabled={busy}
                      data-testid="save-rename-button"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
                      onClick={() => {
                        setEditingId(null);
                        setEditName("");
                      }}
                      disabled={busy}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="font-medium text-slate-900">
                        {category.name}
                      </span>
                      {category.isSystem ? (
                        <span
                          className="ml-2 text-xs text-slate-500"
                          data-testid="system-category-badge"
                        >
                          System
                        </span>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      {!category.isSystem ? (
                        <button
                          type="button"
                          className="rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
                          onClick={() => {
                            setEditingId(category.id);
                            setEditName(category.name);
                            setError(null);
                          }}
                          disabled={busy}
                          data-testid={`rename-${category.name}`}
                        >
                          Rename
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="rounded-md border border-red-200 px-2 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                        onClick={() => void handleDelete(category)}
                        disabled={busy}
                        data-testid={`delete-${category.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
