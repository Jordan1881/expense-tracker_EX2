import { useCallback, useEffect, useState } from "react";
import type { Category } from "../types/expense";
import {
  createCategory as apiCreateCategory,
  deleteCategory as apiDeleteCategory,
  fetchCategories,
  renameCategory as apiRenameCategory,
} from "../api/categories";

export function useCategories(enabled: boolean) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      void refresh();
    }
  }, [enabled, refresh]);

  const createCategory = useCallback(
    async (name: string) => {
      setError(null);
      await apiCreateCategory(name);
      await refresh();
    },
    [refresh],
  );

  const renameCategory = useCallback(
    async (id: string, name: string) => {
      setError(null);
      await apiRenameCategory(id, name);
      await refresh();
    },
    [refresh],
  );

  const removeCategory = useCallback(
    async (id: string) => {
      setError(null);
      const result = await apiDeleteCategory(id);
      await refresh();
      return result;
    },
    [refresh],
  );

  return {
    categories,
    loading,
    error,
    setError,
    refresh,
    createCategory,
    renameCategory,
    removeCategory,
  };
}
