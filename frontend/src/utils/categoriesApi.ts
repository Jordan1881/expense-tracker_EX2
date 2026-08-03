import { API_BASE_URL } from "../constants/domain";
import type { Category } from "../types/expense";

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    if (body?.error) {
      return body.error;
    }
  } catch {
    // fall through
  }
  return `Request failed (${response.status})`;
}

export async function listCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/categories`);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as Category[];
}

export async function createCategory(name: string): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as Category;
}

export async function renameCategory(
  id: string,
  name: string,
): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}
