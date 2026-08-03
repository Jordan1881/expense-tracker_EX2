import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { Category } from "../types/expense";
import {
  createCategory,
  deleteCategory,
  listCategories,
  renameCategory,
} from "../utils/categoriesApi";

type CategoriesPanelProps = {
  open: boolean;
  onClose: () => void;
};

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function CategoriesPanel({ open, onClose }: CategoriesPanelProps) {
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [savingRename, setSavingRename] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setLoadError(null);
    setActionError(null);
    setNewName("");
    setEditing(null);
    setPendingDelete(null);
    setLoading(true);

    void listCategories()
      .then((data) => {
        if (!cancelled) {
          setCategories(data);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(errorMessage(error, "Could not load categories"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setActionError(null);
    setCreating(true);
    try {
      const created = await createCategory(newName);
      setCategories((current) =>
        [...current, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setNewName("");
    } catch (error: unknown) {
      setActionError(errorMessage(error, "Could not create category"));
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveRename(category: Category) {
    if (!editing || editing.id !== category.id) {
      return;
    }
    setActionError(null);
    setSavingRename(true);
    try {
      const updated = await renameCategory(category.id, editing.name);
      setCategories((current) =>
        current
          .map((item) => (item.id === updated.id ? updated : item))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditing(null);
    } catch (error: unknown) {
      setActionError(errorMessage(error, "Could not rename category"));
    } finally {
      setSavingRename(false);
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }
    setActionError(null);
    setDeleting(true);
    try {
      await deleteCategory(pendingDelete.id);
      setCategories((current) =>
        current.filter((item) => item.id !== pendingDelete.id),
      );
      setPendingDelete(null);
    } catch (error: unknown) {
      setActionError(errorMessage(error, "Could not delete category"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Dismiss panel overlay"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              Manage categories
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-slate-600">
              Add, rename, or remove categories. Other is protected and receives
              expenses when a category is deleted.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <form onSubmit={handleCreate} className="space-y-2">
            <label
              htmlFor="new-category-name"
              className="block text-sm font-medium text-slate-800"
            >
              New category name
            </label>
            <div className="flex gap-2">
              <input
                id="new-category-name"
                type="text"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                autoComplete="off"
                className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                placeholder="e.g. Healthcare"
              />
              <button
                type="submit"
                disabled={creating}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {creating ? "Adding…" : "Add category"}
              </button>
            </div>
          </form>

          {actionError ? (
            <p
              role="alert"
              className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
            >
              {actionError}
            </p>
          ) : null}

          {loadError ? (
            <p
              role="alert"
              className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
            >
              {loadError}
            </p>
          ) : null}

          {loading && categories.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">Loading categories…</p>
          ) : (
            <ul
              className="mt-6 divide-y divide-slate-100"
              aria-label="Categories"
            >
              {categories.map((category) => {
                const isEditing = editing?.id === category.id;
                const isPendingDelete = pendingDelete?.id === category.id;

                return (
                  <li
                    key={category.id}
                    aria-label={category.name}
                    className="flex flex-col gap-2 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="space-y-2">
                            <label
                              htmlFor={`rename-${category.id}`}
                              className="sr-only"
                            >
                              Rename category
                            </label>
                            <input
                              id={`rename-${category.id}`}
                              type="text"
                              value={editing.name}
                              onChange={(event) =>
                                setEditing({
                                  id: category.id,
                                  name: event.target.value,
                                })
                              }
                              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                            />
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={savingRename}
                                onClick={() => void handleSaveRename(category)}
                                className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditing(null)}
                                className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="truncate font-medium text-slate-900">
                              {category.name}
                            </p>
                            {category.isSystem ? (
                              <p className="mt-0.5 text-xs text-slate-500">
                                System category · cannot be deleted
                              </p>
                            ) : null}
                          </>
                        )}
                      </div>

                      {!category.isSystem && !isEditing ? (
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            aria-label={`Rename ${category.name}`}
                            onClick={() => {
                              setActionError(null);
                              setPendingDelete(null);
                              setEditing({
                                id: category.id,
                                name: category.name,
                              });
                            }}
                            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700"
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${category.name}`}
                            onClick={() => {
                              setActionError(null);
                              setEditing(null);
                              setPendingDelete({
                                id: category.id,
                                name: category.name,
                              });
                            }}
                            className="rounded-md border border-rose-200 px-2.5 py-1.5 text-xs text-rose-800"
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {isPendingDelete ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                        <p className="text-sm text-amber-950">
                          Delete “{category.name}”? Expenses in this category
                          will move to Other.
                        </p>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            disabled={deleting}
                            aria-label={`Confirm delete ${category.name}`}
                            onClick={() => void handleConfirmDelete()}
                            className="rounded-md bg-rose-700 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                          >
                            {deleting ? "Deleting…" : "Confirm delete"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(null)}
                            className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
