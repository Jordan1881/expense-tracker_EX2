import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "../db.js";
import {
  SEED_CATEGORIES,
  SYSTEM_CATEGORY_NAME,
} from "../types/domain.js";

export type CategoryDto = {
  id: string;
  name: string;
  isSystem: boolean;
};

export class CategoryError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CategoryError";
  }
}

function toDto(category: {
  id: string;
  name: string;
  isSystem: boolean;
}): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    isSystem: category.isSystem,
  };
}

function normalizeName(name: unknown): string {
  if (typeof name !== "string") {
    throw new CategoryError("Category name is required", 400);
  }
  const trimmed = name.trim();
  if (!trimmed) {
    throw new CategoryError("Category name cannot be empty", 400);
  }
  return trimmed;
}

export async function seedCategories(
  client: PrismaClient = prisma,
): Promise<void> {
  for (const name of SEED_CATEGORIES) {
    await client.category.upsert({
      where: { name },
      update: {
        isSystem: name === SYSTEM_CATEGORY_NAME,
      },
      create: {
        name,
        isSystem: name === SYSTEM_CATEGORY_NAME,
      },
    });
  }
}

export async function listCategories(): Promise<CategoryDto[]> {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return categories.map(toDto);
}

export async function createCategory(rawName: unknown): Promise<CategoryDto> {
  const name = normalizeName(rawName);

  try {
    const category = await prisma.category.create({
      data: { name, isSystem: false },
    });
    return toDto(category);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new CategoryError("A category with this name already exists", 409);
    }
    throw error;
  }
}

export async function renameCategory(
  id: string,
  rawName: unknown,
): Promise<CategoryDto> {
  const name = normalizeName(rawName);
  const existing = await prisma.category.findUnique({ where: { id } });

  if (!existing) {
    throw new CategoryError("Category not found", 404);
  }
  if (existing.isSystem || existing.name === SYSTEM_CATEGORY_NAME) {
    throw new CategoryError("System category Other cannot be renamed", 403);
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: { name },
    });
    return toDto(category);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new CategoryError("A category with this name already exists", 409);
    }
    throw error;
  }
}

export async function deleteCategory(
  id: string,
): Promise<{ deleted: true; reassignedCount: number }> {
  const existing = await prisma.category.findUnique({ where: { id } });

  if (!existing) {
    throw new CategoryError("Category not found", 404);
  }
  if (existing.isSystem || existing.name === SYSTEM_CATEGORY_NAME) {
    throw new CategoryError("System category Other cannot be deleted", 403);
  }

  const other = await prisma.category.findUnique({
    where: { name: SYSTEM_CATEGORY_NAME },
  });
  if (!other) {
    throw new CategoryError("System category Other is missing", 500);
  }

  const reassignedCount = await prisma.$transaction(async (tx) => {
    const result = await tx.expense.updateMany({
      where: { categoryId: id },
      data: { categoryId: other.id },
    });
    await tx.category.delete({ where: { id } });
    return result.count;
  });

  return { deleted: true, reassignedCount };
}
